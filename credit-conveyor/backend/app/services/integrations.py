"""Клиент внешних источников. В прототипе это HTTP-сервис моков (app/mocks/main.py).

Таймаут, несколько попыток с нарастающей паузой. Если источник так и не ответил,
бросаем SourceUnavailable — конвейер передаст заявку специалисту.
"""

import logging
import time
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

log = logging.getLogger(__name__)

SOURCES = {
    "EGRUL": "/egrul/{inn}",
    "BKI": "/bki/{inn}",
    "FNS_PB": "/fns-pb/{inn}",
}
SOURCE_NAMES = {
    "EGRUL": "ЕГРЮЛ/ЕГРИП",
    "BKI": "Бюро кредитных историй",
    "FNS_PB": "ФНС «Прозрачный бизнес»",
}


@dataclass(frozen=True)
class SourceResponse:
    source: str
    data: dict[str, Any]
    attempts: int


class SourceUnavailable(Exception):
    def __init__(self, source: str, attempts: int, error: str):
        super().__init__(f"{source} недоступен после {attempts} попыток: {error}")
        self.source = source
        self.attempts = attempts
        self.error = error


_client: httpx.Client | None = None


def set_http_client(client: httpx.Client | None) -> None:
    """Подменить HTTP-клиент. В тестах сюда передают TestClient приложения моков."""
    global _client
    _client = client


def _http() -> httpx.Client:
    global _client
    if _client is None:
        _client = httpx.Client(base_url=settings.mocks_url, timeout=settings.mocks_timeout_sec)
    return _client


def fetch(source: str, inn: str) -> SourceResponse:
    path = SOURCES[source].format(inn=inn)
    last_error = ""
    for attempt in range(1, settings.mocks_retries + 1):
        try:
            response = _http().get(path)
            if response.status_code == 404:
                return SourceResponse(source, {"found": False}, attempt)
            response.raise_for_status()
            return SourceResponse(source, response.json(), attempt)
        except (httpx.TransportError, httpx.HTTPStatusError) as exc:
            last_error = str(exc) or exc.__class__.__name__
            log.warning("Источник не ответил: %s", last_error, extra={"source": source, "attempt": attempt})
            if attempt < settings.mocks_retries:
                time.sleep(settings.mocks_backoff_sec * 2 ** (attempt - 1))
    raise SourceUnavailable(source, settings.mocks_retries, last_error)
