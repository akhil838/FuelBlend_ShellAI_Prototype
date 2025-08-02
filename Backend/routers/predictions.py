from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import random
import csv
import io
import database, models

router = APIRouter(
    tags=["Predictions"],
)


@router.post("/blend_manual")
async def blend_properties_manual(request: models.BlendManualRequest):
    # Placeholder for actual model prediction
    # predictions = model.predict(...)

    # Dummy result generation
    dummy_results = {
        "blended_properties": [random.uniform(0, 100) for _ in range(10)],
        "confidence_score": random.random(),
        "model_version": "v1.0-dummy"
    }

    # Add to history
    database.add_history_log("blender", request.model_dump(), dummy_results)

    return dummy_results


@router.post("/blend_batch")
async def blend_properties_batch(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    # Placeholder for batch prediction logic
    # In a real app, you might pass the whole file to a processing job
    # or stream it to the model.

    # Dummy result generation by reading the CSV
    results_list = []
    contents = await file.read()
    buffer = io.StringIO(contents.decode('utf-8'))
    reader = csv.reader(buffer)
    next(reader)  # Skip header row

    for row in reader:
        # predictions = model.predict(row)
        dummy_result = {
            "blended_properties": [random.uniform(0, 100) for _ in range(10)],
            "confidence_score": random.random(),
            "model_version": "v1.0-dummy-batch"
        }
        results_list.append(dummy_result)

    # Add to history
    database.add_history_log("blender_batch", {"filename": file.filename, "rows": len(results_list)})

    return {"results": results_list}


@router.post("/estimate_fractions")
async def estimate_fractions(request: models.EstimateFractionsRequest):
    # Placeholder for actual model prediction
    # predictions = model.predict(...)
    print(request)
    num_components = len(request.components)
    fractions = [random.random() for _ in range(num_components)]
    total = sum(fractions)
    normalized_fractions = [f / total * 100 for f in fractions]

    # Dummy result generation
    dummy_results = {
        "estimated_fractions": [
            {"name": comp.name, "fraction": frac}
            for comp, frac in zip(request.components, normalized_fractions)
        ],
        "mape_score": random.uniform(0.01, 0.2)
    }

    # Add to history
    database.add_history_log("estimator", request.model_dump(), dummy_results)

    return dummy_results