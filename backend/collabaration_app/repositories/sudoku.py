from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from collabaration_app.models.enums import GameStatus
from collabaration_app.models.sudoku import SudokuReport


async def create_report(
    session: AsyncSession,
    *,
    student_id: UUID,
    difficulty: str,
    time_limit_seconds: int,
    completion_time_seconds: int,
    correct_entries: int,
    incorrect_entries: int,
    mistakes_count: int,
    final_score: Decimal,
    status: GameStatus,
    completed_at: datetime | None,
    meeting_id: UUID | None = None,
) -> SudokuReport:
    report = SudokuReport(
        id=uuid4(),
        student_id=student_id,
        meeting_id=meeting_id,
        difficulty=difficulty,
        time_limit_seconds=time_limit_seconds,
        completion_time_seconds=completion_time_seconds,
        correct_entries=correct_entries,
        incorrect_entries=incorrect_entries,
        mistakes_count=mistakes_count,
        final_score=final_score,
        status=status,
        completed_at=completed_at,
    )
    session.add(report)
    await session.flush()
    result = await session.execute(
        select(SudokuReport)
        .where(SudokuReport.id == report.id)
        .options(
            selectinload(SudokuReport.student),
            selectinload(SudokuReport.meeting),
        )
    )
    return result.scalar_one()


async def get_report(session: AsyncSession, report_id: UUID) -> SudokuReport | None:
    result = await session.execute(
        select(SudokuReport)
        .where(SudokuReport.id == report_id)
        .options(
            selectinload(SudokuReport.student),
            selectinload(SudokuReport.meeting),
        )
    )
    return result.scalar_one_or_none()


async def list_reports_for_student(
    session: AsyncSession, student_id: UUID
) -> list[SudokuReport]:
    result = await session.execute(
        select(SudokuReport)
        .where(SudokuReport.student_id == student_id)
        .options(
            selectinload(SudokuReport.student),
            selectinload(SudokuReport.meeting),
        )
        .order_by(SudokuReport.completed_at.desc().nullslast(), SudokuReport.id.desc())
    )
    return list(result.scalars().all())


async def list_all_reports(session: AsyncSession) -> list[SudokuReport]:
    result = await session.execute(
        select(SudokuReport)
        .options(
            selectinload(SudokuReport.student),
            selectinload(SudokuReport.meeting),
        )
        .order_by(SudokuReport.completed_at.desc().nullslast(), SudokuReport.id.desc())
    )
    return list(result.scalars().all())
