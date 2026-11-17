from uuid import UUID

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from collabaration_app.database.session import get_session
from collabaration_app.models import User
from collabaration_app.repositories.user import UserRepository
from collabaration_app.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)
_UNAUTHORIZED = HTTPException(status_code=401, detail="Not authenticated")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _UNAUTHORIZED
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(str(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _UNAUTHORIZED from None
    user = await UserRepository(session).get_by_id(user_id)
    if user is None:
        raise _UNAUTHORIZED
    return user
