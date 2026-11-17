from uuid import UUID

from fastapi import APIRouter, Depends

from collabaration_app.dependencies.repositories import get_user_repository
from collabaration_app.repositories.user import UserRepository
from collabaration_app.schemas.auth import CityResponse, SchoolResponse

router = APIRouter(tags=["lookups"])


@router.get("/cities", response_model=list[CityResponse])
async def cities(
    users: UserRepository = Depends(get_user_repository),
) -> list[CityResponse]:
    rows = await users.list_cities()
    return [CityResponse(id=row.id, name=row.name) for row in rows]


@router.get("/schools", response_model=list[SchoolResponse])
async def schools(
    city_id: UUID | None = None,
    users: UserRepository = Depends(get_user_repository),
) -> list[SchoolResponse]:
    rows = await users.list_schools(city_id)
    return [
        SchoolResponse(id=row.id, name=row.name, city_id=row.city_id) for row in rows
    ]
