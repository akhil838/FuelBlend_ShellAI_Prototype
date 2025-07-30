from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import components, predictions, app_data

app = FastAPI(
    title="FuelBlend AI Backend",
    description="API for handling chemical component management and blend predictions.",
    version="1.0.0",
)

# --- CORS Configuration ---
# This is crucial for allowing your React frontend (on localhost:3000)
# to communicate with this backend (on localhost:8000).
origins = [
    "http://localhost",
    "http://localhost:3000",
]

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

# --- Health Check Endpoint ---
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}