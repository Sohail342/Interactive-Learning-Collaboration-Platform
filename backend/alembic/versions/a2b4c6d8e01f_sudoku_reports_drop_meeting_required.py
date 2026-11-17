"""sudoku_reports meeting_id nullable

Revision ID: a2b4c6d8e01f
Revises: f1c3d8e25a70
Create Date: 2026-03-24 15:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a2b4c6d8e01f"
down_revision: Union[str, Sequence[str], None] = "f1c3d8e25a70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "sudoku_reports",
        "meeting_id",
        existing_type=sa.Uuid(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "sudoku_reports",
        "meeting_id",
        existing_type=sa.Uuid(),
        nullable=False,
    )
