from fastapi import APIRouter

router = APIRouter(prefix="/projects/{project_id}/materials", tags=["materials"])


@router.get("")
async def list_materials(project_id: str):
    return []
