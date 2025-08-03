from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List
import random
import csv
import uuid
import os
import io
import database, models
from celery_worker import run_single_prediction, run_batch_prediction, run_fraction_estimation
from celery.result import AsyncResult
import pandas as pd

router = APIRouter(
    tags=["Predictions"],
)

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
input_columns = ['Component1_fraction','Component2_fraction','Component3_fraction','Component4_fraction','Component5_fraction','Component1_Property1','Component2_Property1','Component3_Property1','Component4_Property1','Component5_Property1','Component1_Property2','Component2_Property2','Component3_Property2','Component4_Property2','Component5_Property2','Component1_Property3','Component2_Property3','Component3_Property3','Component4_Property3','Component5_Property3','Component1_Property4','Component2_Property4','Component3_Property4','Component4_Property4','Component5_Property4','Component1_Property5','Component2_Property5','Component3_Property5','Component4_Property5','Component5_Property5','Component1_Property6','Component2_Property6','Component3_Property6','Component4_Property6','Component5_Property6','Component1_Property7','Component2_Property7','Component3_Property7','Component4_Property7','Component5_Property7','Component1_Property8','Component2_Property8','Component3_Property8','Component4_Property8','Component5_Property8','Component1_Property9','Component2_Property9','Component3_Property9','Component4_Property9','Component5_Property9','Component1_Property10','Component2_Property10','Component3_Property10','Component4_Property10','Component5_Property10']
    
@router.post("/predict/blend_manual")
async def start_manual_blend(request: models.BlendManualRequest):
    """
    Starts the long prediction task in the background and returns a job ID.
    """
    # Start the Celery task and pass the request data
    task = run_single_prediction.delay(request.model_dump())
    # Immediately return the task's ID
    return JSONResponse({"job_id": task.id})

@router.post("/predict/blend_batch")
async def start_batch_blend(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type.")

    # Save the uploaded file to a temporary location
    file_path = os.path.join(UPLOADS_DIR, f"{uuid.uuid4().hex}_{file.filename}")
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    input_df = pd.read_csv(file_path)

    for col in input_columns:
        if col not in input_df.columns:
            raise HTTPException(status_code=400, detail=f"Wrong Format, make sure the column names are correct. ({col})")

    # Start the batch prediction task with the file path
    task = run_batch_prediction.delay(file_path, file.filename)
    return JSONResponse({"job_id": task.id})

@router.post("/predict/estimate_fractions")
async def start_fraction_estimation(request: models.EstimateFractionsRequest):
    task = run_fraction_estimation.delay(request.model_dump())
    return JSONResponse({"job_id": task.id})

@router.get("/predict/status/{job_id}")
async def get_task_status(job_id: str):
    """
    Checks the status of a background job.
    """
    task_result = AsyncResult(job_id, app=run_single_prediction.app)
    
    if task_result.state == 'PROGRESS':
        return JSONResponse({
            "status": task_result.state,
            "progress": task_result.info.get('progress', 0)
        })
    elif task_result.state == 'SUCCESS':
        return JSONResponse({
            "status": task_result.state,
            "progress": 100,
            "result": task_result.result.get('result')
        })
    
    return JSONResponse({"status": task_result.state, "progress": 0})


# @router.post("/blend_manual")
# async def blend_properties_manual(request: models.BlendManualRequest):
#     # Placeholder for actual model prediction
#     # predictions = model.predict(...)

#     # Dummy result generation
#     dummy_results = {
#         "blended_properties": [random.uniform(0, 100) for _ in range(10)],
#         "confidence_score": random.random(),
#         "model_version": "v1.0-dummy"
#     }

#     # Add to history
#     database.add_history_log("blender", request.model_dump(), dummy_results)

#     return dummy_results


# @router.post("/blend_batch")
# async def blend_properties_batch(file: UploadFile = File(...)):
#     if not file.filename.endswith('.csv'):
#         raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

#     # Placeholder for batch prediction logic
#     # In a real app, you might pass the whole file to a processing job
#     # or stream it to the model.

#     # Dummy result generation by reading the CSV
#     results_list = []
#     contents = await file.read()
#     buffer = io.StringIO(contents.decode('utf-8'))
#     reader = csv.reader(buffer)
#     next(reader)  # Skip header row

#     for row in reader:
#         # predictions = model.predict(row)
#         dummy_result = {
#             "blended_properties": [random.uniform(0, 100) for _ in range(10)],
#             "confidence_score": random.random(),
#             "model_version": "v1.0-dummy-batch"
#         }
#         results_list.append(dummy_result)

#     # Add to history
#     database.add_history_log("blender_batch", {"filename": file.filename, "rows": len(results_list)})

#     return {"results": results_list}


# @router.post("/estimate_fractions")
# async def estimate_fractions(request: models.EstimateFractionsRequest):
#     # Placeholder for actual model prediction
#     # predictions = model.predict(...)
#     print(request)
#     num_components = len(request.components)
#     fractions = [random.random() for _ in range(num_components)]
#     total = sum(fractions)
#     normalized_fractions = [f / total * 100 for f in fractions]

#     # Dummy result generation
#     dummy_results = {
#         "estimated_fractions": [
#             {"name": comp.name, "fraction": frac}
#             for comp, frac in zip(request.components, normalized_fractions)
#         ],
#         "mape_score": random.uniform(0.01, 0.2)
#     }

#     # Add to history
#     database.add_history_log("estimator", request.model_dump(), dummy_results)

#     return dummy_results