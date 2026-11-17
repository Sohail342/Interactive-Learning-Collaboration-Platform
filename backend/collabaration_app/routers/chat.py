from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.models import User
from collabaration_app.repositories.chat import list_messages
from collabaration_app.schemas.chat import ChatMessageResponse
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    assert_can_chat,
    get_meeting_or_404,
)

router = APIRouter(prefix="/meetings", tags=["chat"])


def _to_response(message) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_name=message.sender.username,
        content=message.content,
        sent_at=message.sent_at,
    )


@router.get("/{meeting_id}/chat", response_model=list[ChatMessageResponse])
async def get_meeting_chat(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ChatMessageResponse]:
    try:
        meeting = await get_meeting_or_404(session, meeting_id)
        assert_can_chat(meeting, user)
    except MeetingAccessError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    messages = await list_messages(session, meeting_id)
    return [_to_response(message) for message in messages]
