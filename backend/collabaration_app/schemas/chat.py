from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    sender_id: UUID
    sender_name: str
    content: str
    sent_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
