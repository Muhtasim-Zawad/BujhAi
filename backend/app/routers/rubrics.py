from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.rubric import Rubric, RubricPoint
from app.schemas.rubric import (
    RubricCreate,
    RubricPointCreate,
    RubricPointResponse,
    RubricPointUpdate,
    RubricResponse,
)
from app.utils import nanoid
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/projects/{project_id}/rubrics", tags=["rubrics"])

_BASE = select(Rubric).options(selectinload(Rubric.points))


@router.get("", response_model=list[RubricResponse])
async def list_rubrics(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        _BASE.where(Rubric.project_id == project_id).order_by(Rubric.sort_order)
    )
    rubrics = result.scalars().all()
    for r in rubrics:
        if r.points:
            r.points.sort(key=lambda p: p.sort_order)
    return rubrics


@router.post("", response_model=RubricResponse, status_code=201)
async def create_rubric(
    project_id: str, body: RubricCreate, db: AsyncSession = Depends(get_db)
):
    count = await db.scalar(
        select(func.count()).select_from(Rubric).where(Rubric.project_id == project_id)
    )

    rubric = Rubric(
        id=nanoid(),
        project_id=project_id,
        title=body.title,
        sort_order=(count or 0) + 1,
    )
    db.add(rubric)
    await db.commit()

    result = await db.execute(_BASE.where(Rubric.id == rubric.id))
    return result.scalar_one()


@router.put("/{rubric_id}", response_model=RubricResponse)
async def update_rubric(
    project_id: str,
    rubric_id: str,
    body: RubricCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        _BASE.where(Rubric.id == rubric_id, Rubric.project_id == project_id)
    )
    rubric = result.scalar_one_or_none()
    if not rubric:
        raise HTTPException(status_code=404, detail="Rubric not found")
    rubric.title = body.title
    await db.commit()
    await db.refresh(rubric)
    if rubric.points:
        rubric.points.sort(key=lambda p: p.sort_order)
    return rubric


@router.delete("/{rubric_id}", status_code=204)
async def delete_rubric(
    project_id: str,
    rubric_id: str,
    db: AsyncSession = Depends(get_db),
):
    rubric = await db.get(Rubric, rubric_id)
    if not rubric or rubric.project_id != project_id:
        raise HTTPException(status_code=404, detail="Rubric not found")
    await db.delete(rubric)
    await db.commit()


@router.post("/{rubric_id}/points", response_model=RubricPointResponse, status_code=201)
async def create_rubric_point(
    project_id: str,
    rubric_id: str,
    body: RubricPointCreate,
    db: AsyncSession = Depends(get_db),
):
    rubric = await db.get(Rubric, rubric_id)
    if not rubric or rubric.project_id != project_id:
        raise HTTPException(status_code=404, detail="Rubric not found")

    count = await db.scalar(
        select(func.count())
        .select_from(RubricPoint)
        .where(RubricPoint.rubric_id == rubric_id)
    )

    point = RubricPoint(
        id=nanoid(),
        rubric_id=rubric_id,
        text=body.text,
        sort_order=body.sort_order if body.sort_order is not None else (count or 0) + 1,
    )
    db.add(point)
    await db.commit()
    await db.refresh(point)
    return point


@router.put("/{rubric_id}/points/{point_id}", response_model=RubricPointResponse)
async def update_rubric_point(
    project_id: str,
    rubric_id: str,
    point_id: str,
    body: RubricPointUpdate,
    db: AsyncSession = Depends(get_db),
):
    rubric = await db.get(Rubric, rubric_id)
    if not rubric or rubric.project_id != project_id:
        raise HTTPException(status_code=404, detail="Rubric not found")

    point = await db.get(RubricPoint, point_id)
    if not point or point.rubric_id != rubric_id:
        raise HTTPException(status_code=404, detail="Point not found")

    if body.text is not None:
        point.text = body.text
    if body.checked is not None:
        point.checked = body.checked

    await db.commit()
    await db.refresh(point)
    return point


@router.delete("/{rubric_id}/points/{point_id}", status_code=204)
async def delete_rubric_point(
    project_id: str,
    rubric_id: str,
    point_id: str,
    db: AsyncSession = Depends(get_db),
):
    rubric = await db.get(Rubric, rubric_id)
    if not rubric or rubric.project_id != project_id:
        raise HTTPException(status_code=404, detail="Rubric not found")

    point = await db.get(RubricPoint, point_id)
    if not point or point.rubric_id != rubric_id:
        raise HTTPException(status_code=404, detail="Point not found")

    await db.delete(point)
    await db.commit()
