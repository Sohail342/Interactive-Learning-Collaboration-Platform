from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.models import User
from collabaration_app.repositories.whiteboard import (
    EMPTY_APP_STATE,
    EMPTY_ELEMENTS,
    get_by_meeting,
)
from collabaration_app.schemas.whiteboard import WhiteboardResponse
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    assert_can_use_whiteboard,
    get_meeting_or_404,
)

router = APIRouter(prefix="/meetings", tags=["whiteboard"])


@router.get("/{meeting_id}/whiteboard", response_model=WhiteboardResponse)
async def get_whiteboard(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> WhiteboardResponse:
    try:
        meeting = await get_meeting_or_404(session, meeting_id)
        assert_can_use_whiteboard(meeting, user)
    except MeetingAccessError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    snapshot = await get_by_meeting(session, meeting_id)
    if snapshot is None:
        return WhiteboardResponse(
            meeting_id=meeting_id,
            elements=list(EMPTY_ELEMENTS),
            app_state=dict(EMPTY_APP_STATE),
            last_modified_by=None,
            updated_at=None,
        )

    elements = snapshot.elements_json
    if not isinstance(elements, list):
        elements = []
    app_state = snapshot.app_state_json
    if not isinstance(app_state, dict):
        app_state = dict(EMPTY_APP_STATE)

    return WhiteboardResponse(
        meeting_id=snapshot.meeting_id,
        elements=elements,
        app_state=app_state,
        last_modified_by=snapshot.last_modified_by,
        updated_at=snapshot.updated_at,
    )
