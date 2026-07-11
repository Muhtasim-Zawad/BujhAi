from fastapi import APIRouter

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
async def list_projects():
    return []


@router.get("/{project_id}")
async def get_project(project_id: str):
    return {"id": project_id}
