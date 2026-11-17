from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.repositories.chat import ChatRepository
from collabaration_app.repositories.meeting import MeetingRepository
from collabaration_app.repositories.sudoku import SudokuReportRepository
from collabaration_app.repositories.user import UserRepository
from collabaration_app.repositories.whiteboard import WhiteboardRepository


def get_chat_repository(
    session: AsyncSession = Depends(get_session),
) -> ChatRepository:
    return ChatRepository(session)


def get_meeting_repository(
    session: AsyncSession = Depends(get_session),
) -> MeetingRepository:
    return MeetingRepository(session)


def get_user_repository(
    session: AsyncSession = Depends(get_session),
) -> UserRepository:
    return UserRepository(session)


def get_whiteboard_repository(
    session: AsyncSession = Depends(get_session),
) -> WhiteboardRepository:
    return WhiteboardRepository(session)


def get_sudoku_report_repository(
    session: AsyncSession = Depends(get_session),
) -> SudokuReportRepository:
    return SudokuReportRepository(session)
