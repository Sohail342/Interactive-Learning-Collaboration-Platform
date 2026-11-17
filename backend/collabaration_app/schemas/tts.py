from pydantic import BaseModel, Field


class TtsStatusResponse(BaseModel):
    provider: str


class TtsVoiceResponse(BaseModel):
    id: str
    name: str


class TtsSpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice_id: str = Field(min_length=1, max_length=128)
