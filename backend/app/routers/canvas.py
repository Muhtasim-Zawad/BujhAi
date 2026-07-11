from fastapi import APIRouter

router = APIRouter(prefix="/projects/{project_id}/canvas", tags=["canvas"])


@router.get("")
async def get_canvas(project_id: str):
    return {}
