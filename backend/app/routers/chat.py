import datetime
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session, get_db
from app.deps import get_current_user, get_enrollment_role, verify_project_access
from app.models.enrollment import ProjectEnrollment
from app.models.message import Message
from app.models.module import Module
from app.models.project import Project
from app.models.module import ModulePoint
from app.models.user import User
from app.models.user_point_progress import UserPointProgress
from app.schemas.chat import ChatRequest
from app.services.agent import stream_chat_agent
from app.services.excalidraw import parse_scene
from app.utils import nanoid

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"], dependencies=[Depends(get_current_user)])


@router.get("/messages")
async def get_messages(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _: Project = Depends(verify_project_access),
):
    role = await get_enrollment_role(project_id, user.id, db)
    if role == "owner":
        result = await db.execute(
            select(Message)
            .where(Message.project_id == project_id, Message.user_id.is_(None))
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(20)
        )
    elif role == "student":
        result = await db.execute(
            select(Message)
            .where(Message.project_id == project_id, Message.user_id == user.id)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(20)
        )
    else:
        return []
    messages = list(reversed(result.scalars().all()))
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "metadata_json": m.metadata_json,
        }
        for m in messages
    ]


@router.post("/stream")
async def chat_stream(
    project_id: str,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY not configured. Set it in .env to enable chat.",
        )

    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    role = await get_enrollment_role(project_id, user.id, db)
    if role is None:
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
        user_id=user.id if role == "student" else None,
        role="user",
        content=body.message,
        metadata_json=json.dumps(metadata),
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)

    if role == "owner":
        result = await db.execute(
            select(Message)
            .where(Message.project_id == project_id, Message.user_id.is_(None))
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(20)
        )
    else:
        result = await db.execute(
            select(Message)
            .where(Message.project_id == project_id, Message.user_id == user.id)
            .order_by(Message.created_at.desc(), Message.id.desc())
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
    modules_data = []
    for m in mod_result.scalars().all():
        points = []
        for p in m.points:
            checked = p.checked
            if role == "student":
                progress_result = await db.execute(
                    select(UserPointProgress.checked).where(
                        UserPointProgress.user_id == user.id,
                        UserPointProgress.point_id == p.id,
                    )
                )
                student_checked = progress_result.scalar_one_or_none()
                checked = student_checked if student_checked is not None else False
            points.append({
                "id": p.id,
                "text": p.text,
                "checked": checked,
                "sort_order": p.sort_order,
            })
        modules_data.append({
            "id": m.id,
            "title": m.title,
            "points": points,
            "sort_order": m.sort_order,
        })

    async def event_generator():
        evaluator_text = ""
        student_text = ""
        current_phase = None
        try:
            async for token_json in stream_chat_agent(
                project_id, history, body.message, modules_data, canvas_text,
            ):
                yield f"data: {token_json}\n\n"
                data = json.loads(token_json)
                tp = data.get("type")
                if tp == "evaluator_start":
                    current_phase = "evaluator"
                elif tp == "student_start":
                    current_phase = "student"
                elif tp == "text":
                    if current_phase == "evaluator":
                        evaluator_text += data["text"]
                    elif current_phase == "student":
                        student_text += data["text"]
                elif tp == "module_update":
                    async with async_session() as save_db:
                        for update in data["updates"]:
                            point = await save_db.get(ModulePoint, update["point_id"])
                            if not point:
                                mod_id = update.get("module_id")
                                txt = update.get("point_id", "").strip()
                                stmt = select(ModulePoint).where(
                                    ModulePoint.module_id == mod_id,
                                    ModulePoint.text == txt,
                                )
                                result = await save_db.execute(stmt)
                                point = result.scalar_one_or_none()
                            if point and role == "owner":
                                point.checked = update["checked"]
                            elif point and role == "student":
                                progress_result = await save_db.execute(
                                    select(UserPointProgress).where(
                                        UserPointProgress.user_id == user.id,
                                        UserPointProgress.point_id == point.id,
                                    )
                                )
                                progress = progress_result.scalar_one_or_none()
                                if progress:
                                    progress.checked = update["checked"]
                                else:
                                    progress = UserPointProgress(
                                        id=nanoid(),
                                        user_id=user.id,
                                        point_id=point.id,
                                        checked=update["checked"],
                                    )
                                    save_db.add(progress)
                        await save_db.commit()
                        if role == "student":
                            total = await save_db.scalar(
                                select(func.count())
                                .select_from(ModulePoint)
                                .join(Module)
                                .where(Module.project_id == project_id)
                            )
                            completed = await save_db.scalar(
                                select(func.count())
                                .select_from(UserPointProgress)
                                .where(
                                    UserPointProgress.user_id == user.id,
                                    UserPointProgress.checked == True,
                                )
                                .join(ModulePoint, UserPointProgress.point_id == ModulePoint.id)
                                .join(Module)
                                .where(Module.project_id == project_id)
                            )
                            if total and completed is not None and completed >= total:
                                result = await save_db.execute(
                                    select(ProjectEnrollment).where(
                                        ProjectEnrollment.project_id == project_id,
                                        ProjectEnrollment.user_id == user.id,
                                    )
                                )
                                enrollment = result.scalar_one_or_none()
                                if enrollment and not enrollment.completed_at:
                                    enrollment.completed_at = datetime.datetime.utcnow()
                                    await save_db.commit()
                                yield json.dumps({"type": "course_complete"})
                        elif role == "owner":
                            total = await save_db.scalar(
                                select(func.count())
                                .select_from(ModulePoint)
                                .join(Module)
                                .where(Module.project_id == project_id)
                            )
                            completed = await save_db.scalar(
                                select(func.count())
                                .select_from(ModulePoint)
                                .where(ModulePoint.checked == True)
                                .join(Module)
                                .where(Module.project_id == project_id)
                            )
                            if total and completed is not None and completed >= total:
                                project = await save_db.get(Project, project_id)
                                if project and not project.completed_at:
                                    project.completed_at = datetime.datetime.utcnow()
                                    await save_db.commit()
                                yield json.dumps({"type": "course_complete"})
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'text': str(e)})}\n\n"
        finally:
            async with async_session() as save_db:
                uid = user.id if role == "student" else None
                if evaluator_text:
                    save_db.add(Message(
                        project_id=project_id,
                        user_id=uid,
                        role="assistant",
                        content=evaluator_text,
                        metadata_json=json.dumps({"persona": "evaluator"}),
                    ))
                if student_text:
                    save_db.add(Message(
                        project_id=project_id,
                        user_id=uid,
                        role="assistant",
                        content=student_text,
                        metadata_json=json.dumps({"persona": "student"}),
                    ))
                await save_db.commit()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
