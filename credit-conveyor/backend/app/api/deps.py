"""Зависимости FastAPI: сессия БД, текущий пользователь, проверка роли."""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_session
from app.errors import Forbidden
from app.models import User
from app.security import Role, decode_access_token

DbSession = Annotated[Session, Depends(get_session)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    session: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Нужно войти в систему",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise unauthorized from None
    user = session.get(User, int(payload["sub"]))
    if user is None:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(role: Role):
    def dependency(user: CurrentUser) -> User:
        if user.role != role:
            raise Forbidden("Недостаточно прав")
        return user

    return dependency


ClientUser = Annotated[User, Depends(require_role(Role.CLIENT))]
UnderwriterUser = Annotated[User, Depends(require_role(Role.UNDERWRITER))]
