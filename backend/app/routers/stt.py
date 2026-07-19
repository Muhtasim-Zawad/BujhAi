from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import settings
from app.deps import get_current_user, verify_project_ownership
from app.schemas.stt import STTResponse
from app.services.stt import SUPPORTED_FORMATS, transcribe

router = APIRouter(prefix="/projects/{project_id}/stt", tags=["stt"], dependencies=[Depends(get_current_user), Depends(verify_project_ownership)])

MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    project_id: str,
    file: UploadFile = File(...),
):
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GROQ_API_KEY not configured. Set it in .env to enable speech-to-text.",
        )

    if file.content_type not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format: {file.content_type}. "
            f"Supported: {', '.join(sorted(SUPPORTED_FORMATS))}",
        )

    audio_bytes = await file.read()

    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file too large (max 25 MB)",
        )

    transcript = await transcribe(
        audio_bytes, file.filename or "audio", file.content_type or "audio/webm"
    )

    return STTResponse(text=transcript)
