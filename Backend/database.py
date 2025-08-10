from pymongo import MongoClient
from typing import List, Dict
import uuid
from datetime import datetime, timezone
from config import settings
from models import Component, ComponentCreate, ComponentUpdate, SettingsDB, HistoryLog

# --- Database Connection ---
client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

# --- Collections ---
component_collection = db.get_collection("components")
history_collection = db.get_collection("history")
settings_collection = db.get_collection("settings")


# --- Helper function to format the document ---
def component_helper(component) -> dict:
    if component:
        component['id'] = str(component['_id'])
        del component['_id']
    return component


# --- Component Functions ---
def seed_defaults_if_empty():
    """Seed the database with default components only once (at startup)."""
    if component_collection.estimated_document_count() == 0:
        defaults = [
            {"_id": "comp-ethanol", "name": "Ethanol", "properties": [0.789, 78.4, 1, 2, 3, 4, 5, 6, 7, 8]},
            {"_id": "comp-water", "name": "Water", "properties": [1.0, 100.0, 9, 8, 7, 6, 5, 4, 3, 2]},
            {"_id": "comp-methanol", "name": "Methanol", "properties": [0.792, 64.7, 2, 3, 4, 5, 6, 7, 8, 9]},
        ]
        try:
            component_collection.insert_many(defaults, ordered=True)
        except Exception:
            pass


def get_all_components() -> List[Dict]:
    return [component_helper(comp) for comp in component_collection.find()]


def add_component(component: ComponentCreate) -> Dict:
    component_dict = component.model_dump()
    component_dict["_id"] = component.id
    component_collection.insert_one(component_dict)
    # Return the formatted document
    return component_helper(component_dict)


def update_component_by_id(component_id: str, component_update: ComponentUpdate) -> Dict:
    update_data = {k: v for k, v in component_update.model_dump().items() if v is not None}
    if not update_data:
        return component_helper(component_collection.find_one({"_id": component_id}))

    result = component_collection.find_one_and_update(
        {"_id": component_id},
        {"$set": update_data},
        return_document=True
    )
    return component_helper(result)


def delete_component_by_id(component_id: str) -> bool:
    result = component_collection.delete_one({"_id": component_id})
    return result.deleted_count > 0


# --- App Data Functions (with similar formatting) ---

def settings_helper(s) -> dict:
    if s:
        s['id'] = str(s['_id'])
        del s['_id']
    return s


def history_helper(h) -> dict:
    if h:
        h['id'] = str(h['_id'])
        del h['_id']
    return h


def get_history() -> List[Dict]:
    return [history_helper(h) for h in history_collection.find().sort("timestamp", -1)]


def add_history_log(log_type: str, data: dict, response_data:dict):
    log_entry = {
        "_id": f"hist_{uuid.uuid4().hex}",
        "type": log_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
        "response": response_data
    }
    history_collection.insert_one(log_entry)


def get_settings() -> Dict:
    settings = settings_collection.find_one({"_id": "app_settings"})
    if not settings:
        default_settings = {"_id": "app_settings", "isAlwaysOpen": False, "theme": "system"}
        settings_collection.insert_one(default_settings)
        return settings_helper(default_settings)
    return settings_helper(settings)


def update_settings(settings_data: SettingsDB) -> Dict:
    # We use by_alias=True here to get {'_id': 'app_settings', ...}
    settings_dict = settings_data.model_dump(by_alias=True)
    settings_collection.update_one(
        {"_id": "app_settings"},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_helper(settings_dict)