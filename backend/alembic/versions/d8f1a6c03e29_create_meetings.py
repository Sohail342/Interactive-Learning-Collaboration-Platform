"""create meetings tables

Revision ID: d8f1a6c03e29
Revises: c5d8e2a14b67
Create Date: 2026-11-16 16:47:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d8f1a6c03e29"
down_revision: Union[str, Sequence[str], None] = "c5d8e2a14b67"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

meeting_status = postgresql.ENUM(
    "scheduled",
    "live",
    "ended",
    name="meeting_status",
    create_type=False,
)


def upgrade() -> None:
    meeting_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "meetings",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("room_name", sa.String(length=150), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("host_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", meeting_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["host_id"], ["users.id"]),
    )
    op.create_table(
        "meeting_participants",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("livekit_sid", sa.String(length=100), nullable=True),
        sa.Column("is_muted", sa.Boolean(), nullable=False),
        sa.Column("is_video_off", sa.Boolean(), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )


def downgrade() -> None:
    op.drop_table("meeting_participants")
    op.drop_table("meetings")
    postgresql.ENUM("scheduled", "live", "ended", name="meeting_status").drop(
        op.get_bind(), checkfirst=True
    )
