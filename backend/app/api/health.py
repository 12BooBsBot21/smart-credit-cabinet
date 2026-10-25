from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession

router = APIRouter(prefix="/health", tags=["Служебное"])


@router.get("/live")
def live() -> dict[str, str]:
    """Процесс жив."""
    return {"status": "ok"}


@router.get("/ready")
def ready(session: DbSession) -> dict[str, str]:
    """Сервис готов принимать запросы: БД доступна."""
    session.execute(text("SELECT 1"))
    return {"status": "ok"}
