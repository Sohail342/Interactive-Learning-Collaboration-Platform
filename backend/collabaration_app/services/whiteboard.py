from typing import Any
from uuid import UUID

from collabaration_app.models import User
from collabaration_app.models.whiteboard import WhiteboardSnapshot
from collabaration_app.repositories.whiteboard import (
    EMPTY_APP_STATE,
    EMPTY_ELEMENTS,
    WhiteboardRepository,
    normalize_scene,
)
from collabaration_app.schemas.whiteboard import WhiteboardResponse
from collabaration_app.services.meeting_access import MeetingAccessService


class WhiteboardService:
    def __init__(
        self,
        whiteboard: WhiteboardRepository,
        access: MeetingAccessService,
    ) -> None:
        self._whiteboard = whiteboard
        self._access = access

    async def get_for_meeting(self, meeting_id: UUID, user: User) -> WhiteboardResponse:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_use_whiteboard(meeting, user)
        snapshot = await self._whiteboard.get_by_meeting(meeting_id)
        if snapshot is None:
            return WhiteboardResponse(
                meeting_id=meeting_id,
                elements=list(EMPTY_ELEMENTS),
                app_state=dict(EMPTY_APP_STATE),
                last_modified_by=None,
                updated_at=None,
            )
        scene = normalize_scene(snapshot.elements_json, snapshot.app_state_json)
        return WhiteboardResponse(
            meeting_id=snapshot.meeting_id,
            elements=scene["elements"],
            app_state=scene["appState"],
            last_modified_by=snapshot.last_modified_by,
            updated_at=snapshot.updated_at,
        )

    async def scene_for_meeting(self, meeting_id: UUID) -> dict[str, Any]:
        return await self._whiteboard.scene_for_meeting(meeting_id)

    async def upsert_snapshot(
        self,
        *,
        meeting_id: UUID,
        elements: list[Any],
        app_state: dict[str, Any],
        last_modified_by: UUID | None,
    ) -> WhiteboardSnapshot:
        return await self._whiteboard.upsert_snapshot(
            meeting_id=meeting_id,
            elements=elements,
            app_state=app_state,
            last_modified_by=last_modified_by,
        )

    async def assert_can_join(self, meeting_id: UUID, user: User) -> tuple[str, Any]:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_use_whiteboard(meeting, user)
        return self._access.whiteboard_role(meeting, user), meeting

    async def assert_can_edit(self, meeting_id: UUID, user: User) -> None:
        meeting = await self._access.get_meeting_or_404(meeting_id)
        self._access.assert_can_edit_whiteboard(meeting, user)
