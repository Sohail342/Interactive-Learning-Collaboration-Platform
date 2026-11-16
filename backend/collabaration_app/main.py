from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from collabaration_app.config import settings
from collabaration_app.routers.auth import router as auth_router
from collabaration_app.routers.lookups import router as lookups_router

app = FastAPI(title="Learning & Collaboration Platform")
app.include_router(auth_router)
app.include_router(lookups_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
