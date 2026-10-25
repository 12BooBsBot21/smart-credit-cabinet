"""Пароли и JWT. Роли пользователей: клиент и андеррайтер."""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from enum import StrEnum

import jwt

from app.config import settings

PBKDF2_ITERATIONS = 100_000


class Role(StrEnum):
    CLIENT = "CLIENT"
    UNDERWRITER = "UNDERWRITER"


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iterations, salt, expected = stored.split("$")
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations))
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.jwt_ttl_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Бросает jwt.PyJWTError, если токен поддельный или просрочен."""
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
