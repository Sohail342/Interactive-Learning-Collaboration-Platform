from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from collabaration_app.models.enums import GameStatus
from collabaration_app.models.sudoku import SudokuReport


class SudokuReportRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _with_relations(self, statement):
        return statement.options(
            selectinload(SudokuReport.student),
            selectinload(SudokuReport.meeting),
        )

    async def create(
        self,
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
    ) -> SudokuReport:
        report = SudokuReport(
            id=uuid4(),
            student_id=student_id,
            meeting_id=None,
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
        self._session.add(report)
        await self._session.flush()
        result = await self._session.execute(
            self._with_relations(
                select(SudokuReport).where(SudokuReport.id == report.id)
            )
        )
        return result.scalar_one()

    async def get(self, report_id: UUID) -> SudokuReport | None:
        result = await self._session.execute(
            self._with_relations(
                select(SudokuReport).where(SudokuReport.id == report_id)
            )
        )
        return result.scalar_one_or_none()

    async def list_for_student(self, student_id: UUID) -> list[SudokuReport]:
        result = await self._session.execute(
            self._with_relations(
                select(SudokuReport)
                .where(SudokuReport.student_id == student_id)
                .order_by(
                    SudokuReport.completed_at.desc().nullslast(),
                    SudokuReport.id.desc(),
                )
            )
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[SudokuReport]:
        result = await self._session.execute(
            self._with_relations(
                select(SudokuReport).order_by(
                    SudokuReport.completed_at.desc().nullslast(),
                    SudokuReport.id.desc(),
                )
            )
        )
        return list(result.scalars().all())
