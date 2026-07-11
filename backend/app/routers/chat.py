from fastapi import APIRouter

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(project_id: str):
    return {"message": "Not implemented yet"}
