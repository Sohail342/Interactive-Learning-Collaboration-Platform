from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base
from collabaration_app.models.enums import MeetingStatus


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    room_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    host_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus, name="meeting_status", native_enum=True),
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    host: Mapped[User] = relationship(back_populates="hosted_meetings")
    participants: Mapped[list[MeetingParticipant]] = relationship(
        back_populates="meeting"
    )
    chat_messages: Mapped[list[ChatMessage]] = relationship(back_populates="meeting")
    sudoku_reports: Mapped[list[SudokuReport]] = relationship(back_populates="meeting")
    whiteboard_snapshot: Mapped[WhiteboardSnapshot | None] = relationship(
        back_populates="meeting",
        uselist=False,
    )


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    meeting_id: Mapped[UUID] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    livekit_sid: Mapped[str | None] = mapped_column(String(100))
    is_muted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_video_off: Mapped[bool] = mapped_column(Boolean, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    left_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    meeting: Mapped[Meeting] = relationship(back_populates="participants")
    user: Mapped[User] = relationship(back_populates="participations")
