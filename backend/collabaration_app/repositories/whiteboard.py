from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.models.whiteboard import WhiteboardSnapshot

EMPTY_ELEMENTS: list[Any] = []
EMPTY_APP_STATE: dict[str, Any] = {
    "viewBackgroundColor": "#ffffff",
}


async def get_by_meeting(
    session: AsyncSession, meeting_id: UUID
) -> WhiteboardSnapshot | None:
    result = await session.execute(
        select(WhiteboardSnapshot).where(WhiteboardSnapshot.meeting_id == meeting_id)
    )
    return result.scalar_one_or_none()


async def upsert_snapshot(
    session: AsyncSession,
    *,
    meeting_id: UUID,
    elements: list[Any],
    app_state: dict[str, Any],
    last_modified_by: UUID | None,
) -> WhiteboardSnapshot:
    existing = await get_by_meeting(session, meeting_id)
    now = datetime.now(UTC)
    if existing is None:
        snapshot = WhiteboardSnapshot(
            id=uuid4(),
            meeting_id=meeting_id,
            elements_json=elements,
            app_state_json=app_state,
            last_modified_by=last_modified_by,
            updated_at=now,
        )
        session.add(snapshot)
        await session.flush()
        return snapshot

    existing.elements_json = elements
    existing.app_state_json = app_state
    existing.last_modified_by = last_modified_by
    existing.updated_at = now
    await session.flush()
    return existing
