import json
from collections.abc import AsyncGenerator

from groq import AsyncGroq

from app.config import settings

client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = (
    "You are BujhAI, an AI-powered learning assistant. "
    "You help users learn by answering questions, providing explanations, "
    "and guiding them through project-based learning. "
    "Be concise, clear, and supportive in your responses."
)


def _build_messages(history: list[dict], user_message: str) -> list[dict]:
    msgs = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        msgs.append({"role": msg["role"], "content": msg["content"]})
    msgs.append({"role": "user", "content": user_message})
    return msgs


async def stream_chat(
    history: list[dict],
    user_message: str,
) -> AsyncGenerator[str, None]:
    messages = _build_messages(history, user_message)

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
