from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, verify_project_access, verify_project_owner
from app.models.enrollment import ProjectEnrollment
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.rag import delete_collection
from app.utils import generate_join_code, nanoid

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    owned = await db.execute(
        select(Project)
        .where(Project.user_id == user.id)
    )
    owned_projects = list(owned.scalars().all())

    enrolled = await db.execute(
        select(Project)
        .join(ProjectEnrollment, ProjectEnrollment.project_id == Project.id)
        .where(ProjectEnrollment.user_id == user.id)
    )
    enrolled_projects = list(enrolled.scalars().all())

    seen = {p.id for p in owned_projects}
    combined = owned_projects + [p for p in enrolled_projects if p.id not in seen]
    combined.sort(key=lambda p: p.created_at, reverse=True)
    return combined


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = Project(
        id=nanoid(),
        user_id=user.id,
        title=body.title,
        description=body.description,
        badge=body.badge,
        button_text=body.button_text,
        image_url=body.image_url or f"https://avatar.vercel.sh/{nanoid()}",
        join_code=generate_join_code(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project: Project = Depends(verify_project_access),
):
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(verify_project_owner),
):
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(project, key, value)

    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(verify_project_owner),
):
    delete_collection(project_id)
    await db.delete(project)
    await db.commit()


@router.put("/{project_id}/regenerate-code", response_model=ProjectResponse)
async def regenerate_join_code(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(verify_project_owner),
):
    project.join_code = generate_join_code()
    await db.commit()
    await db.refresh(project)
    return project
