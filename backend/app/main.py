"""Точка входа API: uvicorn app.main:app. Swagger — /api/docs."""

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm.exc import StaleDataError

from app.api import applications, auth, bank, catalog, health
from app.config import settings
from app.errors import AppError
from app.logging_setup import setup_logging

log = logging.getLogger("api")


def create_app() -> FastAPI:
    setup_logging(settings.log_level)
    app = FastAPI(
        title="Кредитный конвейер МСБ — API",
        version="0.1.0",
        description="Кабинет клиента и рабочее место андеррайтера. Тестовые учётки: GET /api/auth/demo-accounts",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
    )
    for module in (health, auth, catalog, applications, bank):
        app.include_router(module.router)

    @app.exception_handler(AppError)
    def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse({"detail": exc.message}, status_code=exc.status_code)

    @app.exception_handler(StaleDataError)
    def handle_stale(_: Request, __: StaleDataError) -> JSONResponse:
        # Сработала оптимистичная блокировка: заявку только что изменил кто-то другой
        return JSONResponse({"detail": "Заявка только что изменилась — обновите страницу"}, status_code=409)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        log.info(
            "%s %s",
            request.method,
            request.url.path,
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )
        return response

    return app


app = create_app()
