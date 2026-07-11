import json
import re

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.module import Module, ModulePoint
from app.models.resource import Resource
from app.models.rubric import Rubric, RubricPoint
from app.services.rag import search as rag_search
from app.utils import nanoid

_GENERATION_PROMPT = """You are a curriculum designer. Based on the following learning material, suggest modules (topics to cover), evaluation rubrics (grading criteria), and learning resources.

Rules:
- Modules represent logical sections of the material. Each module should have 2-4 checklist points describing what the learner should know.
- Rubrics are evaluation criteria with standards. Each rubric should have 2-4 standards describing mastery levels.
- Points and standards should be concrete and measurable.
- Resources should be practical learning aids the student can use. Generate 2-4 resources.
- resource_type must be one of: "youtube_video", "online_tutorial", "roadmap"
  - youtube_video: a real YouTube video title the student should search for
  - online_tutorial: a real website/tutorial name the student should visit
  - roadmap: a suggested study order for which topic to learn after which
- For content in resources: if it's a youtube_video or online_tutorial, provide a real searchable title or URL suggestion. If it's a roadmap, describe the suggested learning path.
- Use the actual content of the material — don't invent topics not covered.
- Output ONLY valid JSON, no markdown or extra text.

Respond in this exact JSON format:
{
  "modules": [
    {"title": "Module name", "points": [{"text": "Checklist item"}]}
  ],
  "rubrics": [
    {"title": "Criteria name", "points": [{"text": "Standard description"}]}
  ],
  "resources": [
    {"title": "Resource title", "content": "Search term or URL or description", "resource_type": "youtube_video"},
    {"title": "Resource title", "content": "Website name or URL", "resource_type": "online_tutorial"},
    {"title": "Study Roadmap", "content": "Study this first, then this, then this...", "resource_type": "roadmap"}
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

    # --- Rubrics: delete old + recreate ---
    result = await db.execute(select(Rubric.id).where(Rubric.project_id == project_id))
    rubric_ids = [row[0] for row in result]
    if rubric_ids:
        await db.execute(delete(RubricPoint).where(RubricPoint.rubric_id.in_(rubric_ids)))
    await db.execute(delete(Rubric).where(Rubric.project_id == project_id))

    modules_data = parsed.get("modules") or []
    rubrics_data = parsed.get("rubrics") or []
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

    # --- Create rubrics ---
    created_rubrics = []
    for i, rd in enumerate(rubrics_data):
        rubric = Rubric(
            id=nanoid(),
            project_id=project_id,
            title=rd.get("title", f"Criteria {i + 1}"),
            sort_order=i + 1,
        )
        db.add(rubric)
        await db.flush()
        points_data = rd.get("points") or []
        rubric_points = []
        for j, pd in enumerate(points_data):
            point = RubricPoint(
                id=nanoid(),
                rubric_id=rubric.id,
                text=pd.get("text", ""),
                sort_order=j + 1,
            )
            db.add(point)
            rubric_points.append({
                "id": point.id,
                "rubric_id": rubric.id,
                "text": point.text,
                "checked": False,
                "sort_order": point.sort_order,
            })
        created_rubrics.append({
            "id": rubric.id,
            "project_id": rubric.project_id,
            "title": rubric.title,
            "sort_order": rubric.sort_order,
            "points": rubric_points,
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
            "resource_type": resource.resource_type,
            "sort_order": resource.sort_order,
            "source_material_id": resource.source_material_id,
        })

    await db.commit()
    return {
        "modules": created_modules,
        "rubrics": created_rubrics,
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
