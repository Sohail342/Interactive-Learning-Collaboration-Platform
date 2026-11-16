from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from collabaration_app.models.enums import MeetingStatus


class CreateMeetingRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    room_name: str
    title: str
    host_id: UUID
    status: MeetingStatus
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime


class JoinMeetingResponse(BaseModel):
    token: str
    url: str
    room_name: str
    meeting: MeetingResponse
