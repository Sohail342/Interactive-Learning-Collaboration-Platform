from uuid import UUID

from collabaration_app.models import User
from collabaration_app.models.chat import ChatMessage
from collabaration_app.repositories.chat import ChatRepository
from collabaration_app.schemas.chat import ChatMessageResponse
from collabaration_app.services.meeting_access import MeetingAccessService


def chat_message_to_response(message: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_name=message.sender.username,
        content=message.content,
        sent_at=message.sent_at,
    )


def chat_message_to_socket_payload(
    message: ChatMessage, *, meeting_id: UUID, sender_name: str
) -> dict:
    return {
        "id": str(message.id),
        "meeting_id": str(meeting_id),
        "sender_id": str(message.sender_id),
        "sender_name": sender_name,
        "content": message.content,
        "sent_at": message.sent_at.isoformat(),
    }


class ChatService:
    def __init__(
        self,
        chat: ChatRepository,
        access: MeetingAccessService,
    ) -> None:
        self._chat = chat
        self._access = access

    async def list_for_meeting(self, meeting_id: UUID, user: User) -> list[ChatMessage]:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_chat(meeting, user)
        return await self._chat.list_messages(meeting_id)

    async def send_message(
        self,
        *,
        meeting_id: UUID,
        user: User,
        content: str,
    ) -> ChatMessage:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_chat(meeting, user)
        return await self._chat.create_message(
            meeting_id=meeting_id,
            sender_id=user.id,
            content=content,
        )
