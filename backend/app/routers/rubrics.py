from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rubric import Rubric, RubricPoint
from app.schemas.material import RubricCreate, RubricResponse
from app.utils import nanoid
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/projects/{project_id}/rubrics", tags=["rubrics"])


@router.get("", response_model=list[RubricResponse])
async def list_rubrics(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Rubric)
        .where(Rubric.project_id == project_id)
        .order_by(Rubric.sort_order)
    )
    return result.scalars().all()


@router.post("", response_model=RubricResponse, status_code=201)
async def create_rubric(
    project_id: str, body: RubricCreate, db: AsyncSession = Depends(get_db)
):
    count = await db.scalar(
        select(func.count()).select_from(Rubric).where(Rubric.project_id == project_id)
    )
    sort_order = (count or 0) + 1

    rubric = Rubric(
        id=nanoid(),
        project_id=project_id,
        title=body.title,
        sort_order=sort_order,
    )
    db.add(rubric)
    await db.commit()
    await db.refresh(rubric)
    return rubric


@router.put("/{rubric_id}", response_model=RubricResponse)
async def update_rubric(
    project_id: str,
    rubric_id: str,
    body: RubricCreate,
    db: AsyncSession = Depends(get_db),
):
    rubric = await db.get(Rubric, rubric_id)
    if not rubric or rubric.project_id != project_id:
        raise HTTPException(status_code=404, detail="Rubric not found")
    rubric.title = body.title
    await db.commit()
    await db.refresh(rubric)
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
