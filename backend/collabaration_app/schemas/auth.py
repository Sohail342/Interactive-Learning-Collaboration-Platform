from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from collabaration_app.models.enums import UserRole


class StudentRegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    class_name: str = Field(min_length=1, max_length=50)
    date_of_birth: date
    city_id: UUID
    school_id: UUID

    @field_validator("date_of_birth")
    @classmethod
    def date_of_birth_must_be_past(cls, value: date) -> date:
        if value >= date.today():
            raise ValueError("Date of birth must be in the past")
        return value


class TeacherRegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    qualification: str = Field(min_length=1, max_length=255)
    city_id: UUID
    experience_years: int = Field(ge=0)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class StudentProfileResponse(BaseModel):
    class_name: str
    date_of_birth: date
    city: str
    school: str


class TeacherProfileResponse(BaseModel):
    qualification: str
    experience_years: int
    city: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: EmailStr
    role: UserRole
    student: StudentProfileResponse | None = None
    teacher: TeacherProfileResponse | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class CityResponse(BaseModel):
    id: UUID
    name: str


class SchoolResponse(BaseModel):
    id: UUID
    name: str
    city_id: UUID
