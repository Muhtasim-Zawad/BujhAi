from __future__ import annotations

TEXT_TYPES = {"text"}
SHAPE_TYPES = {"rectangle", "ellipse", "diamond", "image", "embeddable"}
CONNECTOR_TYPES = {"arrow", "line", "freedraw"}

SHAPE_LABELS = {
    "rectangle": "box",
    "ellipse": "circle",
    "diamond": "diamond",
}


def parse_scene(scene_data: list[dict]) -> str:
    elements = scene_data if isinstance(scene_data, list) else []
    id_map: dict[str, dict] = {e["id"]: e for e in elements if "id" in e}

    texts: list[str] = []
    shapes: list[str] = []
    connections: list[str] = []

    for el in elements:
        _process_element(el, id_map, texts, shapes, connections)

    parts: list[str] = []
    if texts:
        parts.append("Text elements:\n" + "\n".join(f"- {t}" for t in texts))
    if shapes:
        parts.append("Shapes:\n" + "\n".join(f"- {s}" for s in shapes))
    if connections:
        parts.append("Connections:\n" + "\n".join(f"- {c}" for c in connections))

    return "\n\n".join(parts) if parts else "(empty canvas)"


def _process_element(
    el: dict,
    id_map: dict[str, dict],
    texts: list[str],
    shapes: list[str],
    connections: list[str],
) -> None:
    el_type = el.get("type", "")
    el_id = el.get("id", "")

    if el_type in TEXT_TYPES:
        t = el.get("text", "").strip()
        if t:
            texts.append(t)

    elif el_type in SHAPE_TYPES:
        label_found = False
        bound_text = _get_bound_text(el, id_map)
        if bound_text:
            shapes.append(f'{SHAPE_LABELS.get(el_type, el_type)} labeled "{bound_text}"')
            label_found = True

        label_field = el.get("label") or {}
        raw_label = label_field.get("text", "").strip() if isinstance(label_field, dict) else ""
        if raw_label and not label_found:
            shapes.append(f'{SHAPE_LABELS.get(el_type, el_type)} labeled "{raw_label}"')
            label_found = True

        if not label_found:
            shapes.append(f"{SHAPE_LABELS.get(el_type, el_type)} (unlabeled)")

    elif el_type in CONNECTOR_TYPES:
        start_id = None
        end_id = None
        binding = el.get("startBinding") or {}
        if isinstance(binding, dict):
            start_id = binding.get("boundElementId") or binding.get("elementId")
        binding = el.get("endBinding") or {}
        if isinstance(binding, dict):
            end_id = binding.get("boundElementId") or binding.get("elementId")

        start_label = _get_shape_label(start_id, id_map) if start_id else None
        end_label = _get_shape_label(end_id, id_map) if end_id else None

        if start_label and end_label:
            connections.append(f'"{start_label}" -> "{end_label}"')
        elif start_label:
            connections.append(f'from "{start_label}"')
        elif end_label:
            connections.append(f'to "{end_label}"')
        else:
            connections.append("unconnected line/arrow")


def _get_bound_text(el: dict, id_map: dict[str, dict]) -> str | None:
    bound = el.get("boundElements")
    if not isinstance(bound, list):
        return None
    for be in bound:
        if not isinstance(be, dict):
            continue
        be_id = be.get("id")
        if be_id and be_id in id_map:
            be_el = id_map[be_id]
            if be_el.get("type") in TEXT_TYPES:
                t = be_el.get("text", "").strip()
                if t:
                    return t
    return None


def _get_shape_label(el_id: str | None, id_map: dict[str, dict]) -> str | None:
    if not el_id or el_id not in id_map:
        return None
    el = id_map[el_id]
    el_type = el.get("type", "")

    if el_type in TEXT_TYPES:
        return el.get("text", "").strip() or None

    if el_type in SHAPE_TYPES:
        bound_text = _get_bound_text(el, id_map)
        if bound_text:
            return bound_text
        label_field = el.get("label") or {}
        if isinstance(label_field, dict):
            raw = label_field.get("text", "").strip()
            if raw:
                return raw
        return SHAPE_LABELS.get(el_type, el_type)

    return None
