from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from collabaration_app.models.chat import ChatMessage


class ChatRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_messages(self, meeting_id: UUID) -> list[ChatMessage]:
        result = await self._session.execute(
            select(ChatMessage)
            .where(ChatMessage.meeting_id == meeting_id)
            .options(selectinload(ChatMessage.sender))
            .order_by(ChatMessage.sent_at.asc(), ChatMessage.id.asc())
        )
        return list(result.scalars().all())

    async def create_message(
        self,
        *,
        meeting_id: UUID,
        sender_id: UUID,
        content: str,
    ) -> ChatMessage:
        message = ChatMessage(
            id=uuid4(),
            meeting_id=meeting_id,
            sender_id=sender_id,
            content=content,
            sent_at=datetime.now(UTC),
        )
        self._session.add(message)
        await self._session.flush()
        return message
