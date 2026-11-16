from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base
from collabaration_app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    hosted_meetings: Mapped[list[Meeting]] = relationship(back_populates="host")
    participations: Mapped[list[MeetingParticipant]] = relationship(
        back_populates="user"
    )
    chat_messages: Mapped[list[ChatMessage]] = relationship(back_populates="sender")
    sudoku_reports: Mapped[list[SudokuReport]] = relationship(back_populates="student")
    whiteboard_snapshots: Mapped[list[WhiteboardSnapshot]] = relationship(
        back_populates="last_modified_by_user",
    )
    student: Mapped[Student | None] = relationship(back_populates="user", uselist=False)
    teacher: Mapped[Teacher | None] = relationship(back_populates="user", uselist=False)
