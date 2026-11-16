from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base
from collabaration_app.models.enums import GameStatus


class SudokuReport(Base):
    __tablename__ = "sudoku_reports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    student_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    meeting_id: Mapped[UUID] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), nullable=False)
    time_limit_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_entries: Mapped[int] = mapped_column(Integer, nullable=False)
    incorrect_entries: Mapped[int] = mapped_column(Integer, nullable=False)
    mistakes_count: Mapped[int] = mapped_column(Integer, nullable=False)
    final_score: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    status: Mapped[GameStatus] = mapped_column(
        Enum(GameStatus, name="game_status", native_enum=True),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    student: Mapped[User] = relationship(back_populates="sudoku_reports")
    meeting: Mapped[Meeting] = relationship(back_populates="sudoku_reports")
