from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from collabaration_app.database.base import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    city_id: Mapped[UUID] = mapped_column(ForeignKey("cities.id"), nullable=False)
    school_id: Mapped[UUID] = mapped_column(ForeignKey("schools.id"), nullable=False)

    user: Mapped[User] = relationship(back_populates="student")
    city: Mapped[City] = relationship(back_populates="students")
    school: Mapped[School] = relationship(back_populates="students")
