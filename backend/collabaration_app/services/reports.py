from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.models import User
from collabaration_app.models.sudoku import SudokuReport
from collabaration_app.repositories.sudoku import SudokuReportRepository
from collabaration_app.schemas.sudoku import (
    ALLOWED_DIFFICULTIES,
    CreateSudokuReportRequest,
    SudokuReportResponse,
)
from collabaration_app.services.meeting_access import MeetingAccessService


def report_to_response(report: SudokuReport) -> SudokuReportResponse:
    return SudokuReportResponse(
        id=report.id,
        student_id=report.student_id,
        student_name=report.student.username,
        meeting_id=report.meeting_id,
        meeting_title=report.meeting.title if report.meeting is not None else None,
        difficulty=report.difficulty,
        time_limit_seconds=report.time_limit_seconds,
        completion_time_seconds=report.completion_time_seconds,
        correct_entries=report.correct_entries,
        incorrect_entries=report.incorrect_entries,
        mistakes_count=report.mistakes_count,
        final_score=report.final_score,
        status=report.status,
        completed_at=report.completed_at,
    )


class ReportService:
    def __init__(
        self,
        session: AsyncSession,
        reports: SudokuReportRepository,
        access: MeetingAccessService,
    ) -> None:
        self._session = session
        self._reports = reports
        self._access = access

    async def submit(self, user: User, body: CreateSudokuReportRequest) -> SudokuReport:
        difficulty = body.difficulty.strip().lower()
        if difficulty not in ALLOWED_DIFFICULTIES:
            raise HTTPException(status_code=422, detail="Invalid difficulty")
        if body.completion_time_seconds > body.time_limit_seconds:
            raise HTTPException(
                status_code=422,
                detail="completion_time_seconds cannot exceed time_limit_seconds",
            )

        self._access.assert_can_submit_report(user)
        report = await self._reports.create(
            student_id=user.id,
            difficulty=difficulty,
            time_limit_seconds=body.time_limit_seconds,
            completion_time_seconds=body.completion_time_seconds,
            correct_entries=body.correct_entries,
            incorrect_entries=body.incorrect_entries,
            mistakes_count=body.mistakes_count,
            final_score=Decimal(body.final_score).quantize(Decimal("0.01")),
            status=body.status,
            completed_at=datetime.now(UTC),
        )
        await self._session.commit()
        return report

    async def list_mine(self, user: User) -> list[SudokuReport]:
        self._access.assert_can_list_own_reports(user)
        return await self._reports.list_for_student(user.id)

    async def list_all(self, user: User) -> list[SudokuReport]:
        self._access.assert_can_list_all_reports(user)
        return await self._reports.list_all()

    async def get_detail(self, user: User, report_id: UUID) -> SudokuReport:
        report = await self._reports.get(report_id)
        if report is None:
            raise HTTPException(status_code=404, detail="Report not found")
        self._access.assert_can_view_report(user, report.student_id)
        return report
