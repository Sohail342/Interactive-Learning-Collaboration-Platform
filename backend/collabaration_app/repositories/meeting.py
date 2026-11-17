from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.models.enums import MeetingStatus
from collabaration_app.models.meeting import Meeting, MeetingParticipant


class MeetingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, meeting_id: UUID) -> Meeting | None:
        result = await self._session.execute(
            select(Meeting).where(Meeting.id == meeting_id)
        )
        return result.scalar_one_or_none()

    async def list_hosted(self, host_id: UUID) -> list[Meeting]:
        result = await self._session.execute(
            select(Meeting)
            .where(Meeting.host_id == host_id)
            .order_by(Meeting.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_joinable(self) -> list[Meeting]:
        result = await self._session.execute(
            select(Meeting)
            .where(Meeting.status.in_((MeetingStatus.scheduled, MeetingStatus.live)))
            .order_by(Meeting.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_open_participant(
        self, meeting_id: UUID, user_id: UUID
    ) -> MeetingParticipant | None:
        result = await self._session.execute(
            select(MeetingParticipant).where(
                MeetingParticipant.meeting_id == meeting_id,
                MeetingParticipant.user_id == user_id,
                MeetingParticipant.left_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def add(self, meeting: Meeting) -> Meeting:
        self._session.add(meeting)
        await self._session.flush()
        return meeting

    async def add_participant(
        self, participant: MeetingParticipant
    ) -> MeetingParticipant:
        self._session.add(participant)
        await self._session.flush()
        return participant
