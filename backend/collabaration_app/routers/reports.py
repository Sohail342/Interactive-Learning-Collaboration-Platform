from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.models import User
from collabaration_app.models.enums import UserRole
from collabaration_app.models.sudoku import SudokuReport
from collabaration_app.repositories.sudoku import (
    create_report,
    get_report,
    list_all_reports,
    list_reports_for_student,
)
from collabaration_app.schemas.sudoku import (
    ALLOWED_DIFFICULTIES,
    CreateSudokuReportRequest,
    SudokuReportResponse,
)
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    assert_can_list_all_reports,
    assert_can_submit_report,
    assert_can_view_report,
)

router = APIRouter(tags=["reports"])


def _to_response(report: SudokuReport) -> SudokuReportResponse:
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


@router.post("/reports", response_model=SudokuReportResponse)
async def submit_report(
    body: CreateSudokuReportRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SudokuReportResponse:
    difficulty = body.difficulty.strip().lower()
    if difficulty not in ALLOWED_DIFFICULTIES:
        raise HTTPException(status_code=422, detail="Invalid difficulty")
    if body.completion_time_seconds > body.time_limit_seconds:
        raise HTTPException(
            status_code=422,
            detail="completion_time_seconds cannot exceed time_limit_seconds",
        )

    try:
        assert_can_submit_report(user)
    except MeetingAccessError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    report = await create_report(
        session,
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
    await session.commit()
    return _to_response(report)


@router.get("/reports/me", response_model=list[SudokuReportResponse])
async def my_reports(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SudokuReportResponse]:
    if user.role != UserRole.student:
        raise HTTPException(
            status_code=403, detail="Only students can list own reports"
        )
    reports = await list_reports_for_student(session, user.id)
    return [_to_response(report) for report in reports]


@router.get("/reports", response_model=list[SudokuReportResponse])
async def all_reports(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SudokuReportResponse]:
    try:
        assert_can_list_all_reports(user)
    except MeetingAccessError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    reports = await list_all_reports(session)
    return [_to_response(report) for report in reports]


@router.get("/reports/{report_id}", response_model=SudokuReportResponse)
async def report_detail(
    report_id: UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SudokuReportResponse:
    report = await get_report(session, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        assert_can_view_report(user, report.student_id)
    except MeetingAccessError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    return _to_response(report)
