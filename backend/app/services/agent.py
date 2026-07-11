from __future__ import annotations

import json
from collections.abc import AsyncGenerator

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from typing_extensions import TypedDict

from app.config import settings
from app.services.rag import search as rag_search

_chat: ChatGroq | None = None


def _get_chat() -> ChatGroq:
    global _chat
    if _chat is None:
        _chat = ChatGroq(
            model=settings.groq_model,
            temperature=0.7,
            max_tokens=4096,
        )
    return _chat

SYSTEM_PROMPT = (
    "You are BujhAI, an AI-powered learning assistant. "
    "You help users learn by answering questions, providing explanations, "
    "and guiding them through project-based learning. "
    "Be concise, clear, and supportive."
)


class AgentState(TypedDict):
    messages: list[BaseMessage]
    user_input: str
    needs_rag: bool
    context_chunks: list[dict]
    project_id: str
    response: str


def _classify_rag(user_input: str) -> bool:
    keywords = [
        "material", "document", "upload", "pdf", "file", "reading",
        "according to", "in the text", "what does it say", "summarize",
    ]
    lower = user_input.lower()
    return any(kw in lower for kw in keywords)


def router_node(state: AgentState) -> dict:
    return {"needs_rag": _classify_rag(state["user_input"])}


def retrieve_node(state: AgentState) -> dict:
    chunks = rag_search(state["project_id"], state["user_input"], k=5)
    return {"context_chunks": chunks}


def build_prompt_node(state: AgentState) -> dict:
    system = SYSTEM_PROMPT
    chunks = state.get("context_chunks") or []

    if chunks:
        context_text = "\n\n".join(
            f"[Source: {c['metadata'].get('file_name', 'unknown')}]\n{c['text']}"
            for c in chunks
        )
        system += (
            "\n\nYou have access to the following materials uploaded by the user. "
            "Use them to answer questions when relevant. If the answer is not in the "
            "materials, say so and answer from your own knowledge.\n\n"
            f"--- Materials ---\n{context_text}"
        )

    langchain_messages: list[BaseMessage] = [SystemMessage(content=system)]
    for m in state["messages"]:
        if isinstance(m, BaseMessage):
            langchain_messages.append(m)
        elif m.get("role") == "user":
            langchain_messages.append(HumanMessage(content=m["content"]))
        else:
            langchain_messages.append(AIMessage(content=m["content"]))
    langchain_messages.append(HumanMessage(content=state["user_input"]))

    return {"messages": langchain_messages}


async def call_llm_node(state: AgentState) -> dict:
    content = ""
    async for chunk in _get_chat().astream(state["messages"]):
        content += chunk.content if hasattr(chunk, "content") else ""
    return {"response": content}


def build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("router", router_node)
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("build_prompt", build_prompt_node)
    builder.add_node("call_llm", call_llm_node)

    builder.add_edge(START, "router")
    builder.add_conditional_edges(
        "router",
        lambda s: "retrieve" if s["needs_rag"] else "build_prompt",
    )
    builder.add_edge("retrieve", "build_prompt")
    builder.add_edge("build_prompt", "call_llm")
    builder.add_edge("call_llm", END)

    return builder.compile()


graph = build_graph()


async def stream_chat_agent(
    project_id: str,
    messages: list[dict],
    user_input: str,
) -> AsyncGenerator[str, None]:
    config = {"configurable": {"thread_id": project_id}}
    full_response = ""

    async for event in graph.astream_events(
        {
            "messages": messages,
            "user_input": user_input,
            "needs_rag": False,
            "context_chunks": [],
            "project_id": project_id,
        },
        config,
        version="v2",
    ):
        kind = event["event"]

        if kind == "on_chat_model_stream":
            chunk = event["data"].get("chunk")
            if chunk is not None:
                content = chunk.content if hasattr(chunk, "content") else ""
                if content:
                    full_response += content
                    yield json.dumps({"type": "text", "text": content}, ensure_ascii=False)

        elif kind == "on_chain_end" and event.get("name") == "call_llm":
            yield json.dumps({"type": "finish", "finishReason": "stop"})
