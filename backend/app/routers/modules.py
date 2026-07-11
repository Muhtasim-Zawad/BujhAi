from fastapi import APIRouter

router = APIRouter(prefix="/projects/{project_id}/modules", tags=["modules"])


@router.get("")
async def list_modules(project_id: str):
    return []
