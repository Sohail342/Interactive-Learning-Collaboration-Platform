from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(".env")


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    livekit_api_key: str
    livekit_api_secret: str
    livekit_public_url: str = "ws://localhost:7880"
    livekit_http_url: str = "http://localhost:7880"

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.is_file() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
