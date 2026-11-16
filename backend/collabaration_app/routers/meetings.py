from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.config import settings
from collabaration_app.database.session import get_session
from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.models import User
from collabaration_app.models.enums import MeetingStatus, UserRole
from collabaration_app.models.meeting import Meeting, MeetingParticipant
from collabaration_app.repositories.meeting import (
    get_meeting,
    get_open_participant,
    list_hosted_meetings,
    list_joinable_meetings,
)
from collabaration_app.schemas.meeting import (
    CreateMeetingRequest,
    JoinMeetingResponse,
    MeetingResponse,
)
from collabaration_app.services.livekit import create_join_token, create_room

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _require_teacher(user: User) -> None:
    if user.role != UserRole.teacher:
        raise HTTPException(status_code=403, detail="Only teachers can create meetings")


def _require_student(user: User) -> None:
    if user.role != UserRole.student:
        raise HTTPException(status_code=403, detail="Only students can join meetings")


@router.post("", response_model=MeetingResponse)
async def create_meeting(
    body: CreateMeetingRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MeetingResponse:
    _require_teacher(current_user)
    room_name = f"meet-{uuid4().hex}"
    try:
        await create_room(room_name)
    except Exception:
        raise HTTPException(status_code=503, detail="LiveKit is unavailable") from None
    meeting = Meeting(
        room_name=room_name,
        title=body.title,
        host_id=current_user.id,
        status=MeetingStatus.scheduled,
    )
    session.add(meeting)
    await session.commit()
    await session.refresh(meeting)
    return MeetingResponse.model_validate(meeting)


@router.get("", response_model=list[MeetingResponse])
async def list_meetings(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[MeetingResponse]:
    if current_user.role == UserRole.teacher:
        rows = await list_hosted_meetings(session, current_user.id)
    else:
        rows = await list_joinable_meetings(session)
    return [MeetingResponse.model_validate(row) for row in rows]


@router.post("/{meeting_id}/join", response_model=JoinMeetingResponse)
async def join_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> JoinMeetingResponse:
    _require_student(current_user)
    meeting = await get_meeting(session, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status == MeetingStatus.ended:
        raise HTTPException(status_code=400, detail="Meeting has ended")
    if meeting.started_at is None:
        meeting.started_at = datetime.now(UTC)
    meeting.status = MeetingStatus.live
    participant = await get_open_participant(session, meeting.id, current_user.id)
    if participant is None:
        session.add(
            MeetingParticipant(
                meeting_id=meeting.id,
                user_id=current_user.id,
                livekit_sid=None,
                is_muted=True,
                is_video_off=True,
            )
        )
    await session.commit()
    await session.refresh(meeting)
    return JoinMeetingResponse(
        token=create_join_token(
            meeting.room_name, str(current_user.id), current_user.username
        ),
        url=settings.livekit_public_url,
        room_name=meeting.room_name,
        meeting=MeetingResponse.model_validate(meeting),
    )
