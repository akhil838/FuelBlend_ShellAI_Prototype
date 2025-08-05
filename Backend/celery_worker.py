from celery import Celery
import time
import random
import csv
import os
import database
from model.trained_tabpfn import TrainedTabPFN
from tqdm import tqdm, trange
import numpy as np
import pandas as pd
import subprocess
import torch
import multiprocessing as mp
from itertools import cycle
from pathlib import Path
from tabpfn.model.loading import (
    load_fitted_tabpfn_model,
    save_fitted_tabpfn_model,
)
import json
import pickle

tabPFN_model = None
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
celery_app = Celery(
    "tasks",
    broker=redis_url,
    backend=redis_url
)



# It's a good practice to set the start method for multiprocessing, especially with CUDA.
# 'spawn' creates a fresh process and is safer for GPU resources.
# Place this at the beginning of your script execution context.
try:
    mp.set_start_method('spawn', force=True)
except RuntimeError:
    pass

# --- WORKER FUNCTION ---
# This function will be executed in a separate process.
def _load_and_predict_worker(args):
    """
    Worker function to load a model on a specific device and run a prediction.
    """
    model_path, model_type, device, X_df, used_features, col_name, fold_idx = args

    # 1. Load the model onto the assigned GPU
    if model_type == 'tabpfn':
        model = load_fitted_tabpfn_model(Path(model_path), device=device)
    elif model_type == 'pickle':
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        # Manually move the model to the target device if it's a PyTorch model
        if hasattr(model, 'to'):
            model.to(device)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # 2. Prepare data (same logic as before)
    X_test = X_df.drop(used_features + (['ID'] if 'ID' in X_df.columns else []), axis=1)

    # 3. Predict
    prediction = model.predict(X_test)

    # 4. Return the result along with identifiers to re-assemble later
    return (fold_idx, col_name, prediction)

# Assume celery_app and TrainedTabPFN are defined
# and a global tabPFN_model instance is initialized elsewhere.


@celery_app.task(bind=True)
def run_single_prediction(self, request_data):
    # This task now DELEGATES the work to the standalone script.
    
    # We pass the data to the script via standard input as a JSON string.
    # We must wrap the request_data to avoid confusion with progress messages.
    payload = json.dumps({"request_data": request_data})
    
    # Command to execute the worker script.
    # Ensure 'python' and 'predict_worker_script.py' are in your system's PATH
    # or use absolute paths.
    command = ['python3', 'predict_worker_script.py']
    
    final_result = None
    
    # Use Popen to have real-time communication for progress updates.
    process = subprocess.Popen(
        command,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True, # Work with text streams (encoding handled automatically)
    )

    # Write the payload to the script's stdin and close it.
    process.stdin.write(payload)
    process.stdin.close()
    
    # Read the script's output line-by-line to get progress updates.
    while True:
        line = process.stdout.readline()
        if not line:
            break
        
        try:
            # Each line from the script is a JSON object
            message = json.loads(line.strip())
            
            if message.get("type") == "progress":
                self.update_state(state='PROGRESS', meta={'progress': message["value"]})
            elif message.get("type") == "result":
                final_result = message["data"]
            elif message.get("type") == "error":
                # Propagate the error from the subprocess
                raise Exception(f"Prediction script error: {message.get('message')}")
        
        except (json.JSONDecodeError, KeyError) as e:
            # Handle malformed output from the script
            print(f"Warning: Could not parse line from subprocess: {line.strip()}. Error: {e}")

    # Wait for the process to terminate and get any errors
    process.wait()
    if process.returncode != 0:
        stderr_output = process.stderr.read()
        raise Exception(f"Prediction script failed with exit code {process.returncode}:\n{stderr_output}")
        
    if final_result is None:
        raise Exception("Prediction script finished without producing a result.")

    # Your database logging logic
    database.add_history_log("blender", request_data, final_result)
    
    return {'progress': 100, 'result': final_result}

@celery_app.task(bind=True)
def run_batch_prediction(self, file_path: str, original_filename: str):
    """
    Background task to process an uploaded CSV file using a separate, multi-GPU process.
    """
    global tabPFN_model
    if tabPFN_model is None:
        # This is a lightweight initialization of paths, so it's fine here.
        tabPFN_model = TrainedTabPFN()

    final_result_list = None
    try:
        # --- 1. Command to execute the worker script with the file path ---
        command = ['python3', 'predict_batch_worker.py', '--file-path', file_path]
        
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE,  # stdin is not used, but Popen requires it
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        # We are not writing to stdin, so we can close it immediately.
        process.stdin.close()
        
        # --- 2. Read progress and results from the script's output ---
        while True:
            line = process.stdout.readline()
            if not line:
                break
            
            try:
                message = json.loads(line.strip())
                
                if message.get("type") == "progress":
                    self.update_state(state='PROGRESS', meta={'progress': message["value"]})
                elif message.get("type") == "result":
                    final_result_list = message["data"] # This will be a list of dicts
                elif message.get("type") == "error":
                    raise Exception(f"Prediction script error: {message.get('message')}")
            
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Warning: Could not parse line from subprocess: {line.strip()}. Error: {e}")

        # --- 3. Wait for process to finish and check for errors ---
        process.wait()
        if process.returncode != 0:
            stderr_output = process.stderr.read()
            raise Exception(f"Prediction script failed with exit code {process.returncode}:\n{stderr_output}")
            
        if final_result_list is None:
            raise Exception("Prediction script finished without producing a result.")

        # --- 4. Log to database and return final result ---
        database.add_history_log(
            "blender_batch", 
            {"filename": original_filename}, 
            {"results": final_result_list}
        )

        return {'progress': 100, 'result': final_result_list}

    finally:
        # --- IMPORTANT: Clean up the temporary file regardless of success or failure ---
        if os.path.exists(file_path):
            os.remove(file_path)

@celery_app.task(bind=True)
def run_fraction_estimation(self, request_data):
    """
    Background task for fraction estimation.
    """
    global tabPFN_model
    if tabPFN_model is None:
        tabPFN_model = TrainedTabPFN()
    total_steps = 10
    for i in range(total_steps):
        # Simulate work (e.g., 10 seconds total)
        time.sleep(0.1)
        progress = int(((i + 1) / total_steps) * 100)
        self.update_state(state='PROGRESS', meta={'progress': progress})
    
    # Generate final dummy result
    num_components = len(request_data['components'])
    fractions = [random.random() for _ in range(num_components)]
    total = sum(fractions)
    normalized_fractions = [f / total * 100 for f in fractions]
    
    dummy_results = {
        "estimated_fractions": [
            {"name": comp['name'], "fraction": frac}
            for comp, frac in zip(request_data['components'], normalized_fractions)
        ],
        "mape_score": random.uniform(0.01, 0.2)
    }

    database.add_history_log("estimator", request_data, dummy_results)
    return {'progress': 100, 'result': dummy_results}