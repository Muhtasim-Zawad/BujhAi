import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session, get_db
from app.deps import get_current_user
from app.models.message import Message
from app.models.module import Module
from app.models.project import Project
from app.models.module import ModulePoint
from app.schemas.chat import ChatRequest
from app.services.agent import stream_chat_agent
from app.services.excalidraw import parse_scene

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"], dependencies=[Depends(get_current_user)])


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

    canvas_text = ""
    metadata = {}
    if body.canvas_data:
        metadata["canvas_data"] = body.canvas_data
        try:
            elements = json.loads(body.canvas_data)
            canvas_text = parse_scene(elements)
        except (json.JSONDecodeError, Exception):
            canvas_text = body.canvas_data

    user_msg = Message(
        project_id=project_id,
        role="user",
        content=body.message,
        metadata_json=json.dumps(metadata),
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

    mod_result = await db.execute(
        select(Module)
        .options(selectinload(Module.points))
        .where(Module.project_id == project_id)
        .order_by(Module.sort_order)
    )
    modules_data = [
        {
            "id": m.id,
            "title": m.title,
            "points": [
                {"id": p.id, "text": p.text, "checked": p.checked, "sort_order": p.sort_order}
                for p in m.points
            ],
            "sort_order": m.sort_order,
        }
        for m in mod_result.scalars().all()
    ]

    async def event_generator():
        full_response = ""
        try:
            async for token_json in stream_chat_agent(
                project_id, history, body.message, modules_data, canvas_text,
            ):
                yield f"data: {token_json}\n\n"
                data = json.loads(token_json)
                if data.get("type") == "text":
                    full_response += data["text"]
                elif data.get("type") == "module_update":
                    async with async_session() as save_db:
                        for update in data["updates"]:
                            point = await save_db.get(ModulePoint, update["point_id"])
                            if point:
                                point.checked = update["checked"]
                        await save_db.commit()
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
