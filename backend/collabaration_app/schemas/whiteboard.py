from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WhiteboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    meeting_id: UUID
    elements: list[Any] = Field(default_factory=list)
    app_state: dict[str, Any] = Field(default_factory=dict)
    last_modified_by: UUID | None = None
    updated_at: datetime | None = None
