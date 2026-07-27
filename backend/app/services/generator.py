import json
import re

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.enrollment import ProjectEnrollment
from app.models.module import Module, ModulePoint
from app.models.project import Project
from app.models.resource import Resource

from app.services.rag import search as rag_search
from app.utils import nanoid

_GENERATION_PROMPT = """You are a curriculum designer. Based on the following learning material, suggest modules (topics to cover) and learning resources.

Rules:
- Modules represent logical sections of the material. Each module should have 2-4 points that serve as both checklist items and evaluation criteria describing what the learner should know.
- Points should be concrete and measurable, suitable for assessing understanding.
- Generate exactly 5 resources in this order: 2 youtube_video, 2 online_tutorial, 1 roadmap.
- resource_type must be one of: "youtube_video", "online_tutorial", "roadmap"
  - youtube_video: provide an actual YouTube URL the student can open. content should be the source name (e.g. "YouTube - freeCodeCamp").
  - online_tutorial: provide an actual URL to the website/tutorial. content should be the source name (e.g. "MDN Web Docs").
  - roadmap: a chronological list of steps describing what to learn and in which order. content must be a JSON array of step strings (e.g. '["Start with fundamentals", "Learn core concepts", "Practice with projects"]'). url should be empty.
- Use the actual content of the material — don't invent topics not covered.
- Output ONLY valid JSON, no markdown or extra text.

Respond in this exact JSON format:
{
  "modules": [
    {"title": "Module name", "points": [{"text": "Checklist item / evaluation criterion"}]}
  ],
  "resources": [
    {"title": "Resource title", "content": "source name", "url": "https://...", "resource_type": "youtube_video"},
    {"title": "Resource title", "content": "source name", "url": "https://...", "resource_type": "online_tutorial"},
    {"title": "Resource title", "content": "source name", "url": "https://...", "resource_type": "youtube_video"},
    {"title": "Resource title", "content": "source name", "url": "https://...", "resource_type": "online_tutorial"},
    {"title": "Study Roadmap", "content": "[\"step one\", \"step two\", \"step three\"]", "url": "", "resource_type": "roadmap"}
  ]
}"""


async def generate_from_materials(
    project_id: str,
    db: AsyncSession,
    source_material_id: str | None = None,
) -> dict | None:
    if not settings.groq_api_key:
        return None

    all_chunks = rag_search(project_id, "", k=50)
    if not all_chunks:
        return None

    context_text = "\n\n".join(
        f"[{c['metadata'].get('file_name', 'material')}]\n{c['text']}"
        for c in all_chunks
    )

    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.groq_api_key)
    response = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": _GENERATION_PROMPT},
            {"role": "user", "content": f"--- Learning Material ---\n\n{context_text}"},
        ],
        temperature=0.3,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content or ""
    parsed = _parse_json(raw)
    if not parsed:
        return None

    # --- Modules: delete old + recreate ---
    result = await db.execute(select(Module.id).where(Module.project_id == project_id))
    module_ids = [row[0] for row in result]
    if module_ids:
        await db.execute(delete(ModulePoint).where(ModulePoint.module_id.in_(module_ids)))
    await db.execute(delete(Module).where(Module.project_id == project_id))
    try:
        await db.execute(
            update(ProjectEnrollment)
            .where(ProjectEnrollment.project_id == project_id)
            .values(completed_at=None)
        )
    except Exception:
        pass
    try:
        await db.execute(
            update(Project)
            .where(Project.id == project_id)
            .values(completed_at=None)
        )
    except Exception:
        pass

    modules_data = parsed.get("modules") or []
    resources_data = parsed.get("resources") or []

    # --- Create modules ---
    created_modules = []
    for i, md in enumerate(modules_data):
        module = Module(
            id=nanoid(),
            project_id=project_id,
            title=md.get("title", f"Module {i + 1}"),
            sort_order=i + 1,
        )
        db.add(module)
        await db.flush()
        points_data = md.get("points") or []
        module_points = []
        for j, pd in enumerate(points_data):
            point = ModulePoint(
                id=nanoid(),
                module_id=module.id,
                text=pd.get("text", ""),
                sort_order=j + 1,
            )
            db.add(point)
            module_points.append({
                "id": point.id,
                "module_id": module.id,
                "text": point.text,
                "checked": False,
                "sort_order": point.sort_order,
            })
        created_modules.append({
            "id": module.id,
            "project_id": module.project_id,
            "title": module.title,
            "sort_order": module.sort_order,
            "points": module_points,
        })

    # --- Append resources (no delete) ---
    count_result = await db.execute(
        select(Resource).where(Resource.project_id == project_id).order_by(Resource.sort_order.desc()).limit(1)
    )
    last = count_result.scalar_one_or_none()
    next_sort = (last.sort_order + 1) if last else 1

    created_resources = []
    for i, rd in enumerate(resources_data):
        rtype = rd.get("resource_type", "online_tutorial")
        resource = Resource(
            id=nanoid(),
            project_id=project_id,
            title=rd.get("title", f"Resource {i + 1}"),
            content=rd.get("content", ""),
            url=rd.get("url"),
            resource_type=rtype,
            source_material_id=source_material_id,
            sort_order=next_sort + i,
        )
        db.add(resource)
        created_resources.append({
            "id": resource.id,
            "project_id": resource.project_id,
            "title": resource.title,
            "content": resource.content,
            "url": resource.url,
            "resource_type": resource.resource_type,
            "sort_order": resource.sort_order,
            "source_material_id": resource.source_material_id,
        })

    await db.commit()
    return {
        "modules": created_modules,
        "resources": created_resources,
    }


def _parse_json(raw: str) -> dict | None:
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if match:
        raw = match.group(1)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(raw[start: end + 1])
        except json.JSONDecodeError:
            pass

    return None
