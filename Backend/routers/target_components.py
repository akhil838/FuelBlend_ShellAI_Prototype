from fastapi import APIRouter, HTTPException, status
from typing import List
import database, models

router = APIRouter(
    prefix="/target_components",
    tags=["Target Components"],
)

@router.get("/", response_model=List[models.TargetComponent])
async def read_all_target_components():
    return database.get_all_target_components()

@router.post("/", response_model=models.TargetComponent, status_code=status.HTTP_201_CREATED)
async def create_target_component(component: models.TargetComponentCreate):
    new_component = database.add_target_component(component)
    return new_component

@router.put("/{component_id}", response_model=models.TargetComponent)
async def update_target_component(component_id: str, component_update: models.TargetComponentUpdate):
    updated_component = database.update_target_component_by_id(component_id, component_update)
    if updated_component is None:
        raise HTTPException(status_code=404, detail="Target component not found")
    return updated_component

@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target_component(component_id: str):
    if not database.delete_target_component_by_id(component_id):
        raise HTTPException(status_code=404, detail="Target component not found")
    return
