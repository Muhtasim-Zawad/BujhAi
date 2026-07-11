from fastapi import APIRouter

router = APIRouter(prefix="/projects/{project_id}/stats", tags=["stats"])


@router.get("")
async def get_stats(project_id: str):
    return {}
