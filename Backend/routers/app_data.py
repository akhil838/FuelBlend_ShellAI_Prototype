from fastapi import APIRouter
from typing import List
import database, models

router = APIRouter(
    tags=["Application Data"],
)

@router.get("/history", response_model=List[models.HistoryLog])
async def read_history():
    return database.get_history()

# FIX: Changed response_model to models.SettingsDB
@router.get("/settings", response_model=models.SettingsDB)
async def read_settings():
    return database.get_settings()

# FIX: Changed response_model and type hint to models.SettingsDB
@router.post("/settings", response_model=models.SettingsDB)
async def write_settings(settings: models.SettingsDB):
    return database.update_settings(settings)