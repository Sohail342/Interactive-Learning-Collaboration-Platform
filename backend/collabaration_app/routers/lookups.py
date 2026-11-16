from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.repositories.user import list_cities, list_schools
from collabaration_app.schemas.auth import CityResponse, SchoolResponse

router = APIRouter(tags=["lookups"])


@router.get("/cities", response_model=list[CityResponse])
async def cities(session: AsyncSession = Depends(get_session)) -> list[CityResponse]:
    rows = await list_cities(session)
    return [CityResponse(id=row.id, name=row.name) for row in rows]


@router.get("/schools", response_model=list[SchoolResponse])
async def schools(
    city_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
) -> list[SchoolResponse]:
    rows = await list_schools(session, city_id)
    return [
        SchoolResponse(id=row.id, name=row.name, city_id=row.city_id) for row in rows
    ]
