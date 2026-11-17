from __future__ import annotations

from typing import Any

import httpx

from collabaration_app.config import Settings, settings

_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


class ElevenLabsError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class ElevenLabsService:
    def __init__(self, config: Settings | None = None) -> None:
        self._settings = config or settings

    def configured(self) -> bool:
        key = (self._settings.elevenlabs_api_key or "").strip()
        return bool(key)

    def _api_key(self) -> str:
        key = (self._settings.elevenlabs_api_key or "").strip()
        if not key:
            raise ElevenLabsError(503, "ElevenLabs is not configured")
        return key

    def _headers(self) -> dict[str, str]:
        return {
            "xi-api-key": self._api_key(),
            "Accept": "application/json",
        }

    @staticmethod
    def _is_free_api_voice(voice: dict[str, Any]) -> bool:
        """Free API keys can use premade voices only; library voices return 402."""
        category = str(voice.get("category") or "").strip().lower()
        if category != "premade":
            return False

        sharing = voice.get("sharing")
        if isinstance(sharing, dict) and sharing.get("free_users_allowed") is False:
            return False

        available_for_tiers = voice.get("available_for_tiers")
        if isinstance(available_for_tiers, list) and available_for_tiers:
            tiers = {str(tier).strip().lower() for tier in available_for_tiers}
            if tiers and "free" not in tiers:
                return False

        return True

    async def list_voices(self) -> list[dict[str, str]]:
        base = self._settings.elevenlabs_api_base.rstrip("/")
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.get(
                f"{base}/v1/voices",
                headers=self._headers(),
                params={"show_legacy": "true"},
            )
        if response.status_code >= 400:
            raise ElevenLabsError(
                502,
                f"ElevenLabs voices request failed ({response.status_code})",
            )
        payload: dict[str, Any] = response.json()
        voices = payload.get("voices") or []
        result: list[dict[str, str]] = []
        for voice in voices:
            if not isinstance(voice, dict) or not self._is_free_api_voice(voice):
                continue
            voice_id = str(voice.get("voice_id") or "").strip()
            name = str(voice.get("name") or voice_id).strip()
            if voice_id:
                result.append({"id": voice_id, "name": name})
        return result

    async def synthesize_speech(self, text: str, voice_id: str) -> bytes:
        cleaned = text.strip()
        if not cleaned:
            raise ElevenLabsError(400, "text is required")
        if not voice_id.strip():
            raise ElevenLabsError(400, "voice_id is required")

        base = self._settings.elevenlabs_api_base.rstrip("/")
        headers = {
            **self._headers(),
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        body = {
            "text": cleaned,
            "model_id": "eleven_multilingual_v2",
        }
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(
                f"{base}/v1/text-to-speech/{voice_id.strip()}",
                headers=headers,
                json=body,
            )
        if response.status_code >= 400:
            detail = response.text[:240] if response.text else "synthesis failed"
            raise ElevenLabsError(
                502,
                f"ElevenLabs speak failed ({response.status_code}): {detail}",
            )
        return response.content
