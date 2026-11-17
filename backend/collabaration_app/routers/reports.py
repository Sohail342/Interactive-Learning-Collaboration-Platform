from uuid import UUID

from fastapi import APIRouter, Depends

from collabaration_app.dependencies.auth import get_current_user
from collabaration_app.dependencies.services import get_report_service
from collabaration_app.models import User
from collabaration_app.schemas.sudoku import (
    CreateSudokuReportRequest,
    SudokuReportResponse,
)
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    raise_meeting_access_http,
)
from collabaration_app.services.reports import ReportService, report_to_response

router = APIRouter(tags=["reports"])


@router.post("/reports", response_model=SudokuReportResponse)
async def submit_report(
    body: CreateSudokuReportRequest,
    user: User = Depends(get_current_user),
    reports: ReportService = Depends(get_report_service),
) -> SudokuReportResponse:
    try:
        report = await reports.submit(user, body)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return report_to_response(report)


@router.get("/reports/me", response_model=list[SudokuReportResponse])
async def my_reports(
    user: User = Depends(get_current_user),
    reports: ReportService = Depends(get_report_service),
) -> list[SudokuReportResponse]:
    try:
        rows = await reports.list_mine(user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return [report_to_response(report) for report in rows]


@router.get("/reports", response_model=list[SudokuReportResponse])
async def all_reports(
    user: User = Depends(get_current_user),
    reports: ReportService = Depends(get_report_service),
) -> list[SudokuReportResponse]:
    try:
        rows = await reports.list_all(user)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return [report_to_response(report) for report in rows]


@router.get("/reports/{report_id}", response_model=SudokuReportResponse)
async def report_detail(
    report_id: UUID,
    user: User = Depends(get_current_user),
    reports: ReportService = Depends(get_report_service),
) -> SudokuReportResponse:
    try:
        report = await reports.get_detail(user, report_id)
    except MeetingAccessError as exc:
        raise_meeting_access_http(exc)
    return report_to_response(report)
