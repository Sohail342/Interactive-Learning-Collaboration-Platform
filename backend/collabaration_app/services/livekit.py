from livekit.api import AccessToken, CreateRoomRequest, LiveKitAPI, VideoGrants

from collabaration_app.config import settings


async def ensure_room(room_name: str) -> None:
    """Create the LiveKit room if it is missing (for example after an idle timeout)."""
    client = LiveKitAPI(
        url=settings.livekit_http_url,
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    )
    try:
        await client.room.create_room(
            CreateRoomRequest(
                name=room_name,
                empty_timeout=600,
                departure_timeout=30,
            )
        )
    finally:
        await client.aclose()


def create_join_token(room_name: str, identity: str, name: str) -> str:
    token = (
        AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(name)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )
    )
    return token.to_jwt()
