from pymongo import MongoClient
from typing import List, Dict
import uuid
from datetime import datetime, timezone
from config import settings
from models import (
    Component, ComponentCreate, ComponentUpdate,
    TargetComponent, TargetComponentCreate, TargetComponentUpdate,
    SettingsDB, HistoryLog
)

# --- Database Connection ---
client = MongoClient(settings.MONGO_URI)
db = client[settings.DB_NAME]

# --- Collections ---
component_collection = db.get_collection("components")
target_component_collection = db.get_collection("target_components")
history_collection = db.get_collection("history")
settings_collection = db.get_collection("settings")


# --- Helper function to format the document ---
def component_helper(component) -> dict:
    if component:
        component['id'] = str(component['_id'])
        # Backward compatibility: ensure cost exists
        if 'cost' not in component:
            component['cost'] = 0.0
        del component['_id']
    return component

def target_component_helper(doc) -> dict:
    if doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc


# --- Component Functions ---
def seed_defaults_if_empty():
    """Seed the database with default components only once (at startup)."""
    if component_collection.estimated_document_count() == 0:
        defaults = [
            {"_id": "comp-ethanol", "name": "Ethanol", "cost": 0.75, "properties": [0.832, 79.3, 5, 2, 8, 4, 1, 7, 6, 3]},
            {"_id": "comp-methanol", "name": "Methanol", "cost": 0.45, "properties": [0.791, 65.4, 7, 1, 9, 4, 3, 6, 5, 2]},
            {"_id": "comp-n-decane", "name": "n-Decane", "cost": 1.20, "properties": [0.730, 174.1, 8, 4, 5, 2, 6, 7, 9, 3]},
            {"_id": "comp-iso-octane", "name": "Iso-octane", "cost": 1.50, "properties": [0.692, 99.2, 3, 7, 8, 2, 5, 1, 9, 4]},
            {"_id": "comp-toluene", "name": "Toluene", "cost": 0.95, "properties": [0.867, 110.6, 4, 5, 9, 7, 2, 8, 6, 1]},
            {"_id": "comp-methylcyclohexane", "name": "Methylcyclohexane", "cost": 1.80, "properties": [0.770, 101.1, 2, 6, 8, 1, 5, 9, 3, 7]},
            {"_id": "comp-trimethylbenzene", "name": "Trimethylbenzene", "cost": 2.10, "properties": [0.876, 164.7, 9, 3, 7, 5, 2, 8, 6, 4]},
            {"_id": "comp-n-dodecane", "name": "n-Dodecane", "cost": 1.35, "properties": [0.749, 216.2, 6, 8, 4, 9, 3, 2, 5, 7]},
            {"_id": "comp-ethylbenzene", "name": "Ethylbenzene", "cost": 1.10, "properties": [0.867, 136.2, 7, 9, 2, 5, 4, 3, 8, 1]},
            {"_id": "comp-hefa-spk", "name": "HEFA-SPK (Hydroprocessed Esters and Fatty Acids)", "cost": 1.2, "properties": [0.78, 230.0, 5, 6, 7, 8, 9, 10, 11, 12]},  # $1.2–$1.5/L
            {"_id": "comp-atj-spk", "name": "ATJ-SPK (Alcohol-to-Jet Synthetic Paraffinic Kerosene)", "cost": 1.6, "properties": [0.80, 240.0, 6, 7, 8, 9, 10, 11, 12, 13]},  # $1.5–$2.0/L
            {"_id": "comp-sak", "name": "SAK (Synthetic Aromatic Kerosene)", "cost": 2.1, "properties": [0.82, 250.0, 7, 8, 9, 10, 11, 12, 13, 14]},  # $2.0–$2.3/L
            {"_id": "comp-lignin-hc", "name": "Lignin-derived Hydrocarbons", "cost": 1.8, "properties": [0.85, 260.0, 8, 9, 10, 11, 12, 13, 14, 15]},  # $1.7–$2.0/L
            {"_id": "comp-cfp-cycloalkanes", "name": "CFP-derived Cycloalkanes", "cost": 1.9, "properties": [0.83, 245.0, 9, 10, 11, 12, 13, 14, 15, 16]},  # $1.8–$2.1/L
            {"_id": "comp-camelina-oil", "name": "Camelina Oil Biofuel", "cost": 1.4, "properties": [0.79, 235.0, 10, 11, 12, 13, 14, 15, 16, 17]},  # $1.3–$1.6/L
        ]
        try:
            component_collection.insert_many(defaults, ordered=True)
        except Exception:
            pass

    # Seed a default target component if empty
    if target_component_collection.estimated_document_count() == 0:
        default_target = [
            # --- Fuels (USD/L approximations as of Aug 2025) ---
            {"_id": "fuel-jet-a", "name": "Jet A", "cost": 0.56, "properties": [0.804, -47.0, 6, 3, 9, 1, 8, 4, 7, 5]},
            {"_id": "fuel-jet-a1", "name": "Jet A-1", "cost": 0.547, "properties": [0.802, -47.8, 7, 2, 5, 9, 4, 8, 3, 6]},
            {"_id": "fuel-jp8", "name": "JP-8", "cost": 0.55, "properties": [0.804, -47.5, 4, 6, 8, 1, 5, 9, 7, 3]},
            {"_id": "fuel-jp5", "name": "JP-5", "cost": 0.58, "properties": [0.816, -46.0, 5, 7, 2, 9, 8, 1, 3, 4]},
            {"_id": "fuel-avgas-100ll", "name": "Avgas 100LL", "cost": 1.25, "properties": [0.720, -58.0, 9, 4, 1, 7, 5, 2, 8, 3]},
            {"_id": "fuel-saf", "name": "Sustainable Aviation Fuel", "cost": 0.90, "properties": [0.780, -48.5, 6, 9, 3, 4, 8, 2, 1, 5]}
        ]
        try:
            target_component_collection.insert_many(default_target, ordered=True)
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


# --- Target Component Functions ---
def get_all_target_components() -> List[Dict]:
    return [target_component_helper(tc) for tc in target_component_collection.find()]


def add_target_component(component: TargetComponentCreate) -> Dict:
    comp_dict = component.model_dump()
    comp_dict["_id"] = component.id
    target_component_collection.insert_one(comp_dict)
    return target_component_helper(comp_dict)


def update_target_component_by_id(component_id: str, update: TargetComponentUpdate) -> Dict:
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        return target_component_helper(target_component_collection.find_one({"_id": component_id}))

    result = target_component_collection.find_one_and_update(
        {"_id": component_id},
        {"$set": update_data},
        return_document=True
    )
    return target_component_helper(result)


def delete_target_component_by_id(component_id: str) -> bool:
    result = target_component_collection.delete_one({"_id": component_id})
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