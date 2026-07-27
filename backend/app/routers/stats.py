from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, get_enrollment_role, verify_project_access, verify_project_owner
from app.models.enrollment import ProjectEnrollment
from app.models.material import Material

from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.user import User
from app.models.user_point_progress import UserPointProgress

from app.schemas.stats import EnrolledStatsResponse, EnrolledUserStats, ModuleProgressStats, ProjectStats
from app.services.rag import client as chroma_client

router = APIRouter(prefix="/projects/{project_id}/stats", tags=["stats"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=ProjectStats)
async def get_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    _: Project = Depends(verify_project_access),
):
    project = await db.get(Project, project_id)
    if not project:
        return ProjectStats()

    materials = await db.execute(
        select(func.count(Material.id)).where(Material.project_id == project_id)
    )
    total_materials = materials.scalar() or 0

    enrolled = await db.execute(
        select(func.count(ProjectEnrollment.id)).where(ProjectEnrollment.project_id == project_id)
    )
    total_enrolled = enrolled.scalar() or 0

    completed_enrolled = await db.execute(
        select(func.count(ProjectEnrollment.id)).where(
            ProjectEnrollment.project_id == project_id,
            ProjectEnrollment.completed_at.isnot(None),
        )
    )
    enrolled_completed = completed_enrolled.scalar() or 0

    modules = await db.execute(
        select(func.count(Module.id)).where(Module.project_id == project_id)
    )
    total_modules = modules.scalar() or 0

    role = await get_enrollment_role(project_id, user.id, db)

    if role == "owner":
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
    elif role == "student":
        total = await db.execute(
            select(func.count(ModulePoint.id))
            .select_from(ModulePoint)
            .join(Module, ModulePoint.module_id == Module.id)
            .where(Module.project_id == project_id)
        )
        module_points_total = total.scalar() or 0

        completed = await db.execute(
            select(func.count(UserPointProgress.id))
            .select_from(UserPointProgress)
            .join(ModulePoint, UserPointProgress.point_id == ModulePoint.id)
            .join(Module, ModulePoint.module_id == Module.id)
            .where(Module.project_id == project_id, UserPointProgress.user_id == user.id, UserPointProgress.checked == True)
        )
        module_points_completed = completed.scalar() or 0
    else:
        module_points_total = 0
        module_points_completed = 0

    total_chunks = 0
    try:
        col = chroma_client.get_collection(f"project_{project_id}")
        total_chunks = col.count()
    except Exception:
        pass

    return ProjectStats(
        total_materials=total_materials,
        total_chunks=total_chunks,
        total_enrolled=total_enrolled,
        enrolled_completed=enrolled_completed,
        total_modules=total_modules,
        module_points_completed=module_points_completed,
        module_points_total=module_points_total,
        join_code=project.join_code or "",
    )


@router.get("/enrolled-stats", response_model=EnrolledStatsResponse)
async def get_enrolled_stats(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _: Project = Depends(verify_project_owner),
):
    result = await db.execute(
        select(
            ProjectEnrollment.user_id,
            User.name,
            User.email,
        )
        .join(User, ProjectEnrollment.user_id == User.id)
        .where(ProjectEnrollment.project_id == project_id)
    )
    enrolled_rows = result.all()

    modules_result = await db.execute(
        select(Module.id, Module.title)
        .where(Module.project_id == project_id)
        .order_by(Module.sort_order)
    )
    project_modules = modules_result.all()

    enrolled_list = []
    for user_id, user_name, email in enrolled_rows:
        user_modules = []
        total_points = 0
        total_completed = 0
        for mod_id, mod_title in project_modules:
            pts = await db.execute(
                select(func.count(ModulePoint.id))
                .where(ModulePoint.module_id == mod_id)
            )
            mod_total = pts.scalar() or 0

            pt_ids = (
                select(ModulePoint.id)
                .where(ModulePoint.module_id == mod_id)
                .scalar_subquery()
            )
            comp = await db.execute(
                select(func.count(UserPointProgress.id))
                .where(
                    UserPointProgress.user_id == user_id,
                    UserPointProgress.point_id.in_(pt_ids),
                    UserPointProgress.checked == True,
                )
            )
            mod_completed = comp.scalar() or 0

            total_points += mod_total
            total_completed += mod_completed
            user_modules.append(ModuleProgressStats(
                module_id=mod_id,
                module_title=mod_title,
                total_points=mod_total,
                completed_points=mod_completed,
            ))

        enrolled_list.append(EnrolledUserStats(
            user_id=user_id,
            user_name=user_name,
            email=email,
            total_points=total_points,
            points_completed=total_completed,
            modules=user_modules,
        ))

    return EnrolledStatsResponse(enrolled=enrolled_list)
