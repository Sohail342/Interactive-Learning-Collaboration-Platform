from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from collabaration_app.config import settings
from collabaration_app.realtime import sio
from collabaration_app.routers.auth import router as auth_router
from collabaration_app.routers.chat import router as chat_router
from collabaration_app.routers.lookups import router as lookups_router
from collabaration_app.routers.meetings import router as meetings_router
from collabaration_app.routers.reports import router as reports_router
from collabaration_app.routers.whiteboard import router as whiteboard_router

fastapi_app = FastAPI(title="Learning & Collaboration Platform")
fastapi_app.include_router(auth_router)
fastapi_app.include_router(lookups_router)
fastapi_app.include_router(meetings_router)
fastapi_app.include_router(chat_router)
fastapi_app.include_router(reports_router)
fastapi_app.include_router(whiteboard_router)

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


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
