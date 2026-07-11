from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceResponse

router = APIRouter(prefix="/projects/{project_id}/resources", tags=["resources"])


@router.get("", response_model=list[ResourceResponse])
async def list_resources(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Resource)
        .where(Resource.project_id == project_id)
        .order_by(Resource.sort_order, Resource.created_at.desc())
    )
    return result.scalars().all()
