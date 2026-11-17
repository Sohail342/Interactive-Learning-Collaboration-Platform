"""create chat_messages

Revision ID: e9a2b7d14c50
Revises: d8f1a6c03e29
Create Date: 2026-03-24 12:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e9a2b7d14c50"
down_revision: Union[str, Sequence[str], None] = "d8f1a6c03e29"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("meeting_id", sa.Uuid(), nullable=False),
        sa.Column("sender_id", sa.Uuid(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_chat_messages_meeting_id_sent_at",
        "chat_messages",
        ["meeting_id", "sent_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_chat_messages_meeting_id_sent_at", table_name="chat_messages")
    op.drop_table("chat_messages")
