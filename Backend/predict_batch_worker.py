import sys
import json
import os
import argparse  # We'll use argparse to read command-line arguments
import torch
import pandas as pd
import numpy as np
import random
import multiprocessing as mp
from itertools import cycle

# Make sure these can be imported. They should be in the same directory
# or your Python path.
from celery_worker import TrainedTabPFN, _load_and_predict_worker

def run_batch_predictions():
    # --- 1. Set up argument parser to read the file path ---
    parser = argparse.ArgumentParser(description="Run batch predictions on a CSV file.")
    parser.add_argument("--file-path", required=True, type=str, help="Path to the input CSV file.")
    args = parser.parse_args()

    # --- 2. Initialize model and read data ---
    try:
        # NOTE: The ENV variable is set by the Dockerfile, so no need for os.environ here.
        tabpfn_model = TrainedTabPFN()
        input_df = pd.read_csv(args.file_path)
    except FileNotFoundError:
        print(json.dumps({"type": "error", "message": f"File not found: {args.file_path}"}), flush=True)
        return
    except Exception as e:
        print(json.dumps({"type": "error", "message": f"Error loading data or model: {str(e)}"}), flush=True)
        return

    # --- 3. Preprocess and Set up Parallel Tasks (same as before) ---
    X = tabpfn_model.preprocess(input_df)

    num_gpus = torch.cuda.device_count()
    if num_gpus == 0:
        print(json.dumps({"type": "error", "message": "No GPUs found on worker."}), flush=True)
        return

    devices = [f'cuda:{i}' for i in range(num_gpus)]
    device_cycle = cycle(devices)
    tasks = []
    for fold_idx in range(5):
        for col in tabpfn_model.target_columns:
            model_info, used_features = tabpfn_model.models[col][fold_idx]
            model_path, model_type = model_info
            assigned_device = next(device_cycle)
            # The worker function takes the entire dataframe X
            task_args = (model_path, model_type, assigned_device, X, used_features, col, fold_idx)
            tasks.append(task_args)
            
    # --- 4. Execute, Report Progress, and Re-assemble (same as before) ---
    total_steps = len(tasks)
    results_map = {}
    
    with mp.Pool(processes=num_gpus) as pool:
        for i, result in enumerate(pool.imap_unordered(_load_and_predict_worker, tasks)):
            fold_idx, col_name, prediction = result
            if fold_idx not in results_map:
                results_map[fold_idx] = {}
            results_map[fold_idx][col_name] = prediction
            
            progress = int(((i + 1) / total_steps) * 100)
            print(json.dumps({"type": "progress", "value": progress}), flush=True)

    final_pred_list = []
    for fold_idx in range(5):
        fold_preds = [results_map[fold_idx][col] for col in tabpfn_model.target_columns]
        # Transpose to get shape (n_samples, n_targets)
        final_pred_list.append(np.array(fold_preds).T)

    # --- 5. Final Processing & Formatting for Batch Output ---
    final_pred_np = np.array(final_pred_list)
    # final_pred will have shape (n_samples, n_targets) after weighted mean
    final_pred = tabpfn_model.weighted_mean(final_pred_np)

    # Format the results for each row in the input file
    results_list = []
    for row in final_pred:
        row_result = {
            "blended_properties": list(row),
            "confidence_score": random.random(),
            "model_version": "v1.0-multiGPU-batch"
        }
        results_list.append(row_result)

    # Print the final list of results to stdout
    print(json.dumps({"type": "result", "data": results_list}), flush=True)


if __name__ == '__main__':
    try:
        mp.set_start_method('spawn', force=True)
    except RuntimeError:
        pass
    run_batch_predictions()