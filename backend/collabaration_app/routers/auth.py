from fastapi import APIRouter, Depends

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_auth_service
from collabaration_app.models import User
from collabaration_app.schemas.auth import (
    LoginRequest,
    StudentRegisterRequest,
    TeacherRegisterRequest,
    TokenResponse,
    UserResponse,
)
from collabaration_app.services.auth import AuthService, user_response

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/student", response_model=TokenResponse)
async def register_student(
    body: StudentRegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth.register_student(body)


@router.post("/register/teacher", response_model=TokenResponse)
async def register_teacher(
    body: TeacherRegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth.register_teacher(body)


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth.login(body)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return user_response(current_user)
