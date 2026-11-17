from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from collabaration_app.models.enums import GameStatus

ALLOWED_DIFFICULTIES = frozenset({"easy", "medium", "hard"})


class CreateSudokuReportRequest(BaseModel):
    difficulty: str = Field(min_length=1, max_length=20)
    time_limit_seconds: int = Field(ge=30, le=3600)
    completion_time_seconds: int = Field(ge=0, le=3600)
    correct_entries: int = Field(ge=0, le=81)
    incorrect_entries: int = Field(ge=0, le=1000)
    mistakes_count: int = Field(ge=0, le=1000)
    final_score: Decimal = Field(ge=0, le=Decimal("9999.99"))
    status: GameStatus


class SudokuReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    student_name: str
    meeting_id: UUID | None = None
    meeting_title: str | None = None
    difficulty: str
    time_limit_seconds: int
    completion_time_seconds: int
    correct_entries: int
    incorrect_entries: int
    mistakes_count: int
    final_score: Decimal
    status: GameStatus
    completed_at: datetime | None
