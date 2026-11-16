from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from collabaration_app.models import City, School, Student, Teacher, User
from collabaration_app.models.enums import UserRole


def _with_profiles(statement):
    return statement.options(
        selectinload(User.student).selectinload(Student.city),
        selectinload(User.student).selectinload(Student.school),
        selectinload(User.teacher).selectinload(Teacher.city),
    )


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(
        _with_profiles(select(User).where(User.email == email))
    )
    return result.scalar_one_or_none()


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    result = await session.execute(
        _with_profiles(select(User).where(User.id == user_id))
    )
    return result.scalar_one_or_none()


async def create_user(
    session: AsyncSession,
    *,
    username: str,
    email: str,
    password_hash: str,
    role: UserRole,
) -> User:
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        role=role,
    )
    session.add(user)
    await session.flush()
    return user


async def list_cities(session: AsyncSession) -> list[City]:
    result = await session.execute(select(City).order_by(City.name))
    return list(result.scalars().all())


async def get_city(session: AsyncSession, city_id: UUID) -> City | None:
    result = await session.execute(select(City).where(City.id == city_id))
    return result.scalar_one_or_none()


async def list_schools(session: AsyncSession, city_id: UUID | None) -> list[School]:
    statement = select(School).order_by(School.name)
    if city_id is not None:
        statement = statement.where(School.city_id == city_id)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_school(session: AsyncSession, school_id: UUID) -> School | None:
    result = await session.execute(select(School).where(School.id == school_id))
    return result.scalar_one_or_none()
