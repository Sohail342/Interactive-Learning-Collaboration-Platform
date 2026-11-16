from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base


class City(Base):
    __tablename__ = "cities"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    schools: Mapped[list[School]] = relationship(back_populates="city")
    students: Mapped[list[Student]] = relationship(back_populates="city")
    teachers: Mapped[list[Teacher]] = relationship(back_populates="city")


class School(Base):
    __tablename__ = "schools"
    __table_args__ = (UniqueConstraint("name", "city_id", name="uq_schools_name_city"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    city_id: Mapped[UUID] = mapped_column(ForeignKey("cities.id"), nullable=False)

    city: Mapped[City] = relationship(back_populates="schools")
    students: Mapped[list[Student]] = relationship(back_populates="school")
