from fastapi import APIRouter, HTTPException, status
from typing import List
import database, models

router = APIRouter(
    prefix="/components",
    tags=["Components"],
)

@router.get("/", response_model=List[models.Component])
async def read_all_components():
    return database.get_all_components()

@router.post("/", response_model=models.Component, status_code=status.HTTP_201_CREATED)
async def create_component(component: models.ComponentCreate):
    # The component is returned directly after creation
    new_component = database.add_component(component)
    return new_component

@router.put("/{component_id}", response_model=models.Component)
async def update_component(component_id: str, component_update: models.ComponentUpdate):
    updated_component = database.update_component_by_id(component_id, component_update)
    if updated_component is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return updated_component

@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_component(component_id: str):
    if not database.delete_component_by_id(component_id):
        raise HTTPException(status_code=404, detail="Component not found")
    return