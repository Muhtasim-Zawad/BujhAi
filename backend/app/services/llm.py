import json
from collections.abc import AsyncGenerator

from groq import AsyncGroq

from app.config import settings

client = AsyncGroq(api_key=settings.groq_api_key)


def _build_messages(
    history: list[dict],
    user_message: str,
    context_chunks: list[dict] | None = None,
) -> list[dict]:
    system = "You are BujhAI, an AI-powered learning assistant. "

    if context_chunks:
        context_text = "\n\n".join(
            f"[Source: {c['metadata'].get('file_name', 'unknown')}]\n{c['text']}"
            for c in context_chunks
        )
        system += (
            "You have access to the following materials uploaded by the user. "
            "Use them to answer questions when relevant. If the answer is not in the "
            "materials, say so and answer from your own knowledge.\n\n"
            f"--- Materials ---\n{context_text}"
        )
    else:
        system += (
            "You help users learn by answering questions, providing explanations, "
            "and guiding them through project-based learning. "
            "Be concise, clear, and supportive."
        )

    msgs = [{"role": "system", "content": system}]
    for msg in history:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    msgs.append({"role": "user", "content": user_message})
    return msgs


async def stream_chat(
    history: list[dict],
    user_message: str,
    context_chunks: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    messages = _build_messages(history, user_message, context_chunks)

    stream = await client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=4096,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta if chunk.choices else None
        if delta and delta.content:
            yield json.dumps({"type": "text", "text": delta.content}, ensure_ascii=False)

    yield json.dumps({"type": "finish", "finishReason": "stop"})
