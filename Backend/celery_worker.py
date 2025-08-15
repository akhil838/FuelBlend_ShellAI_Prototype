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
from sklearn.metrics import mean_absolute_percentage_error
import optuna

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
    print(request_data)
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
    # This task now DELEGATES the work to the standalone script.
    
    # We pass the data to the script via standard input as a JSON string.
    # We must wrap the request_data to avoid confusion with progress messages.
    target_properties = request_data['target_properties']
    components = request_data['components']
    target_cost = request_data.get('target_cost')
    n_components = len(components)
    n_trials = request_data['n_trials']

    # Build a name->cost map from DB to ensure we have costs even if not sent in request
    try:
        db_components = {c['name']: c.get('cost', 0.0) for c in database.get_all_components()}
    except Exception:
        db_components = {}

    # Command to execute the worker script.
    # Ensure 'python' and 'predict_worker_script.py' are in your system's PATH
    # or use absolute paths.
    def objective(trial, study=None):
        x = []
        for i in range(n_components):
            x.append(- np.log(trial.suggest_float(f"x_{i}", 0, 1)))

        p = []
        for i in range(n_components):
            p.append(x[i] / sum(x))

        # Compute fractions (% for reporting, 0-1 for cost calc)
        for i in range(n_components):
            trial.set_user_attr(f"p_{i}", p[i]*100)
            components[i]['fraction'] = p[i]*100

        # Compute blend cost (weighted sum of component costs)
        comp_costs = []
        for i in range(n_components):
            c = components[i]
            cost_val = c.get('cost')
            if cost_val is None:
                cost_val = db_components.get(c.get('name'), 0.0)
            try:
                cost_val = float(cost_val)
            except Exception:
                cost_val = 0.0
            comp_costs.append(cost_val)
        blend_cost = float(np.dot(p, comp_costs))  # cost per unit volume
        trial.set_user_attr('blend_cost', blend_cost)

        
        payload = json.dumps({"request_data": {'components':components}})
        print(payload)

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
        # Determine current best trial by (MAPE, then Cost)
        try:
            completed = [t for t in study.trials if t.values is not None]
            if completed:
                best_trial = min(completed, key=lambda t: (t.values[0], t.values[1] if len(t.values) > 1 else float('inf')))
                best_value_mape = best_trial.values[0]
                best_value_cost = best_trial.values[1] if len(best_trial.values) > 1 else None
                best_params = best_trial.user_attrs
            else:
                best_value_mape = None
                best_value_cost = None
                best_params = None
        except Exception:
            best_value_mape = None
            best_value_cost = None
            best_params = None
        print(f"Current best values: MAPE={best_value_mape}, Cost={best_value_cost}, params: {best_params}")
    
        # Read the script's output line-by-line to get progress updates.
        while True:
            line = process.stdout.readline()
            if not line:
                break
            
            try:
                # Each line from the script is a JSON object
                message = json.loads(line.strip())
                
                if message.get("type") == "progress":
                    progress_payload = {
                        'mape_score': (best_value_mape/100) if best_value_mape is not None else None,
                        'blend_cost': best_value_cost,
                        'estimated_fractions': [
                            {'name': components[idx]['name'], 'fraction': best_params[f'p_{idx}'] if best_params else None}
                            for idx in range(n_components)
                        ]
                    }
                    # Include savings percent during progress if possible
                    if target_cost and best_value_cost is not None and target_cost != 0:
                        try:
                            savings_pct = (float(target_cost) - float(best_value_cost)) / float(target_cost) * 100.0
                            progress_payload['savings_percent'] = savings_pct
                        except Exception:
                            pass
                    self.update_state(state='PROGRESS', meta={'progress': (((trial.number+(message["value"]/100))/n_trials)*100), 'result': progress_payload})
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
        print(target_properties, final_result['blended_properties'])
        print(trial.user_attrs)
        mape_pct = 100*mean_absolute_percentage_error(target_properties, final_result['blended_properties'])
        # Return two objectives: minimize MAPE and minimize blend cost
        return mape_pct, blend_cost
    study = optuna.create_study(directions=['minimize', 'minimize'])
    study.optimize(lambda trial: objective(trial, study), n_trials=n_trials)

    # Choose final trial by lexicographic order (MAPE first, then Cost)
    completed = [t for t in study.trials if t.values is not None]
    if not completed:
        raise Exception("No successful trials in optimization.")
    best_trial = min(completed, key=lambda t: (t.values[0], t.values[1] if len(t.values) > 1 else float('inf')))
    final_fractions = best_trial.user_attrs
    final_mape = best_trial.values[0]
    final_cost = best_trial.values[1]
    print(final_fractions)
    final_result = {
        "estimated_fractions": [
            {"name": comp['name'], "fraction": final_fractions[f'p_{idx}']}
            for idx, comp in enumerate(request_data['components'])
        ],
        "mape_score": final_mape/100,
        "blend_cost": final_cost
    }
    # Optionally include savings percent if target cost provided
    try:
        if target_cost and float(target_cost) != 0:
            final_result["savings_percent"] = (float(target_cost) - float(final_cost)) / float(target_cost) * 100.0
    except Exception:
        pass
    # Your database logging logic
    database.add_history_log("blender", request_data, final_result)
    
    return {'progress': 100, 'result': final_result}