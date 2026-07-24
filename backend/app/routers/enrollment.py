from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.enrollment import ProjectEnrollment
from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.user import User
from app.models.user_point_progress import UserPointProgress
from app.schemas.enrollment import JoinCodeRequest
from app.utils import nanoid

router = APIRouter(prefix="/projects", tags=["enrollment"])


@router.post("/join-by-code", status_code=status.HTTP_201_CREATED)
async def join_project_by_code(
    body: JoinCodeRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.join_code == body.join_code)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid join code",
        )

    if project.user_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot join your own project",
        )

    result = await db.execute(
        select(ProjectEnrollment).where(
            ProjectEnrollment.project_id == project.id,
            ProjectEnrollment.user_id == user.id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already enrolled in this project",
        )

    enrollment = ProjectEnrollment(
        id=nanoid(),
        project_id=project.id,
        user_id=user.id,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    return {"enrollment_id": enrollment.id, "project_id": project.id}


@router.delete("/{project_id}/enroll", status_code=status.HTTP_204_NO_CONTENT)
async def leave_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProjectEnrollment).where(
            ProjectEnrollment.project_id == project_id,
            ProjectEnrollment.user_id == user.id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    await db.delete(enrollment)

    point_ids_subq = (
        select(ModulePoint.id)
        .join(Module, ModulePoint.module_id == Module.id)
        .where(Module.project_id == project_id)
    ).scalar_subquery()

    await db.execute(
        UserPointProgress.__table__.delete().where(
            UserPointProgress.user_id == user.id,
            UserPointProgress.point_id.in_(point_ids_subq),
        )
    )

    await db.commit()
