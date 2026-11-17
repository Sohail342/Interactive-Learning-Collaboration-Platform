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


def normalize_scene(
    elements: Any,
    app_state: Any,
) -> dict[str, Any]:
    return {
        "elements": elements if isinstance(elements, list) else list(EMPTY_ELEMENTS),
        "appState": app_state if isinstance(app_state, dict) else dict(EMPTY_APP_STATE),
    }


class WhiteboardRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_meeting(self, meeting_id: UUID) -> WhiteboardSnapshot | None:
        result = await self._session.execute(
            select(WhiteboardSnapshot).where(
                WhiteboardSnapshot.meeting_id == meeting_id
            )
        )
        return result.scalar_one_or_none()

    async def upsert_snapshot(
        self,
        *,
        meeting_id: UUID,
        elements: list[Any],
        app_state: dict[str, Any],
        last_modified_by: UUID | None,
    ) -> WhiteboardSnapshot:
        existing = await self.get_by_meeting(meeting_id)
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
            self._session.add(snapshot)
            await self._session.flush()
            return snapshot

        existing.elements_json = elements
        existing.app_state_json = app_state
        existing.last_modified_by = last_modified_by
        existing.updated_at = now
        await self._session.flush()
        return existing

    async def scene_for_meeting(self, meeting_id: UUID) -> dict[str, Any]:
        snapshot = await self.get_by_meeting(meeting_id)
        if snapshot is None:
            return {
                "elements": list(EMPTY_ELEMENTS),
                "appState": dict(EMPTY_APP_STATE),
            }
        return normalize_scene(snapshot.elements_json, snapshot.app_state_json)
