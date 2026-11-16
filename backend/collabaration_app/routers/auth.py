from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.config import settings
from collabaration_app.database.session import get_session
from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.models import Student, Teacher, User
from collabaration_app.models.enums import UserRole
from collabaration_app.repositories.user import (
    create_user,
    get_city,
    get_school,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
)
from collabaration_app.schemas.auth import (
    LoginRequest,
    StudentProfileResponse,
    StudentRegisterRequest,
    TeacherProfileResponse,
    TeacherRegisterRequest,
    TokenResponse,
    UserResponse,
)
from collabaration_app.security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_INVALID_LOGIN = "Invalid email or password"


def user_response(user: User) -> UserResponse:
    student = None
    if user.student is not None:
        student = StudentProfileResponse(
            class_name=user.student.class_name,
            date_of_birth=user.student.date_of_birth,
            city=user.student.city.name,
            school=user.student.school.name,
        )
    teacher = None
    if user.teacher is not None:
        teacher = TeacherProfileResponse(
            qualification=user.teacher.qualification,
            experience_years=user.teacher.experience_years,
            city=user.teacher.city.name,
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        student=student,
        teacher=teacher,
    )


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user_id=user.id, role=user.role.value),
        expires_in=settings.jwt_expire_minutes * 60,
        user=user_response(user),
    )


async def _reject_duplicate_account(
    session: AsyncSession, *, email: str, username: str
) -> None:
    if await get_user_by_email(session, email) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")
    if await get_user_by_username(session, username) is not None:
        raise HTTPException(status_code=409, detail="Username already taken")


async def _require_city(session: AsyncSession, city_id) -> None:
    if await get_city(session, city_id) is None:
        raise HTTPException(status_code=400, detail="City not found")


@router.post("/register/student", response_model=TokenResponse)
async def register_student(
    body: StudentRegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    await _reject_duplicate_account(
        session, email=str(body.email), username=body.username
    )
    await _require_city(session, body.city_id)
    school = await get_school(session, body.school_id)
    if school is None:
        raise HTTPException(status_code=400, detail="School not found")
    if school.city_id != body.city_id:
        raise HTTPException(
            status_code=400, detail="School is not in the selected city"
        )
    try:
        user = await create_user(
            session,
            username=body.username,
            email=str(body.email),
            password_hash=hash_password(body.password),
            role=UserRole.student,
        )
        session.add(
            Student(
                user_id=user.id,
                class_name=body.class_name,
                date_of_birth=body.date_of_birth,
                city_id=body.city_id,
                school_id=body.school_id,
            )
        )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email or username already registered",
        ) from None
    created = await get_user_by_id(session, user.id)
    if created is None:
        raise HTTPException(
            status_code=500, detail="Registered user could not be loaded"
        )
    return _token_response(created)


@router.post("/register/teacher", response_model=TokenResponse)
async def register_teacher(
    body: TeacherRegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    await _reject_duplicate_account(
        session, email=str(body.email), username=body.username
    )
    await _require_city(session, body.city_id)
    try:
        user = await create_user(
            session,
            username=body.username,
            email=str(body.email),
            password_hash=hash_password(body.password),
            role=UserRole.teacher,
        )
        session.add(
            Teacher(
                user_id=user.id,
                qualification=body.qualification,
                city_id=body.city_id,
                experience_years=body.experience_years,
            )
        )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email or username already registered",
        ) from None
    created = await get_user_by_id(session, user.id)
    if created is None:
        raise HTTPException(
            status_code=500, detail="Registered user could not be loaded"
        )
    return _token_response(created)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    user = await get_user_by_email(session, str(body.email))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail=_INVALID_LOGIN)
    return _token_response(user)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return user_response(current_user)
