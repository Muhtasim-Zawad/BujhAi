from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.material import Material
from app.models.message import Message
from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.rubric import Rubric, RubricPoint
from app.schemas.stats import ProjectStats
from app.services.rag import client as chroma_client

router = APIRouter(prefix="/projects/{project_id}/stats", tags=["stats"])


@router.get("", response_model=ProjectStats)
async def get_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.get(Project, project_id)
    if not result:
        return ProjectStats()

    materials = await db.execute(
        select(func.count(Material.id)).where(Material.project_id == project_id)
    )
    total_materials = materials.scalar() or 0

    messages = await db.execute(
        select(func.count(Message.id)).where(Message.project_id == project_id)
    )
    total_messages = messages.scalar() or 0

    modules = await db.execute(
        select(func.count(Module.id)).where(Module.project_id == project_id)
    )
    total_modules = modules.scalar() or 0

    mod_pts = await db.execute(
        select(
            func.count(ModulePoint.id),
            func.sum(case((ModulePoint.checked == True, 1), else_=0)),
        )
        .select_from(ModulePoint)
        .join(Module, ModulePoint.module_id == Module.id)
        .where(Module.project_id == project_id)
    )
    row = mod_pts.one()
    module_points_total = row[0] or 0
    module_points_completed = row[1] or 0

    rubrics = await db.execute(
        select(func.count(Rubric.id)).where(Rubric.project_id == project_id)
    )
    total_rubrics = rubrics.scalar() or 0

    rub_pts = await db.execute(
        select(
            func.count(RubricPoint.id),
            func.sum(case((RubricPoint.checked == True, 1), else_=0)),
        )
        .select_from(RubricPoint)
        .join(Rubric, RubricPoint.rubric_id == Rubric.id)
        .where(Rubric.project_id == project_id)
    )
    row = rub_pts.one()
    rubric_criteria_total = row[0] or 0
    rubric_criteria_checked = row[1] or 0

    total_chunks = 0
    try:
        col = chroma_client.get_collection(f"project_{project_id}")
        total_chunks = col.count()
    except Exception:
        pass

    return ProjectStats(
        total_materials=total_materials,
        total_chunks=total_chunks,
        total_messages=total_messages,
        total_modules=total_modules,
        module_points_completed=module_points_completed,
        module_points_total=module_points_total,
        total_rubrics=total_rubrics,
        rubric_criteria_checked=rubric_criteria_checked,
        rubric_criteria_total=rubric_criteria_total,
    )
