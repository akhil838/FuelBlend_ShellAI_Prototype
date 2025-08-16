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
            {"_id": "comp-ethanol", "name": "Ethanol", "cost": 0.75, "properties": [-0.0217822396792892, -1.2297994570374900, -0.3933220542636420, -3.082937535673650, -1.4100492612241600, -1.4833331178815400,-0.4687331134214370, 0.1321549212547530, -0.9179915882721280, -0.636394315804448]},
            {"_id": "comp-methanol", "name": "Methanol", "cost": 0.45, "properties": [
            1.981250612007180, -0.5802742850352100, 0.2211892949766070, 
            -1.763084912416030, 0.0517794851298262, -1.7483585370025700, 
            -1.31767543026822, 0.2212368959470620, -0.274703522878247, 
            -1.244962923296730
        ]},
            {"_id": "comp-n-decane", "name": "n-Decane", "cost": 1.20, "properties": [
            0.0200356225325539, 0.1339980409881220, 0.6561035770666950, 
            0.9845148240213170, 1.0058244730685200, 1.503443262771480, 
            -0.5093797968821360, 0.2938149021199540, 0.5133255022814380, 
            -1.355050374548410
        ]},
            {"_id": "comp-iso-octane", "name": "Iso-octane", "cost": 1.50, "properties": [
            0.1403151240546650, 0.8178351791469260, 0.0744610778539929, 
            -1.548114528493190, -0.4308684687946810, 0.0230426400472773, 
            -0.4687331134214370, -0.1157528896007360, 0.4803682412455970, 
            -0.3144230915121410
        ]},
            {"_id": "comp-toluene", "name": "Toluene", "cost": 0.95, "properties": [
            1.0320288631056800, 0.2161163880813470, -3.082937535673650, 
            -1.654289586844630, 1.7436077217701300, 1.741302611356340, 
            0.1321549212547530, 0.2938149021199540, 1.04496703449017, 
            0.9935934282505180
        ]},
            {"_id": "comp-methylcyclohexane", "name": "Methylcyclohexane", "cost": 1.80, "properties": [
            -0.224339175550124, -1.0750411690639600, -0.6910839778839000,
            -2.086526231483400, -0.1753814141904840, -0.2221447155809070,
            0.9886431556783070, 0.7957898768192030, 0.9483376214120800,
            -1.160434823956430
        ]},
            {"_id": "comp-trimethylbenzene", "name": "Trimethylbenzene", "cost": 2.10, "properties": [
            1.148036331804600, 0.8928350204710320, -0.2556195861148260,
            -1.8697094775947200, -0.3753397560047380, 0.3441092851022620,
            -1.2046705231057200, 0.2484766060383550, 0.8126208896050660,
            -0.0142761845479105
        ]},
            {"_id": "comp-n-dodecane", "name": "n-Dodecane", "cost": 1.35, "properties": [
            -1.1078401803658800, 1.363473423158210, 1.2707759830566400,
            0.8962340963463650, 1.0819671073312000, 0.7033652155074250,
            0.366540154136562, 0.1250721018444600, -0.5747243802670770,
            -0.1359676232853180
        ]},
            {"_id": "comp-ethylbenzene", "name": "Ethylbenzene", "cost": 1.10, "properties": [
            0.1495331036848680, -1.7436841389688300, -0.3337982125079790,
            -1.541201926571140, -0.0172813586391238, -0.7371210291322940,
            0.366540154136562, -1.958826206935640, -0.8079230943016030,
            -1.221155411823990
        ]},
            {"_id": "comp-hefa-spk", "name": "HEFA-SPK (Hydroprocessed Esters and Fatty Acids)", "cost": 1.2, "properties": [
            -0.3540001026395300, 1.273144089164730, -2.086526231483400,
            -0.2447368837854070, -1.9137000829724400, -0.4367472466332150,
            0.2484766060383550, -0.0196028435328016, 0.1487146875945140,
            -1.257481312010730
        ]},  # $1.2–$1.5/L
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
            {"_id": "fuel-jet-a", "name": "Jet A", "cost": 0.56, "properties": [
            -2.7289283361006500, 0.4891432533865900, 0.6075885327363490, 
            0.3216703677115310, -1.2360546972600900, 1.6011320973053900, 
            1.3846623618741000, 0.3058495749984990, 0.1934599398371540, 
            0.5803742494278270
        ]},
            {"_id": "fuel-jet-a1", "name": "Jet A-1", "cost": 0.547, "properties": [
            -1.4752827417741200, -0.437385065829467, -1.4029112792401800,
            0.1479412457250040, -1.1432437104946200, -0.4391713367454620,
            -1.3790407671247700, -1.2809886853631200, -0.5036254895836160,
            -0.5036254895836160
        ]},
            {"_id": "fuel-jp8", "name": "JP-8", "cost": 0.55, "properties": [
            0.804, -4.75, 4, 6, 8, 1, 5, 9, 7, 3
        ]},
            {"_id": "fuel-jp5", "name": "JP-5", "cost": 0.58, "properties": [
            0.816, -0.60, 5, 7, 2, 0.9, 0.8, 1, 3, 4
        ]},
            {"_id": "fuel-avgas-100ll", "name": "Avgas 100LL", "cost": 1.25, "properties": [
            0.720, -0.58, 9, 4, 1, 7, 5, 2, 8, 3
        ]},
            {"_id": "fuel-saf", "name": "Sustainable Aviation Fuel", "cost": 0.90, "properties": [
            0.780, -2.5, 2, -1, 3, 0.4, 0.8, 2, 1, 5
        ]}
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