from uuid import UUID

from fastapi import APIRouter, Depends

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_meeting_service
from collabaration_app.models import User
from collabaration_app.schemas.meeting import (
    CreateMeetingRequest,
    JoinMeetingResponse,
    MeetingResponse,
)
from collabaration_app.services.meeting import MeetingService
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    raise_meeting_access_http,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.post("", response_model=MeetingResponse)
async def create_meeting(
    body: CreateMeetingRequest,
    current_user: User = Depends(get_current_user),
    meetings: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    meeting = await meetings.create(current_user, body.title)
    return MeetingResponse.model_validate(meeting)


@router.get("", response_model=list[MeetingResponse])
async def list_meetings(
    current_user: User = Depends(get_current_user),
    meetings: MeetingService = Depends(get_meeting_service),
) -> list[MeetingResponse]:
    rows = await meetings.list_for_user(current_user)
    return [MeetingResponse.model_validate(row) for row in rows]


@router.post("/{meeting_id}/start", response_model=MeetingResponse)
async def start_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    meetings: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    try:
        meeting = await meetings.start(meeting_id, current_user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return MeetingResponse.model_validate(meeting)


@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse)
async def join_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    meetings: MeetingService = Depends(get_meeting_service),
) -> JoinMeetingResponse:
    try:
        return await meetings.join(meeting_id, current_user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
