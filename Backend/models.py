from pydantic import BaseModel, Field
from typing import List, Optional

# --- Component Models ---
# FIX: The model now expects a simple 'id' field, with no aliasing.
class Component(BaseModel):
    id: str
    name: str
    properties: List[float]

class ComponentCreate(BaseModel):
    id: str
    name: str
    properties: List[float]

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    properties: Optional[List[float]] = None

# --- Prediction Models (No change needed) ---
class BlendComponent(BaseModel):
    name: str
    fraction: float
    properties: List[float]

class BlendManualRequest(BaseModel):
    components: List[BlendComponent]

class EstimateFractionsRequest(BaseModel):
    target_properties: List[float]
    components: List[BlendComponent]
    n_trials: int

# --- App Data Models ---
# FIX: Updated to expect a simple 'id' field.
class SettingsDB(BaseModel):
    id: str
    isAlwaysOpen: bool
    theme: str

# FIX: Updated to expect a simple 'id' field.
class HistoryLog(BaseModel):
    id: str
    type: str
    timestamp: str
    data: dict
    response: Optional[dict] = None