from uuid import UUID

from fastapi import APIRouter, Depends

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_whiteboard_service
from collabaration_app.models import User
from collabaration_app.schemas.whiteboard import WhiteboardResponse
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    raise_meeting_access_http,
)
from collabaration_app.services.whiteboard import WhiteboardService

router = APIRouter(prefix="/meetings", tags=["whiteboard"])


@router.get("/{meeting_id}/whiteboard", response_model=WhiteboardResponse)
async def get_whiteboard(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    whiteboard: WhiteboardService = Depends(get_whiteboard_service),
) -> WhiteboardResponse:
    try:
        return await whiteboard.get_for_meeting(meeting_id, user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
