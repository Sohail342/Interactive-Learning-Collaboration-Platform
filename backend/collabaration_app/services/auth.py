from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.config import Settings, settings
from collabaration_app.models import Student, Teacher, User
from collabaration_app.models.enums import UserRole
from collabaration_app.repositories.user import UserRepository
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


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        users: UserRepository,
        config: Settings | None = None,
    ) -> None:
        self._session = session
        self._users = users
        self._settings = config or settings

    def _token_response(self, user: User) -> TokenResponse:
        return TokenResponse(
            access_token=create_access_token(user_id=user.id, role=user.role.value),
            expires_in=self._settings.jwt_expire_minutes * 60,
            user=user_response(user),
        )

    async def _reject_duplicate_account(self, *, email: str, username: str) -> None:
        if await self._users.get_by_email(email) is not None:
            raise HTTPException(status_code=409, detail="Email already registered")
        if await self._users.get_by_username(username) is not None:
            raise HTTPException(status_code=409, detail="Username already taken")

    async def _require_city(self, city_id) -> None:
        if await self._users.get_city(city_id) is None:
            raise HTTPException(status_code=400, detail="City not found")

    async def register_student(self, body: StudentRegisterRequest) -> TokenResponse:
        await self._reject_duplicate_account(
            email=str(body.email), username=body.username
        )
        await self._require_city(body.city_id)
        school = await self._users.get_school(body.school_id)
        if school is None:
            raise HTTPException(status_code=400, detail="School not found")
        if school.city_id != body.city_id:
            raise HTTPException(
                status_code=400, detail="School is not in the selected city"
            )
        try:
            user = await self._users.create(
                username=body.username,
                email=str(body.email),
                password_hash=hash_password(body.password),
                role=UserRole.student,
            )
            self._session.add(
                Student(
                    user_id=user.id,
                    class_name=body.class_name,
                    date_of_birth=body.date_of_birth,
                    city_id=body.city_id,
                    school_id=body.school_id,
                )
            )
            await self._session.commit()
        except IntegrityError:
            await self._session.rollback()
            raise HTTPException(
                status_code=409,
                detail="Email or username already registered",
            ) from None
        created = await self._users.get_by_id(user.id)
        if created is None:
            raise HTTPException(
                status_code=500, detail="Registered user could not be loaded"
            )
        return self._token_response(created)

    async def register_teacher(self, body: TeacherRegisterRequest) -> TokenResponse:
        await self._reject_duplicate_account(
            email=str(body.email), username=body.username
        )
        await self._require_city(body.city_id)
        try:
            user = await self._users.create(
                username=body.username,
                email=str(body.email),
                password_hash=hash_password(body.password),
                role=UserRole.teacher,
            )
            self._session.add(
                Teacher(
                    user_id=user.id,
                    qualification=body.qualification,
                    city_id=body.city_id,
                    experience_years=body.experience_years,
                )
            )
            await self._session.commit()
        except IntegrityError:
            await self._session.rollback()
            raise HTTPException(
                status_code=409,
                detail="Email or username already registered",
            ) from None
        created = await self._users.get_by_id(user.id)
        if created is None:
            raise HTTPException(
                status_code=500, detail="Registered user could not be loaded"
            )
        return self._token_response(created)

    async def login(self, body: LoginRequest) -> TokenResponse:
        user = await self._users.get_by_email(str(body.email))
        if user is None or not verify_password(body.password, user.password_hash):
            raise HTTPException(status_code=401, detail=_INVALID_LOGIN)
        return self._token_response(user)
