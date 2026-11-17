from typing import NoReturn
from uuid import UUID

from fastapi import HTTPException

from collabaration_app.models import User
from collabaration_app.models.enums import MeetingStatus, UserRole
from collabaration_app.models.meeting import Meeting
from collabaration_app.repositories.meeting import MeetingRepository


class MeetingAccessError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def raise_meeting_access_http(exc: MeetingAccessError) -> NoReturn:
    raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


class MeetingAccessService:
    def __init__(self, meetings: MeetingRepository) -> None:
        self._meetings = meetings

    async def get_meeting_or_404(self, meeting_id: UUID) -> Meeting:
        meeting = await self._meetings.get(meeting_id)
        if meeting is None:
            raise MeetingAccessError(404, "Meeting not found")
        return meeting

    @staticmethod
    def is_meeting_host(meeting: Meeting, user: User) -> bool:
        return user.role == UserRole.teacher and meeting.host_id == user.id

    def assert_can_chat(self, meeting: Meeting, user: User) -> None:
        if meeting.status == MeetingStatus.ended:
            raise MeetingAccessError(400, "Meeting has ended")

        if self.is_meeting_host(meeting, user):
            if meeting.status == MeetingStatus.scheduled:
                raise MeetingAccessError(400, "Start the meeting before using chat.")
            return

        if user.role == UserRole.student:
            if meeting.status != MeetingStatus.live:
                raise MeetingAccessError(
                    400,
                    "Meeting has not started yet. Wait for the teacher to start it.",
                )
            return

        raise MeetingAccessError(403, "Not allowed to access this meeting chat")

    def assert_can_join_meeting(self, meeting: Meeting, user: User) -> None:
        if meeting.status == MeetingStatus.ended:
            raise MeetingAccessError(400, "Meeting has ended")

        is_host = self.is_meeting_host(meeting, user)
        is_student = user.role == UserRole.student
        if not is_host and not is_student:
            raise MeetingAccessError(403, "Not allowed to join this meeting")

        if is_student and meeting.status != MeetingStatus.live:
            raise MeetingAccessError(
                400,
                "Meeting has not started yet. Wait for the teacher to start it.",
            )

        if is_host and meeting.status == MeetingStatus.scheduled:
            raise MeetingAccessError(400, "Start the meeting before joining.")

    @staticmethod
    def assert_can_submit_report(user: User) -> None:
        if user.role != UserRole.student:
            raise MeetingAccessError(403, "Only students can submit game reports")

    @staticmethod
    def assert_can_view_report(user: User, student_id: UUID) -> None:
        if user.role == UserRole.student:
            if user.id != student_id:
                raise MeetingAccessError(403, "Not allowed to view this report")
            return
        if user.role == UserRole.teacher:
            return
        raise MeetingAccessError(403, "Not allowed to view this report")

    @staticmethod
    def assert_can_list_all_reports(user: User) -> None:
        if user.role != UserRole.teacher:
            raise MeetingAccessError(403, "Only teachers can list all game reports")

    @staticmethod
    def assert_can_list_own_reports(user: User) -> None:
        if user.role != UserRole.student:
            raise MeetingAccessError(403, "Only students can list own reports")

    def assert_can_use_whiteboard(self, meeting: Meeting, user: User) -> None:
        if meeting.status == MeetingStatus.ended:
            raise MeetingAccessError(400, "Meeting has ended")

        if self.is_meeting_host(meeting, user):
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

    def assert_can_edit_whiteboard(self, meeting: Meeting, user: User) -> None:
        self.assert_can_use_whiteboard(meeting, user)
        if not self.is_meeting_host(meeting, user):
            raise MeetingAccessError(
                403, "Only the teacher host can edit the whiteboard"
            )

    def whiteboard_role(self, meeting: Meeting, user: User) -> str:
        return "host" if self.is_meeting_host(meeting, user) else "viewer"
