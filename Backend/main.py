from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import components, predictions, app_data, target_components
import database

app = FastAPI(
    title="FuelBlend AI Backend",
    description="API for handling chemical component management and blend predictions.",
    version="1.0.0",
)

# --- CORS Configuration ---
# This is crucial for allowing your React frontend (on localhost:3000)
# to communicate with this backend (on localhost:8000).
origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(components.router)
app.include_router(predictions.router)
app.include_router(app_data.router)
app.include_router(target_components.router)

# --- Startup Event: seed default components once ---
@app.on_event("startup")
async def startup_seed():
    database.seed_defaults_if_empty()

# --- Health Check Endpoint ---
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}