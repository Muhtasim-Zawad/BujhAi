from __future__ import annotations

import json
from collections.abc import AsyncGenerator

import logging

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from typing_extensions import TypedDict

from app.config import settings
from app.services.llm_fallback import create_chat, is_rate_limit_error
from app.services.rag import search as rag_search

logger = logging.getLogger(__name__)


EVALUATOR_SYSTEM = """You are an evaluator. Your role is to assess the student's understanding against the module checklist points and provide feedback. Do NOT proactively teach or lecture — respond specifically to what the student said and evaluate it. Keep responses encouraging and specific.

If a canvas drawing is included below, examine it as part of the student's submission — it may contain diagrams, notes, or visual explanations relevant to their answer.

Respond with valid JSON. The JSON must contain these fields:
- evaluation_text: your assessment, feedback on their answer, and progress summary
- module_updates: an array of objects, each with module_id, point_id, and checked (boolean)

Rules for module_updates:
- Focus on uncompleted points — prioritize evaluating points not yet marked as checked
- Set checked=true if the answer demonstrates understanding of that point
- Set checked=false if it does NOT
- Only include points that are directly relevant to the answer
- Use the EXACT point_id and module_id values shown in the Module Progress section below

ALL MODULES COMPLETE:
If ALL points across ALL modules are already checked (the student has demonstrated everything), do NOT set checked=false on any point. Instead, set module_updates to an empty array and include a congratulatory message in evaluation_text celebrating their achievement. Mention they have completed all learning objectives."""

STUDENT_SYSTEM = """You are a student tutor. Your ONLY role is to ask the user questions to check their understanding of the learning materials.

Rules:
- Do NOT explain concepts — the evaluator handles explanations
- Ask one question at a time
- Base your questions on the module points and material content
- Focus on uncompleted points first
- Keep questions clear and focused
- Reference module content naturally (e.g. "from the materials", "based on what you learned") — do NOT expose internal point IDs
- If a canvas drawing is included below, incorporate it into your questions — ask about diagrams, relationships, or concepts the user drew

ALL MODULES COMPLETE:
If ALL module points are already checked, do NOT ask new questions. Instead, congratulate the student and suggest next steps such as reviewing the material, practicing further, or exploring a new topic. Keep it encouraging."""


class AgentState(TypedDict):
    messages: list[BaseMessage]
    user_input: str
    project_id: str
    needs_rag: bool
    context_chunks: list[dict]
    modules_json: str
    canvas_data: str
    evaluator_response: str
    module_updates: list[dict]
    student_response: str


def _classify_rag(user_input: str) -> bool:
    keywords = [
        "material", "document", "upload", "pdf", "file", "reading",
        "according to", "in the text", "what does it say", "summarize",
    ]
    return any(kw in user_input.lower() for kw in keywords)


def router_node(state: AgentState) -> dict:
    return {"needs_rag": _classify_rag(state["user_input"])}


def retrieve_node(state: AgentState) -> dict:
    chunks = rag_search(state["project_id"], state["user_input"], k=5)
    return {"context_chunks": chunks}


def _format_core_context(state: AgentState, show_point_ids: bool = False) -> str:
    parts = []
    chunks = state.get("context_chunks") or []
    if chunks:
        context_text = "\n\n".join(
            f"[Source: {c['metadata'].get('file_name', 'unknown')}]\n{c['text']}"
            for c in chunks
        )
        parts.append(f"--- Materials ---\n{context_text}")

    canvas_raw = state.get("canvas_data") or ""
    if canvas_raw:
        parts.append(
            "--- User's Canvas Drawing ---\n"
            "Below is the raw Excalidraw scene data (JSON array of elements). "
            "Each element has properties like type (rectangle, ellipse, arrow, text, freedraw, etc.), "
            "position (x, y), dimensions (width, height), colors, stroke style, rotation, and text content. "
            "Parse this JSON to understand the user's visual submission.\n"
            f"{canvas_raw}"
        )

    modules_raw = state.get("modules_json") or "[]"
    try:
        modules = json.loads(modules_raw)
        if modules:
            parts.append("--- Module Progress ---")
            for m in modules:
                pts = m.get("points", [])
                checked_count = sum(1 for p in pts if p.get("checked"))
                total = len(pts)
                if show_point_ids:
                    parts.append(f"Module \"{m['title']}\" (module_id={m['id']}): {checked_count}/{total} complete")
                    for p in pts:
                        status = "checked" if p.get("checked") else "unchecked"
                        parts.append(f"  - point_id={p['id']}: \"{p['text']}\" [{status}]")
                else:
                    parts.append(f"Module \"{m['title']}\": {checked_count}/{total} complete")
                    for p in pts:
                        status = "checked" if p.get("checked") else "unchecked"
                        parts.append(f"  - \"{p['text']}\" [{status}]")
    except (json.JSONDecodeError, KeyError):
        pass

    return "\n\n".join(parts)


async def evaluate_node(state: AgentState) -> dict:
    context = _format_core_context(state, show_point_ids=True)

    prompt = f"""Current rubric progress and materials:
{context}

Student's message to evaluate:
{state['user_input']}"""

    models_to_try = [settings.groq_model, settings.groq_fallback_model]
    response = None

    for attempt_index, model in enumerate(models_to_try):
        try:
            chat = create_chat(model=model, api_key=settings.groq_api_key)
            json_llm = chat.bind(response_format={"type": "json_object"})
            response = await json_llm.ainvoke([
                SystemMessage(content=EVALUATOR_SYSTEM),
                HumanMessage(content=prompt),
            ])
            break
        except Exception as e:
            if is_rate_limit_error(e) and attempt_index < len(models_to_try) - 1:
                logger.warning("[agent] evaluate_node: rate limited on %s, falling back to %s", model, models_to_try[attempt_index + 1])
                continue
            raise

    raw = response.content or "{}"
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("[agent] evaluate_node: failed to parse JSON response, raw=%s", raw[:200])
        return {"evaluator_response": raw, "module_updates": []}

    updates = parsed.get("module_updates", [])
    if updates:
        logger.info("[agent] evaluate_node: %d module_updates returned", len(updates))
    else:
        logger.info("[agent] evaluate_node: no module_updates in response")

    return {
        "evaluator_response": parsed.get("evaluation_text", raw),
        "module_updates": updates,
    }


async def student_node(state: AgentState) -> dict:
    context = _format_core_context(state)
    module_summary = ""
    try:
        updates = state.get("module_updates") or []
        if updates:
            module_summary = f"\nJust evaluated: {len(updates)} module points were checked."
    except Exception:
        pass

    messages = [SystemMessage(content=STUDENT_SYSTEM + module_summary)]
    messages.append(HumanMessage(
        content=f"Current material context and progress:\n{context}\n\n"
                f"Conversation history will follow, then the user's message.\n\n"
                f"User message:\n{state['user_input']}"
    ))

    models_to_try = [settings.groq_model, settings.groq_fallback_model]
    content = ""

    for attempt_index, model in enumerate(models_to_try):
        try:
            chat = create_chat(model=model, api_key=settings.groq_api_key)
            async for chunk in chat.astream(messages):
                content += chunk.content if hasattr(chunk, "content") else ""
            break
        except Exception as e:
            if is_rate_limit_error(e) and attempt_index < len(models_to_try) - 1:
                logger.warning("[agent] student_node: rate limited on %s, falling back to %s", model, models_to_try[attempt_index + 1])
                content = ""
                continue
            raise

    return {"student_response": content}


def build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("router", router_node)
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("evaluate", evaluate_node)
    builder.add_node("student", student_node)

    builder.add_edge(START, "router")
    builder.add_conditional_edges(
        "router",
        lambda s: "retrieve" if s["needs_rag"] else "evaluate",
    )
    builder.add_edge("retrieve", "evaluate")
    builder.add_edge("evaluate", "student")
    builder.add_edge("student", END)

    return builder.compile()


graph = build_graph()


async def stream_chat_agent(
    project_id: str,
    messages: list[dict],
    user_input: str,
    modules_data: list[dict] | None = None,
    canvas_data: str | None = None,
) -> AsyncGenerator[str, None]:
    config = {"configurable": {"thread_id": project_id}}

    evaluator_done = False
    async for event in graph.astream_events(
        {
            "messages": messages,
            "user_input": user_input,
            "project_id": project_id,
            "needs_rag": False,
            "context_chunks": [],
            "modules_json": json.dumps(modules_data or []),
            "canvas_data": canvas_data or "",
            "evaluator_response": "",
            "module_updates": [],
            "student_response": "",
        },
        config,
        version="v2",
    ):
        kind = event["event"]
        name = event.get("name", "")

        if kind == "on_chain_end" and name == "evaluate":
            output = event["data"].get("output", {})
            eval_text = output.get("evaluator_response", "")
            updates = output.get("module_updates", [])
            yield json.dumps({"type": "evaluator_start"})
            if eval_text:
                yield json.dumps({"type": "text", "text": eval_text})
            if updates:
                import logging
                logging.info("[agent] stream_chat_agent: yielding module_update event with %d updates", len(updates))
                yield json.dumps({"type": "module_update", "updates": updates})
            yield json.dumps({"type": "student_start"})
            evaluator_done = True

        elif kind == "on_chat_model_stream" and evaluator_done:
            chunk = event["data"].get("chunk")
            if chunk is not None:
                content = chunk.content if hasattr(chunk, "content") else ""
                if content:
                    yield json.dumps({"type": "text", "text": content}, ensure_ascii=False)

        elif kind == "on_chain_end" and name == "student":
            yield json.dumps({"type": "finish", "finishReason": "stop"})
