# main.py
# To run this backend:
# 1. Ensure you have a MongoDB instance running on mongodb://localhost:27017.
# 2. Install the required libraries:
#    pip install "fastapi[all]" pandas python-multipart motor "bson[ujson]" pydantic==2.*
# 3. Save this code as `main.py`.
# 4. Run the server from your terminal:
#    uvicorn main:app --reload --port 8000
#
# The API will then be available at http://localhost:8000

import json
import os
import random
import io
from typing import List, Dict, Any

import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from bson import ObjectId
from pymongo.errors import ConnectionFailure
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_core import core_schema

# --- MongoDB Connection Details ---
MONGO_DETAILS = "mongodb://localhost:27017"
DB_NAME = "fuelblend_db"

# --- Pydantic Models for Data Validation ---

# Helper for handling MongoDB's ObjectId in Pydantic models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _: core_schema.ValidationInfo):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        # Pydantic v2 way to represent ObjectId in JSON Schema as a string
        return handler(core_schema.string_schema())

class Component(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    properties: List[float]

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Settings(BaseModel):
    isAlwaysOpen: bool
    theme: str
    apiAddress: str

class BlenderPayload(BaseModel):
    name: str
    fraction: float
    properties: List[float]

class ManualBlendRequest(BaseModel):
    components: List[BlenderPayload]

class FractionEstimatorRequest(BaseModel):
    target_properties: List[float]
    components: List[Component]

# --- FastAPI App Initialization ---

app = FastAPI(
    title="FuelBlend AI Backend",
    description="API server for the FuelBlend AI application, connected to MongoDB.",
    version="1.3.2"
)

# --- CORS (Cross-Origin Resource Sharing) ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection Lifecycle ---

@app.on_event("startup")
async def startup_db_client():
    """On startup, connect to the MongoDB database."""
    app.mongodb_client = AsyncIOMotorClient(MONGO_DETAILS)
    app.mongodb = app.mongodb_client[DB_NAME]
    print(f"Connected to MongoDB database: {DB_NAME}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """On shutdown, close the MongoDB connection."""
    app.mongodb_client.close()
    print("MongoDB connection closed.")


# --- API Endpoints ---

@app.get("/api/health", tags=["General"])
async def health_check(request: Request):
    """
    Health check endpoint. Verifies the server is running and can connect to MongoDB.
    """
    try:
        # The ping command is cheap and does not require auth.
        await request.app.mongodb_client.admin.command('ping')
        return {"status": "ok", "message": "FuelBlend AI Backend is running and connected to MongoDB."}
    except ConnectionFailure as e:
        raise HTTPException(status_code=503, detail=f"MongoDB connection failed: {e}")


@app.get("/api/settings", response_model=Settings, tags=["Settings"])
async def get_settings(request: Request):
    """
    Retrieves the current application settings from the database.
    If no settings are found, returns a default configuration.
    """
    settings = await request.app.mongodb.settings.find_one({"_id": "app_settings"})
    if settings:
        return settings
    
    # Provide default settings if none are saved
    return {
        "isAlwaysOpen": False,
        "theme": "system",
        "apiAddress": "http://localhost:8000/api"
    }

@app.post("/api/settings", status_code=200, tags=["Settings"])
async def update_settings(settings: Settings, request: Request):
    """
    Updates and saves the application settings in a single document.
    """
    await request.app.mongodb.settings.update_one(
        {"_id": "app_settings"},
        {"$set": settings.dict()},
        upsert=True
    )
    return {"message": "Settings updated successfully."}

@app.get("/api/components", response_model=List[Component], tags=["Components"])
async def get_components(request: Request):
    """
    Retrieves the list of managed components from the database.
    """
    components = await request.app.mongodb.components.find().to_list(1000)
    return components

@app.post("/api/components", status_code=200, tags=["Components"])
async def update_components(payload: Dict[str, List[Dict]], request: Request):
    """
    Replaces the entire list of managed components in the database.
    """
    components_data = payload.get("managedComponents")
    if components_data is None:
        raise HTTPException(status_code=400, detail="Payload must contain 'managedComponents' key.")
        
    # Clear the existing collection
    await request.app.mongodb.components.delete_many({})
    
    # Insert new components if the list is not empty
    if components_data:
        # Convert string 'id' back to ObjectId for storage if necessary
        for comp in components_data:
            if 'id' in comp and isinstance(comp['id'], str):
                try:
                    comp['_id'] = ObjectId(comp.pop('id'))
                except Exception:
                    # If id is not a valid ObjectId (e.g., from default data), pop it
                    comp.pop('id', None)
        
        await request.app.mongodb.components.insert_many(components_data)

    return {"message": "Components updated successfully."}

@app.delete("/api/components/{component_id}", status_code=200, tags=["Components"])
async def delete_component(component_id: str, request: Request):
    """
    Deletes a single component from the database by its ID.
    """
    if not ObjectId.is_valid(component_id):
        raise HTTPException(status_code=400, detail=f"Invalid component ID: {component_id}")

    delete_result = await request.app.mongodb.components.delete_one({"_id": ObjectId(component_id)})

    if delete_result.deleted_count == 1:
        return {"message": "Component deleted successfully."}

    raise HTTPException(status_code=404, detail=f"Component with ID {component_id} not found.")

@app.post("/api/blend_manual", tags=["Calculations"])
async def blend_manual_properties(request: ManualBlendRequest):
    """
    Simulates the blending of properties for a manually configured set of components.
    """
    blended_properties = [0.0] * 10
    total_fraction = sum(c.fraction for c in request.components)

    if abs(total_fraction - 100.0) > 0.1:
        raise HTTPException(status_code=400, detail="Fractions must sum to 100.")

    for component in request.components:
        for i, prop_value in enumerate(component.properties):
            blended_properties[i] += prop_value * (component.fraction / 100.0)
    
    confidence = random.uniform(0.85, 0.99)
    model_version = "v1.2.3-simulated"

    return {
        "blended_properties": blended_properties,
        "confidence_score": confidence,
        "model_version": model_version
    }

@app.post("/api/blend_batch", tags=["Calculations"])
async def blend_batch_properties(file: UploadFile = File(...)):
    """
    Simulates batch blending of properties from an uploaded CSV file.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")

    try:
        contents = await file.read()
        buffer = io.StringIO(contents.decode('utf-8'))
        df = pd.read_csv(buffer)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV file: {e}")

    results = []
    for index, row in df.iterrows():
        num_props = 10
        blended_props = [random.uniform(0, 100) for _ in range(num_props)]
        confidence = random.uniform(0.85, 0.99)
        
        results.append({
            "blended_properties": blended_props,
            "confidence_score": confidence,
            "model_version": "v1.2.3-simulated-batch"
        })

    return {"results": results}


@app.post("/api/estimate_fractions", tags=["Calculations"])
async def estimate_fractions(request: FractionEstimatorRequest):
    """
    Simulates the estimation of component fractions to meet target properties.
    """
    num_components = len(request.components)
    if num_components == 0:
        raise HTTPException(status_code=400, detail="At least one component is required.")

    fractions = [random.random() for _ in range(num_components)]
    total = sum(fractions)
    normalized_fractions = [(f / total) * 100 for f in fractions]

    estimated_fractions = [
        {"name": comp.name, "fraction": f"{frac:.2f}"}
        for comp, frac in zip(request.components, normalized_fractions)
    ]

    mape_score = f"{random.uniform(1.5, 5.0):.2f}%"

    return {
        "estimated_fractions": estimated_fractions,
        "mape_score": mape_score
    }

# --- How to Run ---
if __name__ == "__main__":
    import uvicorn
    print("--- FuelBlend AI Backend ---")
    print("To run this server, use the command:")
    print("uvicorn main:app --reload --port 8000")
    print("API documentation will be available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
