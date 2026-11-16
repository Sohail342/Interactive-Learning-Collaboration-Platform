"""create profile and lookup tables

Revision ID: c5d8e2a14b67
Revises: b7e4c1a92f10
Create Date: 2026-11-16 16:22:00.000000

"""

from typing import Sequence, Union
from uuid import UUID

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c5d8e2a14b67"
down_revision: Union[str, Sequence[str], None] = "b7e4c1a92f10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LAHORE_ID = UUID("11111111-1111-4111-8111-111111111111")
KARACHI_ID = UUID("22222222-2222-4222-8222-222222222222")
LAHORE_MODEL_SCHOOL_ID = UUID("33333333-3333-4333-8333-333333333331")
LAHORE_PUBLIC_ACADEMY_ID = UUID("33333333-3333-4333-8333-333333333332")
KARACHI_MODEL_SCHOOL_ID = UUID("44444444-4444-4444-8444-444444444441")
KARACHI_PUBLIC_ACADEMY_ID = UUID("44444444-4444-4444-8444-444444444442")


def upgrade() -> None:
    op.create_table(
        "cities",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
    )
    op.create_table(
        "schools",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"]),
        sa.UniqueConstraint("name", "city_id", name="uq_schools_name_city"),
    )
    op.create_table(
        "students",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("class_name", sa.String(length=50), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["schools.id"]),
        sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "teachers",
        sa.Column(
            "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("qualification", sa.String(length=255), nullable=False),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("experience_years", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"]),
        sa.UniqueConstraint("user_id"),
    )

    cities = sa.table(
        "cities",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
    )
    schools = sa.table(
        "schools",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("city_id", postgresql.UUID(as_uuid=True)),
    )
    op.bulk_insert(
        cities,
        [
            {"id": LAHORE_ID, "name": "Lahore"},
            {"id": KARACHI_ID, "name": "Karachi"},
        ],
    )
    op.bulk_insert(
        schools,
        [
            {
                "id": LAHORE_MODEL_SCHOOL_ID,
                "name": "Lahore Model School",
                "city_id": LAHORE_ID,
            },
            {
                "id": LAHORE_PUBLIC_ACADEMY_ID,
                "name": "Lahore Public Academy",
                "city_id": LAHORE_ID,
            },
            {
                "id": KARACHI_MODEL_SCHOOL_ID,
                "name": "Karachi Model School",
                "city_id": KARACHI_ID,
            },
            {
                "id": KARACHI_PUBLIC_ACADEMY_ID,
                "name": "Karachi Public Academy",
                "city_id": KARACHI_ID,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("teachers")
    op.drop_table("students")
    op.drop_table("schools")
    op.drop_table("cities")
