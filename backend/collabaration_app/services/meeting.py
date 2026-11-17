from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.config import Settings, settings
from collabaration_app.models import User
from collabaration_app.models.enums import MeetingStatus, UserRole
from collabaration_app.models.meeting import Meeting, MeetingParticipant
from collabaration_app.repositories.meeting import MeetingRepository
from collabaration_app.schemas.meeting import JoinMeetingResponse, MeetingResponse
from collabaration_app.services.livekit import LiveKitService
from collabaration_app.services.meeting_access import MeetingAccessService


class MeetingService:
    def __init__(
        self,
        session: AsyncSession,
        meetings: MeetingRepository,
        access: MeetingAccessService,
        livekit: LiveKitService | None = None,
        config: Settings | None = None,
    ) -> None:
        self._session = session
        self._meetings = meetings
        self._access = access
        self._livekit = livekit or LiveKitService()
        self._settings = config or settings

    @staticmethod
    def _require_teacher(user: User) -> None:
        if user.role != UserRole.teacher:
            raise HTTPException(
                status_code=403, detail="Only teachers can create meetings"
            )

    def _join_response(self, meeting: Meeting, user: User) -> JoinMeetingResponse:
        return JoinMeetingResponse(
            token=self._livekit.create_join_token(
                meeting.room_name, str(user.id), user.username
            ),
            url=self._settings.livekit_public_url,
            room_name=meeting.room_name,
            meeting=MeetingResponse.model_validate(meeting),
        )

    async def _ensure_livekit_room(self, room_name: str) -> None:
        try:
            await self._livekit.ensure_room(room_name)
        except Exception:
            raise HTTPException(
                status_code=503, detail="LiveKit is unavailable"
            ) from None

    async def _ensure_participant(self, meeting: Meeting, user: User) -> None:
        participant = await self._meetings.get_open_participant(meeting.id, user.id)
        if participant is None:
            await self._meetings.add_participant(
                MeetingParticipant(
                    meeting_id=meeting.id,
                    user_id=user.id,
                    livekit_sid=None,
                    is_muted=True,
                    is_video_off=True,
                )
            )

    async def create(self, user: User, title: str) -> Meeting:
        self._require_teacher(user)
        meeting = Meeting(
            room_name=f"meet-{uuid4().hex}",
            title=title,
            host_id=user.id,
            status=MeetingStatus.scheduled,
        )
        await self._meetings.add(meeting)
        await self._session.commit()
        await self._session.refresh(meeting)
        return meeting

    async def list_for_user(self, user: User) -> list[Meeting]:
        if user.role == UserRole.teacher:
            return await self._meetings.list_hosted(user.id)
        return await self._meetings.list_joinable()

    async def start(self, meeting_id: UUID, user: User) -> Meeting:
        self._require_teacher(user)
        meeting = await self._access.get_meeting_or_404(meeting_id)
        if not self._access.is_meeting_host(meeting, user):
            raise HTTPException(
                status_code=403, detail="Only the host can start this meeting"
            )
        if meeting.status == MeetingStatus.ended:
            raise HTTPException(status_code=400, detail="Meeting has ended")

        await self._ensure_livekit_room(meeting.room_name)

        if meeting.status == MeetingStatus.scheduled:
            meeting.status = MeetingStatus.live
            meeting.started_at = datetime.now(UTC)
            await self._session.commit()
            await self._session.refresh(meeting)
        return meeting

    async def join(self, meeting_id: UUID, user: User) -> JoinMeetingResponse:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_join_meeting(meeting, user)
        await self._ensure_livekit_room(meeting.room_name)
        await self._ensure_participant(meeting, user)
        await self._session.commit()
        await self._session.refresh(meeting)
        return self._join_response(meeting, user)
