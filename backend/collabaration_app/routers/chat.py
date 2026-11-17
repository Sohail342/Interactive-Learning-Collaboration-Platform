from uuid import UUID

from fastapi import APIRouter, Depends

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_chat_service
from collabaration_app.models import User
from collabaration_app.schemas.chat import ChatMessageResponse
from collabaration_app.services.chat import ChatService, chat_message_to_response
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    raise_meeting_access_http,
)

router = APIRouter(prefix="/meetings", tags=["chat"])


@router.get("/{meeting_id}/chat", response_model=list[ChatMessageResponse])
async def get_meeting_chat(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    chat: ChatService = Depends(get_chat_service),
) -> list[ChatMessageResponse]:
    try:
        messages = await chat.list_for_meeting(meeting_id, user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return [chat_message_to_response(message) for message in messages]
