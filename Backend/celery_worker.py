from celery import Celery
import time
import random
import csv
import os
import database
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task(bind=True)
def run_single_prediction(self, request_data):
    # This is the original task for manual blends (180s)
    total_steps = 10
    for i in range(total_steps):
        time.sleep(3)
        progress = int(((i + 1) / total_steps) * 100)
        self.update_state(state='PROGRESS', meta={'progress': progress})
    
    dummy_results = { "blended_properties": [random.uniform(0, 100) for _ in range(10)], "confidence_score": random.random(), "model_version": "v1.0-async" }
    database.add_history_log("blender", request_data, dummy_results)

    return {'progress': 100, 'result': dummy_results}

@celery_app.task(bind=True)
def run_batch_prediction(self, file_path: str,original_filename: str):
    """
    Background task to process an uploaded CSV file.
    """
    results_list = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as infile:
            reader = csv.reader(infile)
            header = next(reader)
            rows = list(reader)
            total_rows = len(rows)

        for i, row in enumerate(rows):
            # Simulate a shorter prediction time for each row (e.g., 2 seconds)
            time.sleep(0.005)
            
            # --- Dummy prediction logic for one row ---
            dummy_result = { "blended_properties": [random.uniform(0, 100) for _ in range(10)], "confidence_score": random.random() }
            results_list.append(dummy_result)
            
            # --- Update progress based on rows processed ---
            progress = int(((i + 1) / total_rows) * 100)
            self.update_state(state='PROGRESS', meta={'progress': progress})
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