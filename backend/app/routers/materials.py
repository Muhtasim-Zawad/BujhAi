import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.material import Material
from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.resource import Resource
from app.models.rubric import Rubric, RubricPoint
from app.schemas.material import MaterialResponse, UploadResponse
from app.services.generator import generate_from_materials
from app.services.rag import delete_material, ingest_text
from app.utils import nanoid

router = APIRouter(prefix="/projects/{project_id}/materials", tags=["materials"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

os.makedirs(settings.materials_dir, exist_ok=True)


def _extract_text(file_path: str, mime_type: str) -> str:
    if mime_type == "application/pdf":
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if mime_type == "text/plain":
        with open(file_path, encoding="utf-8", errors="replace") as f:
            return f.read()

    return ""


@router.get("", response_model=list[MaterialResponse])
async def list_materials(
    project_id: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Material)
        .where(Material.project_id == project_id)
        .order_by(Material.created_at.desc())
    )
    return result.scalars().all()


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_material(
    project_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    ext = os.path.splitext(file.filename or "file")[1]
    material_id = nanoid()
    safe_name = f"{material_id}{ext}"
    file_path = os.path.join(settings.materials_dir, safe_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    mime = file.content_type or "application/octet-stream"

    text = _extract_text(file_path, mime)
    chunk_count = 0
    if text.strip():
        chunk_count = ingest_text(project_id, material_id, text, file.filename or "untitled")

    material = Material(
        id=material_id,
        project_id=project_id,
        file_name=file.filename or "untitled",
        file_size=len(content),
        mime_type=mime,
        file_path=file_path,
        chunk_count=chunk_count,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    generated = await generate_from_materials(project_id, db, source_material_id=material_id)

    resp = UploadResponse(material=MaterialResponse.model_validate(material))
    if generated:
        resp.generated_modules = generated.get("modules")
        resp.generated_rubrics = generated.get("rubrics")
        resp.generated_resources = generated.get("resources")

    return resp


@router.delete("/{material_id}", status_code=204)
async def delete_material_route(
    project_id: str,
    material_id: str,
    db: AsyncSession = Depends(get_db),
):
    material = await db.get(Material, material_id)
    if not material or material.project_id != project_id:
        raise HTTPException(status_code=404, detail="Material not found")

    if os.path.exists(material.file_path):
        os.remove(material.file_path)

    delete_material(project_id, material_id)

    await db.delete(material)
    await db.commit()

    remaining = await db.scalar(
        select(func.count()).select_from(Material).where(Material.project_id == project_id)
    )
    if not remaining:
        await db.execute(delete(ModulePoint).where(
            ModulePoint.module_id.in_(select(Module.id).where(Module.project_id == project_id))
        ))
        await db.execute(delete(Module).where(Module.project_id == project_id))
        await db.execute(delete(RubricPoint).where(
            RubricPoint.rubric_id.in_(select(Rubric.id).where(Rubric.project_id == project_id))
        ))
        await db.execute(delete(Rubric).where(Rubric.project_id == project_id))
        await db.execute(delete(Resource).where(Resource.project_id == project_id))
        await db.commit()


