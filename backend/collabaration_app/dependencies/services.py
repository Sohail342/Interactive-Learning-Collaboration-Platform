from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.dependencies.repositories import (
    get_chat_repository,
    get_meeting_repository,
    get_sudoku_report_repository,
    get_user_repository,
    get_whiteboard_repository,
)
from collabaration_app.repositories.chat import ChatRepository
from collabaration_app.repositories.meeting import MeetingRepository
from collabaration_app.repositories.sudoku import SudokuReportRepository
from collabaration_app.repositories.user import UserRepository
from collabaration_app.repositories.whiteboard import WhiteboardRepository
from collabaration_app.services.auth import AuthService
from collabaration_app.services.chat import ChatService
from collabaration_app.services.elevenlabs import ElevenLabsService
from collabaration_app.services.livekit import LiveKitService
from collabaration_app.services.meeting import MeetingService
from collabaration_app.services.meeting_access import MeetingAccessService
from collabaration_app.services.reports import ReportService
from collabaration_app.services.whiteboard import WhiteboardService


def get_meeting_access_service(
    meetings: MeetingRepository = Depends(get_meeting_repository),
) -> MeetingAccessService:
    return MeetingAccessService(meetings)


def get_livekit_service() -> LiveKitService:
    return LiveKitService()


def get_elevenlabs_service() -> ElevenLabsService:
    return ElevenLabsService()


def get_chat_service(
    chat: ChatRepository = Depends(get_chat_repository),
    access: MeetingAccessService = Depends(get_meeting_access_service),
) -> ChatService:
    return ChatService(chat, access)


def get_meeting_service(
    session: AsyncSession = Depends(get_session),
    meetings: MeetingRepository = Depends(get_meeting_repository),
    access: MeetingAccessService = Depends(get_meeting_access_service),
    livekit: LiveKitService = Depends(get_livekit_service),
) -> MeetingService:
    return MeetingService(session, meetings, access, livekit)


def get_whiteboard_service(
    whiteboard: WhiteboardRepository = Depends(get_whiteboard_repository),
    access: MeetingAccessService = Depends(get_meeting_access_service),
) -> WhiteboardService:
    return WhiteboardService(whiteboard, access)


def get_report_service(
    session: AsyncSession = Depends(get_session),
    reports: SudokuReportRepository = Depends(get_sudoku_report_repository),
    access: MeetingAccessService = Depends(get_meeting_access_service),
) -> ReportService:
    return ReportService(session, reports, access)


def get_auth_service(
    session: AsyncSession = Depends(get_session),
    users: UserRepository = Depends(get_user_repository),
) -> AuthService:
    return AuthService(session, users)
