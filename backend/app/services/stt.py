from groq import AsyncGroq

from app.config import settings

client = AsyncGroq(api_key=settings.groq_api_key)

SUPPORTED_FORMATS = {
    "audio/webm",
    "audio/ogg",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/flac",
}


async def transcribe(audio_bytes: bytes, filename: str, mime_type: str) -> str:
    if mime_type not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported audio format: {mime_type}")

    transcription = await client.audio.transcriptions.create(
        model="whisper-large-v3",
        file=(filename, audio_bytes, mime_type),
    )
    return transcription.text
