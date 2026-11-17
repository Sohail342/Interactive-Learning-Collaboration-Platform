from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_elevenlabs_service
from collabaration_app.models import User
from collabaration_app.schemas.tts import (
    TtsSpeakRequest,
    TtsStatusResponse,
    TtsVoiceResponse,
)
from collabaration_app.services.elevenlabs import ElevenLabsError, ElevenLabsService

router = APIRouter(prefix="/tts", tags=["tts"])


@router.get("/status", response_model=TtsStatusResponse)
async def tts_status(
    _user: User = Depends(get_current_user),
    tts: ElevenLabsService = Depends(get_elevenlabs_service),
) -> TtsStatusResponse:
    provider = "elevenlabs" if tts.configured() else "browser"
    return TtsStatusResponse(provider=provider)


@router.get("/voices", response_model=list[TtsVoiceResponse])
async def tts_voices(
    _user: User = Depends(get_current_user),
    tts: ElevenLabsService = Depends(get_elevenlabs_service),
) -> list[TtsVoiceResponse]:
    try:
        voices = await tts.list_voices()
    except ElevenLabsError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    return [TtsVoiceResponse(id=item["id"], name=item["name"]) for item in voices]


@router.post("/speak")
async def tts_speak(
    body: TtsSpeakRequest,
    _user: User = Depends(get_current_user),
    tts: ElevenLabsService = Depends(get_elevenlabs_service),
) -> Response:
    try:
        audio = await tts.synthesize_speech(body.text, body.voice_id)
    except ElevenLabsError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    return Response(content=audio, media_type="audio/mpeg")
