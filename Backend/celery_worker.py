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

tabPFN_model = None
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task(bind=True)
def run_single_prediction(self, request_data):
    global tabPFN_model
    if tabPFN_model is None:
        tabPFN_model = TrainedTabPFN()
    # This is the original task for manual blends (180s)
    print(request_data)
    input_df = {}
    for idx, component in enumerate(request_data.get('components')):
        input_df[f'Component{idx+1}_fraction'] = [float(component.get('fraction')/100)]
        for j in range(1,11):
            input_df[f'Component{idx+1}_Property{j}']  = [float(component.get('properties')[j-1])]

    input_df = pd.DataFrame(input_df, columns=tabPFN_model.input_columns)
    input_df.fillna(0, inplace=True)

    X = tabPFN_model.preprocess(input_df)
    final_pred = []
    total_steps = 50
    curr_step = 0
    # Initialize a list to store predictions for each fold
    for fold_idx in range(5):
        fold_preds = []
        for col in tqdm(tabPFN_model.target_columns):
            fold_preds.append(tabPFN_model.predict_single(X, fold_idx=fold_idx, col=col))  # shape: (n_samples,)
        
            progress = int(((curr_step + 1) / total_steps) * 100)
            curr_step+=1
            self.update_state(state='PROGRESS', meta={'progress': progress})

        # Transpose to shape (n_samples, n_targets)
        fold_preds = np.array(fold_preds).T  # shape: (500, 10)
        print(fold_preds.shape)
        final_pred.append(fold_preds)

    final_pred = np.array(final_pred)  # shape: (5, 500, 10)
    final_pred = tabPFN_model.weighted_mean(final_pred)[0]
    print(final_pred.shape)

    dummy_results = { "blended_properties": list(final_pred), "confidence_score": random.random(), "model_version": "v1.0-async" }
    
    
    database.add_history_log("blender", request_data, dummy_results)

    return {'progress': 100, 'result': dummy_results}

@celery_app.task(bind=True)
def run_batch_prediction(self, file_path: str,original_filename: str):
    """
    Background task to process an uploaded CSV file.
    """
    global tabPFN_model
    if tabPFN_model is None:
        tabPFN_model = TrainedTabPFN()
    results_list = []
    try:
        input_df = pd.read_csv(file_path)

        X = tabPFN_model.preprocess(input_df)
        final_pred = []
        total_steps = 50
        curr_step = 0
        # Initialize a list to store predictions for each fold
        for fold_idx in range(5):
            fold_preds = []
            for col in tqdm(tabPFN_model.target_columns):
                fold_preds.append(tabPFN_model.predict_single(X, fold_idx=fold_idx, col=col))  # shape: (n_samples,)
            
                progress = int(((curr_step + 1) / total_steps) * 100)
                curr_step+=1
                self.update_state(state='PROGRESS', meta={'progress': progress})

            # Transpose to shape (n_samples, n_targets)
            fold_preds = np.array(fold_preds).T  # shape: (500, 10)
            print(fold_preds.shape)
            final_pred.append(fold_preds)

        final_pred = np.array(final_pred)  # shape: (5, 500, 10)
        final_pred = tabPFN_model.weighted_mean(final_pred)
        print(final_pred.shape)

        for row in final_pred:
            # predictions = model.predict(row)
            dummy_result = {
                "blended_properties": list(row),
                "confidence_score": random.random(),
                "model_version": "v1.0-dummy-batch"
            }   
            results_list.append(dummy_result)

        final_result_object = { "results": results_list }
        database.add_history_log(
            "blender_batch", 
            {"filename": original_filename}, 
            final_result_object
        )

        return {'progress': 100, 'result': results_list}
    finally:
        # --- Clean up the temporary file ---
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