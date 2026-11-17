from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import redis.asyncio as redis
import socketio
from sqlalchemy import text

from collabaration_app.config import settings
from collabaration_app.database.session import async_session_factory
from collabaration_app.realtime import sio
from collabaration_app.routers.auth import router as auth_router
from collabaration_app.routers.chat import router as chat_router
from collabaration_app.routers.lookups import router as lookups_router
from collabaration_app.routers.meetings import router as meetings_router
from collabaration_app.routers.reports import router as reports_router
from collabaration_app.routers.tts import router as tts_router
from collabaration_app.routers.whiteboard import router as whiteboard_router

fastapi_app = FastAPI(title="Learning & Collaboration Platform")
fastapi_app.include_router(auth_router)
fastapi_app.include_router(lookups_router)
fastapi_app.include_router(meetings_router)
fastapi_app.include_router(chat_router)
fastapi_app.include_router(reports_router)
fastapi_app.include_router(whiteboard_router)
fastapi_app.include_router(tts_router)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@fastapi_app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@fastapi_app.get("/health/ready")
async def health_ready() -> JSONResponse:
    checks: dict[str, str] = {}
    ready = True

    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception:
        checks["postgres"] = "error"
        ready = False

    client: redis.Redis | None = None
    try:
        client = redis.from_url(settings.redis_url, decode_responses=True)
        await client.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"
        ready = False
    finally:
        if client is not None:
            await client.aclose()

    payload = {"status": "ok" if ready else "degraded", "checks": checks}
    return JSONResponse(content=payload, status_code=200 if ready else 503)


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
