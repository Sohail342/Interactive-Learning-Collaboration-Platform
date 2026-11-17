from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base


class WhiteboardSnapshot(Base):
    __tablename__ = "whiteboard_snapshots"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    meeting_id: Mapped[UUID] = mapped_column(
        ForeignKey("meetings.id"),
        unique=True,
        nullable=False,
    )
    elements_json: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    app_state_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    last_modified_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    meeting: Mapped[Meeting] = relationship(back_populates="whiteboard_snapshot")
    last_modified_by_user: Mapped[User | None] = relationship(
        back_populates="whiteboard_snapshots",
    )
