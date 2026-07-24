from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.enrollment import ProjectEnrollment
from app.models.project import Project
from app.models.user import User
import httpx


async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split(" ", 1)[1]

    client = await _get_http_client()
    resp = await client.get(
        f"{settings.supabase_url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": settings.supabase_anon_key,
        },
    )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    supabase_user = resp.json()
    email = supabase_user.get("email", "")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing email",
        )

    meta = supabase_user.get("user_metadata", {})
    name = meta.get("full_name", meta.get("name", email.split("@")[0]))

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=email, name=name)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif user.name != name:
        user.name = name
        await db.commit()
        await db.refresh(user)

    return user


_http_client: httpx.AsyncClient | None = None


async def _get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=10.0)
    return _http_client


async def get_enrollment_role(
    project_id: str,
    user_id: str,
    db: AsyncSession,
) -> str | None:
    result = await db.execute(
        select(Project.user_id).where(Project.id == project_id)
    )
    owner_id = result.scalar_one_or_none()
    if owner_id is None:
        return None
    if owner_id == user_id:
        return "owner"
    result = await db.execute(
        select(ProjectEnrollment).where(
            ProjectEnrollment.project_id == project_id,
            ProjectEnrollment.user_id == user_id,
        )
    )
    enrollment = result.scalar_one_or_none()
    return "student" if enrollment else None


async def verify_project_access(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Project:
    project_id = request.path_params.get("project_id")
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing project_id")

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.user_id == user.id:
        return project

    result = await db.execute(
        select(ProjectEnrollment).where(
            ProjectEnrollment.project_id == project_id,
            ProjectEnrollment.user_id == user.id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    return project


async def verify_project_owner(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Project:
    project_id = request.path_params.get("project_id")
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing project_id")

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can perform this action",
        )

    return project


async def verify_project_ownership(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Project:
    return await verify_project_owner(request, user, db)
