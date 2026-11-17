from __future__ import annotations

import asyncio
import json
from typing import Any
from uuid import UUID

import jwt
import redis.asyncio as redis
import socketio

from collabaration_app.config import settings
from collabaration_app.database.session import async_session_factory
from collabaration_app.models import User
from collabaration_app.repositories.chat import ChatRepository
from collabaration_app.repositories.meeting import MeetingRepository
from collabaration_app.repositories.user import UserRepository
from collabaration_app.repositories.whiteboard import (
    EMPTY_APP_STATE,
    WhiteboardRepository,
    normalize_scene,
)
from collabaration_app.security import decode_access_token
from collabaration_app.services.chat import ChatService, chat_message_to_socket_payload
from collabaration_app.services.meeting_access import (
    MeetingAccessError,
    MeetingAccessService,
)
from collabaration_app.services.whiteboard import WhiteboardService

MAX_CHAT_LENGTH = 2000
WB_SCENE_TTL_SECONDS = 60 * 60 * 6
WB_DB_DEBOUNCE_SECONDS = 1.5

_cors_origins = [
    origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
]

mgr = socketio.AsyncRedisManager(settings.redis_url)
sio = socketio.AsyncServer(
    async_mode="asgi",
    client_manager=mgr,
    cors_allowed_origins=_cors_origins or "*",
)

_redis: redis.Redis | None = None
_wb_persist_tasks: dict[str, asyncio.Task[None]] = {}


def _meeting_room(meeting_id: UUID | str) -> str:
    return f"meeting:{meeting_id}"


def _wb_redis_key(meeting_id: UUID | str) -> str:
    return f"wb:scene:{meeting_id}"


async def _get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def _load_user(user_id: UUID) -> User | None:
    async with async_session_factory() as session:
        return await UserRepository(session).get_by_id(user_id)


def _chat_stack(session):
    meetings = MeetingRepository(session)
    access = MeetingAccessService(meetings)
    chat = ChatRepository(session)
    return ChatService(chat, access)


def _whiteboard_stack(session):
    meetings = MeetingRepository(session)
    access = MeetingAccessService(meetings)
    whiteboard = WhiteboardRepository(session)
    return WhiteboardService(whiteboard, access), whiteboard


async def _cache_scene(
    meeting_id: UUID, elements: list[Any], app_state: dict[str, Any]
) -> None:
    client = await _get_redis()
    payload = json.dumps({"elements": elements, "appState": app_state})
    await client.set(_wb_redis_key(meeting_id), payload, ex=WB_SCENE_TTL_SECONDS)


async def _read_cached_scene(meeting_id: UUID) -> dict[str, Any] | None:
    client = await _get_redis()
    raw = await client.get(_wb_redis_key(meeting_id))
    if not raw:
        return None
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    elements = data.get("elements")
    app_state = data.get("appState") or data.get("app_state")
    return normalize_scene(elements, app_state)


async def _load_scene_for_meeting(meeting_id: UUID) -> dict[str, Any]:
    cached = await _read_cached_scene(meeting_id)
    if cached is not None:
        return cached

    async with async_session_factory() as db:
        scene = await WhiteboardRepository(db).scene_for_meeting(meeting_id)
    await _cache_scene(meeting_id, scene["elements"], scene["appState"])
    return scene


def _wb_open_key(meeting_id: UUID | str) -> str:
    return f"wb:open:{meeting_id}"


async def _set_board_open(meeting_id: UUID, open_: bool) -> None:
    client = await _get_redis()
    await client.set(
        _wb_open_key(meeting_id),
        "1" if open_ else "0",
        ex=WB_SCENE_TTL_SECONDS,
    )


async def _is_board_open(meeting_id: UUID) -> bool:
    client = await _get_redis()
    value = await client.get(_wb_open_key(meeting_id))
    return value == "1"


async def _persist_scene_later(
    meeting_id: UUID,
    user_id: UUID,
    elements: list[Any],
    app_state: dict[str, Any],
) -> None:
    key = str(meeting_id)
    existing = _wb_persist_tasks.get(key)
    if existing and not existing.done():
        existing.cancel()

    async def _run() -> None:
        try:
            await asyncio.sleep(WB_DB_DEBOUNCE_SECONDS)
            async with async_session_factory() as db:
                whiteboard = WhiteboardRepository(db)
                await whiteboard.upsert_snapshot(
                    meeting_id=meeting_id,
                    elements=elements,
                    app_state=app_state,
                    last_modified_by=user_id,
                )
                await db.commit()
        except asyncio.CancelledError:
            raise
        except Exception:
            return
        finally:
            current = _wb_persist_tasks.get(key)
            if current is asyncio.current_task():
                _wb_persist_tasks.pop(key, None)

    _wb_persist_tasks[key] = asyncio.create_task(_run())


@sio.event
async def connect(sid: str, environ: dict, auth: dict | None = None) -> bool:
    token = None
    if isinstance(auth, dict):
        token = auth.get("token")
    if not token:
        return False
    try:
        payload = decode_access_token(str(token))
        user_id = UUID(str(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return False

    user = await _load_user(user_id)
    if user is None:
        return False

    await sio.save_session(
        sid,
        {
            "user_id": str(user.id),
            "username": user.username,
            "role": user.role.value,
        },
    )
    return True


@sio.event
async def disconnect(sid: str) -> None:
    return None


@sio.event
async def chat_join(sid: str, data: dict | None = None) -> dict:
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return {"ok": False, "error": "Not authenticated"}

    if not isinstance(data, dict) or not data.get("meeting_id"):
        return {"ok": False, "error": "meeting_id is required"}

    try:
        meeting_id = UUID(str(data["meeting_id"]))
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid meeting_id"}

    async with async_session_factory() as db:
        try:
            user = await UserRepository(db).get_by_id(UUID(user_id))
            if user is None:
                return {"ok": False, "error": "Not authenticated"}
            access = MeetingAccessService(MeetingRepository(db))
            meeting = await access.get_meeting_or_404(meeting_id)
            access.assert_can_chat(meeting, user)
        except MeetingAccessError as exc:
            return {"ok": False, "error": exc.detail, "status": exc.status_code}

    await sio.enter_room(sid, _meeting_room(meeting_id))
    return {"ok": True, "meeting_id": str(meeting_id)}


@sio.event
async def chat_msg(sid: str, data: dict | None = None) -> dict:
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    username = session.get("username")
    if not user_id or not username:
        return {"ok": False, "error": "Not authenticated"}

    if not isinstance(data, dict):
        return {"ok": False, "error": "Invalid payload"}

    try:
        meeting_id = UUID(str(data.get("meeting_id")))
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid meeting_id"}

    content = str(data.get("content") or "").strip()
    if not content:
        return {"ok": False, "error": "Message cannot be empty"}
    if len(content) > MAX_CHAT_LENGTH:
        return {"ok": False, "error": f"Message exceeds {MAX_CHAT_LENGTH} characters"}

    async with async_session_factory() as db:
        try:
            user = await UserRepository(db).get_by_id(UUID(user_id))
            if user is None:
                return {"ok": False, "error": "Not authenticated"}
            chat = _chat_stack(db)
            message = await chat.send_message(
                meeting_id=meeting_id,
                user=user,
                content=content,
            )
            await db.commit()
            payload = chat_message_to_socket_payload(
                message, meeting_id=meeting_id, sender_name=user.username
            )
        except MeetingAccessError as exc:
            return {"ok": False, "error": exc.detail, "status": exc.status_code}

    await sio.emit("chat_msg", payload, room=_meeting_room(meeting_id))
    return {"ok": True, "message": payload}


@sio.event
async def wb_join(sid: str, data: dict | None = None) -> dict:
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return {"ok": False, "error": "Not authenticated"}

    if not isinstance(data, dict) or not data.get("meeting_id"):
        return {"ok": False, "error": "meeting_id is required"}

    try:
        meeting_id = UUID(str(data["meeting_id"]))
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid meeting_id"}

    async with async_session_factory() as db:
        try:
            user = await UserRepository(db).get_by_id(UUID(user_id))
            if user is None:
                return {"ok": False, "error": "Not authenticated"}
            whiteboard, _ = _whiteboard_stack(db)
            role, _meeting = await whiteboard.assert_can_join(meeting_id, user)
        except MeetingAccessError as exc:
            return {"ok": False, "error": exc.detail, "status": exc.status_code}

    await sio.enter_room(sid, _meeting_room(meeting_id))
    scene = await _load_scene_for_meeting(meeting_id)
    board_open = await _is_board_open(meeting_id)
    return {
        "ok": True,
        "meeting_id": str(meeting_id),
        "role": role,
        "board_open": board_open,
        "elements": scene["elements"],
        "appState": scene["appState"],
    }


@sio.event
async def wb_presence(sid: str, data: dict | None = None) -> dict:
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return {"ok": False, "error": "Not authenticated"}

    if not isinstance(data, dict) or not data.get("meeting_id"):
        return {"ok": False, "error": "meeting_id is required"}

    try:
        meeting_id = UUID(str(data["meeting_id"]))
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid meeting_id"}

    open_ = bool(data.get("open"))

    async with async_session_factory() as db:
        try:
            user = await UserRepository(db).get_by_id(UUID(user_id))
            if user is None:
                return {"ok": False, "error": "Not authenticated"}
            whiteboard, _ = _whiteboard_stack(db)
            await whiteboard.assert_can_edit(meeting_id, user)
        except MeetingAccessError as exc:
            return {"ok": False, "error": exc.detail, "status": exc.status_code}

    await sio.enter_room(sid, _meeting_room(meeting_id))
    await _set_board_open(meeting_id, open_)
    payload = {
        "meeting_id": str(meeting_id),
        "open": open_,
        "from_user_id": user_id,
    }
    await sio.emit("wb_presence", payload, room=_meeting_room(meeting_id))
    return {"ok": True, "open": open_}


@sio.event
async def scene_update(sid: str, data: dict | None = None) -> dict:
    session = await sio.get_session(sid)
    user_id = session.get("user_id")
    if not user_id:
        return {"ok": False, "error": "Not authenticated"}

    if not isinstance(data, dict):
        return {"ok": False, "error": "Invalid payload"}

    try:
        meeting_id = UUID(str(data.get("meeting_id")))
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid meeting_id"}

    elements = data.get("elements")
    app_state = data.get("appState") or data.get("app_state")
    if not isinstance(elements, list):
        return {"ok": False, "error": "elements must be a list"}
    if not isinstance(app_state, dict):
        app_state = dict(EMPTY_APP_STATE)

    async with async_session_factory() as db:
        try:
            user = await UserRepository(db).get_by_id(UUID(user_id))
            if user is None:
                return {"ok": False, "error": "Not authenticated"}
            whiteboard, _ = _whiteboard_stack(db)
            await whiteboard.assert_can_edit(meeting_id, user)
        except MeetingAccessError as exc:
            return {"ok": False, "error": exc.detail, "status": exc.status_code}

    await _cache_scene(meeting_id, elements, app_state)
    await _persist_scene_later(meeting_id, UUID(user_id), elements, app_state)

    payload = {
        "meeting_id": str(meeting_id),
        "elements": elements,
        "appState": app_state,
        "from_user_id": user_id,
    }
    await sio.emit(
        "scene_update",
        payload,
        room=_meeting_room(meeting_id),
        skip_sid=sid,
    )
    return {"ok": True}
