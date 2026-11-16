from __future__ import annotations

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    qualification: Mapped[str] = mapped_column(String(255), nullable=False)
    city_id: Mapped[UUID] = mapped_column(ForeignKey("cities.id"), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped[User] = relationship(back_populates="teacher")
    city: Mapped[City] = relationship(back_populates="teachers")
