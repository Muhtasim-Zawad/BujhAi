from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user, get_enrollment_role, verify_project_access, verify_project_owner
from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.user import User
from app.models.user_point_progress import UserPointProgress
from app.schemas.module import (
    ModuleCreate,
    ModulePointCreate,
    ModulePointResponse,
    ModulePointUpdate,
    ModuleResponse,
    ModuleUpdate,
    PointProgressUpdate,
)
from app.utils import nanoid
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/projects/{project_id}/modules", tags=["modules"], dependencies=[Depends(get_current_user)])


_BASE = select(Module).options(selectinload(Module.points))


def _sort_points(module: Module) -> None:
    if module.points:
        module.points.sort(key=lambda p: p.sort_order)


@router.get("", response_model=list[ModuleResponse])
async def list_modules(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_access),
):
    result = await db.execute(
        _BASE.where(Module.project_id == project_id).order_by(Module.sort_order)
    )
    modules = result.scalars().all()
    for m in modules:
        _sort_points(m)
    return modules


@router.post("", response_model=ModuleResponse, status_code=201)
async def create_module(
    project_id: str,
    body: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    count = await db.scalar(
        select(func.count()).select_from(Module).where(Module.project_id == project_id)
    )

    module = Module(
        id=nanoid(),
        project_id=project_id,
        title=body.title,
        sort_order=(count or 0) + 1,
    )
    db.add(module)
    await db.commit()

    result = await db.execute(_BASE.where(Module.id == module.id))
    return result.scalar_one()


@router.put("/{module_id}", response_model=ModuleResponse)
async def update_module(
    project_id: str,
    module_id: str,
    body: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    result = await db.execute(
        _BASE.where(Module.id == module_id, Module.project_id == project_id)
    )
    module = result.scalar_one_or_none()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    module.title = body.title
    await db.commit()
    await db.refresh(module)
    _sort_points(module)
    return module


@router.delete("/{module_id}", status_code=204)
async def delete_module(
    project_id: str,
    module_id: str,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    module = await db.get(Module, module_id)
    if not module or module.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")
    await db.delete(module)
    await db.commit()


@router.post("/{module_id}/points", response_model=ModulePointResponse, status_code=201)
async def create_point(
    project_id: str,
    module_id: str,
    body: ModulePointCreate,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    module = await db.get(Module, module_id)
    if not module or module.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")

    count = await db.scalar(
        select(func.count())
        .select_from(ModulePoint)
        .where(ModulePoint.module_id == module_id)
    )

    point = ModulePoint(
        id=nanoid(),
        module_id=module_id,
        text=body.text,
        sort_order=body.sort_order if body.sort_order is not None else (count or 0) + 1,
    )
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point


@router.put("/{module_id}/points/{point_id}", response_model=ModulePointResponse)
async def update_point(
    project_id: str,
    module_id: str,
    point_id: str,
    body: ModulePointUpdate,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    module = await db.get(Module, module_id)
    if not module or module.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")

    point = await db.get(ModulePoint, point_id)
    if not point or point.module_id != module_id:
        raise HTTPException(status_code=404, detail="Point not found")

    if body.text is not None:
        point.text = body.text
    if body.checked is not None:
        point.checked = body.checked

    await db.commit()
    await db.refresh(point)
    return point


@router.delete("/{module_id}/points/{point_id}", status_code=204)
async def delete_point(
    project_id: str,
    module_id: str,
    point_id: str,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    module = await db.get(Module, module_id)
    if not module or module.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")

    point = await db.get(ModulePoint, point_id)
    if not point or point.module_id != module_id:
        raise HTTPException(status_code=404, detail="Point not found")

    await db.delete(point)
    await db.commit()


@router.put("/{module_id}/points/{point_id}/progress", response_model=ModulePointResponse)
async def update_point_progress(
    project_id: str,
    module_id: str,
    point_id: str,
    body: PointProgressUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    module = await db.get(Module, module_id)
    if not module or module.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")

    point = await db.get(ModulePoint, point_id)
    if not point or point.module_id != module_id:
        raise HTTPException(status_code=404, detail="Point not found")

    role = await get_enrollment_role(project_id, user.id, db)

    if role == "owner":
        point.checked = body.checked
        await db.commit()
        await db.refresh(point)
        return point

    if role == "student":
        result = await db.execute(
            select(UserPointProgress).where(
                UserPointProgress.user_id == user.id,
                UserPointProgress.point_id == point_id,
            )
        )
        progress = result.scalar_one_or_none()
        if progress:
            progress.checked = body.checked
        else:
            progress = UserPointProgress(
                id=nanoid(),
                user_id=user.id,
                point_id=point_id,
                checked=body.checked,
            )
            db.add(progress)
        await db.commit()
        point.checked = body.checked
        return point

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
