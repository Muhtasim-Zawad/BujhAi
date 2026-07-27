from __future__ import annotations

import logging

from langchain_groq import ChatGroq

logger = logging.getLogger(__name__)

FRIENDLY_ERROR = "The AI tutor is temporarily at capacity. Please try again in a little while."


def is_rate_limit_error(e: Exception) -> bool:
    if hasattr(e, "status_code") and e.status_code == 429:
        return True
    if hasattr(e, "response") and hasattr(e.response, "status_code") and e.response.status_code == 429:
        return True
    msg = str(e)
    return "429" in msg or "rate_limit_exceeded" in msg or "Rate limit reached" in msg


def create_chat(model: str, api_key: str, **kwargs) -> ChatGroq:
    return ChatGroq(
        model=model,
        api_key=api_key,
        temperature=kwargs.pop("temperature", 0.7),
        max_tokens=kwargs.pop("max_tokens", 4096),
        **kwargs,
    )
