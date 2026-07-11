import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import async_session, get_db
from app.models.message import Message
from app.models.project import Project
from app.schemas.chat import ChatRequest
from app.services.agent import stream_chat_agent

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    project_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY not configured. Set it in .env to enable chat.",
        )

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    user_msg = Message(
        project_id=project_id,
        role="user",
        content=body.message,
        metadata_json="{}",
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)

    result = await db.execute(
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    recent = list(reversed(result.scalars().all()))

    history = [
        {"role": m.role, "content": m.content}
        for m in recent
        if m.id != user_msg.id
    ]

    async def event_generator():
        full_response = ""
        try:
            async for token_json in stream_chat_agent(project_id, history, body.message):
                yield f"data: {token_json}\n\n"
                data = json.loads(token_json)
                if data.get("type") == "text":
                    full_response += data["text"]
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"
        finally:
            if full_response:
                async with async_session() as save_db:
                    assistant_msg = Message(
                        project_id=project_id,
                        role="assistant",
                        content=full_response,
                        metadata_json="{}",
                    )
                    save_db.add(assistant_msg)
                    await save_db.commit()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
