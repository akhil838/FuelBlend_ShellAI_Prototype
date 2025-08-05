import sys
import json
import os
import torch
import pandas as pd
import numpy as np
import random
import multiprocessing as mp
from itertools import cycle

# It's critical to re-import and re-define everything this script needs,
# as it runs in a completely separate process.
from celery_worker import TrainedTabPFN, _load_and_predict_worker # Assuming these are in celery_worker.py

def run_predictions():
    # Set the base model directory for TabPFN
    shared_models_dir = os.path.abspath('./model/weights')
    os.environ['TABPFN_MODELS_DIR'] = shared_models_dir

    # 1. Read input data from standard input
    try:
        input_data = json.load(sys.stdin)
        request_data = input_data['request_data']
    except json.JSONDecodeError:
        print(json.dumps({"type": "error", "message": "Invalid JSON input."}), flush=True)
        return

    # Initialize the model definition class (fast, as it only loads paths)
    tabpfn_model = TrainedTabPFN()

    # --- Data Preparation ---
    input_df = {}
    for idx, component in enumerate(request_data.get('components')):
        input_df[f'Component{idx+1}_fraction'] = [float(component.get('fraction')/100)]
        for j in range(1, 11):
            input_df[f'Component{idx+1}_Property{j}'] = [float(component.get('properties')[j-1])]
    
    input_df = pd.DataFrame(input_df, columns=tabpfn_model.input_columns)
    input_df.fillna(0, inplace=True)
    X = tabpfn_model.preprocess(input_df)

    # --- Setup for Parallel Processing ---
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
            task_args = (model_path, model_type, assigned_device, X, used_features, col, fold_idx)
            tasks.append(task_args)
    
    # --- Execute and Report Progress ---
    total_steps = len(tasks)
    results_map = {}
    
    with mp.Pool(processes=num_gpus) as pool:
        for i, result in enumerate(pool.imap_unordered(_load_and_predict_worker, tasks)):
            fold_idx, col_name, prediction = result
            if fold_idx not in results_map:
                results_map[fold_idx] = {}
            results_map[fold_idx][col_name] = prediction
            
            # Print progress update to stdout as a JSON line
            progress = int(((i + 1) / total_steps) * 100)
            print(json.dumps({"type": "progress", "value": progress}), flush=True)

    # --- Re-organize Results ---
    final_pred_list = []
    for fold_idx in range(5):
        fold_preds = [results_map[fold_idx][col] for col in tabpfn_model.target_columns]
        final_pred_list.append(np.array(fold_preds).T)

    # --- Final Processing ---
    final_pred = np.array(final_pred_list)
    final_pred_processed = tabpfn_model.weighted_mean(final_pred)[0]

    final_result = {
        "blended_properties": list(final_pred_processed),
        "confidence_score": random.random(),
        "model_version": "v1.0-async-multiGPU-subprocess"
    }

    # Print the final result to stdout as a JSON line
    print(json.dumps({"type": "result", "data": final_result}), flush=True)


if __name__ == '__main__':
    # Set the multiprocessing start method for this script
    try:
        mp.set_start_method('spawn', force=True)
    except RuntimeError:
        pass
    run_predictions()