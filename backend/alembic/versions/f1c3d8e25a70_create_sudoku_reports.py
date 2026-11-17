"""create sudoku_reports

Revision ID: f1c3d8e25a70
Revises: e9a2b7d14c50
Create Date: 2026-03-24 14:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f1c3d8e25a70"
down_revision: Union[str, Sequence[str], None] = "e9a2b7d14c50"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

game_status = postgresql.ENUM(
    "completed",
    "abandoned",
    "timed_out",
    name="game_status",
    create_type=False,
)


def upgrade() -> None:
    game_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "sudoku_reports",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("meeting_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("time_limit_seconds", sa.Integer(), nullable=False),
        sa.Column("completion_time_seconds", sa.Integer(), nullable=False),
        sa.Column("correct_entries", sa.Integer(), nullable=False),
        sa.Column("incorrect_entries", sa.Integer(), nullable=False),
        sa.Column("mistakes_count", sa.Integer(), nullable=False),
        sa.Column("final_score", sa.Numeric(6, 2), nullable=False),
        sa.Column("status", game_status, nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"]),
    )
    op.create_index(
        "ix_sudoku_reports_student_id_completed_at",
        "sudoku_reports",
        ["student_id", "completed_at"],
    )
    op.create_index(
        "ix_sudoku_reports_meeting_id_completed_at",
        "sudoku_reports",
        ["meeting_id", "completed_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_sudoku_reports_meeting_id_completed_at", table_name="sudoku_reports"
    )
    op.drop_index(
        "ix_sudoku_reports_student_id_completed_at", table_name="sudoku_reports"
    )
    op.drop_table("sudoku_reports")
    postgresql.ENUM("completed", "abandoned", "timed_out", name="game_status").drop(
        op.get_bind(), checkfirst=True
    )
