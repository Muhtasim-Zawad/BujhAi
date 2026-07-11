import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.canvas_scene import CanvasScene
from app.models.project import Project
from app.schemas.canvas import CanvasAnalyzeResponse, CanvasSaveRequest, CanvasSceneResponse
from app.services.excalidraw import parse_scene
from app.utils import nanoid

router = APIRouter(prefix="/projects/{project_id}/canvas", tags=["canvas"])


@router.get("", response_model=CanvasSceneResponse | None)
async def get_canvas(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CanvasScene)
        .where(CanvasScene.project_id == project_id)
        .order_by(CanvasScene.updated_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


@router.put("", response_model=CanvasSceneResponse)
async def save_canvas(
    project_id: str,
    body: CanvasSaveRequest,
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )

    result = await db.execute(
        select(CanvasScene)
        .where(CanvasScene.project_id == project_id)
        .order_by(CanvasScene.updated_at.desc())
        .limit(1)
    )
    scene = result.scalar_one_or_none()

    if scene:
        scene.scene_data = body.scene_data
    else:
        scene = CanvasScene(
            id=nanoid(),
            project_id=project_id,
            scene_data=body.scene_data,
        )
        db.add(scene)

    await db.commit()
    await db.refresh(scene)
    return scene


@router.post("/analyze", response_model=CanvasAnalyzeResponse)
async def analyze_canvas(body: CanvasSaveRequest):
    try:
        elements = json.loads(body.scene_data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in scene_data",
        )

    parsed = parse_scene(elements)
    return CanvasAnalyzeResponse(parsed_text=parsed)
