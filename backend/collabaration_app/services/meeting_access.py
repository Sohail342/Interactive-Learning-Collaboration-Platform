from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.models import User
from collabaration_app.models.enums import MeetingStatus, UserRole
from collabaration_app.models.meeting import Meeting
from collabaration_app.repositories.meeting import get_meeting


class MeetingAccessError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


async def get_meeting_or_404(session: AsyncSession, meeting_id: UUID) -> Meeting:
    meeting = await get_meeting(session, meeting_id)
    if meeting is None:
        raise MeetingAccessError(404, "Meeting not found")
    return meeting


def assert_can_chat(meeting: Meeting, user: User) -> None:
    if meeting.status == MeetingStatus.ended:
        raise MeetingAccessError(400, "Meeting has ended")

    is_host = user.role == UserRole.teacher and meeting.host_id == user.id
    is_student = user.role == UserRole.student

    if is_host:
        if meeting.status == MeetingStatus.scheduled:
            raise MeetingAccessError(400, "Start the meeting before using chat.")
        return

    if is_student:
        if meeting.status != MeetingStatus.live:
            raise MeetingAccessError(
                400,
                "Meeting has not started yet. Wait for the teacher to start it.",
            )
        return

    raise MeetingAccessError(403, "Not allowed to access this meeting chat")


def assert_can_submit_report(user: User) -> None:
    if user.role != UserRole.student:
        raise MeetingAccessError(403, "Only students can submit game reports")


def assert_can_view_report(user: User, student_id: UUID) -> None:
    if user.role == UserRole.student:
        if user.id != student_id:
            raise MeetingAccessError(403, "Not allowed to view this report")
        return

    if user.role == UserRole.teacher:
        return

    raise MeetingAccessError(403, "Not allowed to view this report")


def assert_can_list_all_reports(user: User) -> None:
    if user.role != UserRole.teacher:
        raise MeetingAccessError(403, "Only teachers can list all game reports")


def _is_meeting_host(meeting: Meeting, user: User) -> bool:
    return user.role == UserRole.teacher and meeting.host_id == user.id


def assert_can_use_whiteboard(meeting: Meeting, user: User) -> None:
    """Host or student may view/join the whiteboard for a live meeting."""
    if meeting.status == MeetingStatus.ended:
        raise MeetingAccessError(400, "Meeting has ended")

    if _is_meeting_host(meeting, user):
        if meeting.status == MeetingStatus.scheduled:
            raise MeetingAccessError(
                400, "Start the meeting before using the whiteboard."
            )
        return

    if user.role == UserRole.student:
        if meeting.status != MeetingStatus.live:
            raise MeetingAccessError(
                400,
                "Meeting has not started yet. Wait for the teacher to start it.",
            )
        return

    raise MeetingAccessError(403, "Not allowed to access this whiteboard")


def assert_can_edit_whiteboard(meeting: Meeting, user: User) -> None:
    """Only the teacher host may publish scene updates."""
    assert_can_use_whiteboard(meeting, user)
    if not _is_meeting_host(meeting, user):
        raise MeetingAccessError(403, "Only the teacher host can edit the whiteboard")


def whiteboard_role(meeting: Meeting, user: User) -> str:
    return "host" if _is_meeting_host(meeting, user) else "viewer"
