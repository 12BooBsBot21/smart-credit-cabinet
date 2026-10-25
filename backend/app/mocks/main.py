"""Моки внешних источников: ЕГРЮЛ/ЕГРИП, бюро кредитных историй, ФНС «Прозрачный бизнес».

Отдельный HTTP-сервис, чтобы интеграция была настоящей: с задержками, ошибками и повторами.
Контракты упрощены, но сохраняют смысл реальных сервисов. Данные — из app/synthetic/personas.py.

Запуск: uvicorn app.mocks.main:app --port 8001
Сбои: MOCK_FAILURE_RATE=0.3 — примерно каждый третий ответ будет 503.
У персоны «ТехноСтарт» бюро не отвечает всегда.
"""

import random
import time

from fastapi import FastAPI, HTTPException

from app.config import settings
from app.synthetic.personas import Persona, find_by_inn

app = FastAPI(title="Моки внешних сервисов", version="0.1.0")


def _persona(inn: str) -> Persona:
    time.sleep(settings.mock_latency_sec)
    if random.random() < settings.mock_failure_rate:
        raise HTTPException(503, "Сервис временно недоступен (симуляция сбоя)")
    persona = find_by_inn(inn)
    if persona is None:
        raise HTTPException(404, "Не найдено")
    return persona


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/egrul/{inn}")
def egrul(inn: str) -> dict:
    """Выписка ЕГРЮЛ/ЕГРИП: существование и статус бизнеса, регистрационные данные, ОКВЭД."""
    p = _persona(inn)
    c = p.company
    return {
        "inn": c["inn"],
        "ogrn": c["ogrn"],
        "name": c["name"],
        "legal_form": c["legal_form"],
        "status": p.egrul_status,
        "registered_at": c["registered_at"].isoformat(),
        "okved": c["okved"],
        "okved_name": c["okved_name"],
        "director": c["director"],
        "address": p.address,
    }


@app.get("/bki/{inn}")
def bki(inn: str) -> dict:
    """Кредитная история: просрочки, закрытые и действующие кредиты, запросы других банков."""
    p = _persona(inn)
    if p.bki is None:
        raise HTTPException(503, "Бюро не отвечает (симуляция)")
    return {"inn": inn, **p.bki}


@app.get("/fns-pb/{inn}")
def fns_transparent_business(inn: str) -> dict:
    """ФНС «Прозрачный бизнес»: недоимки, массовость адреса и руководителя, численность."""
    p = _persona(inn)
    return {"inn": inn, **p.fns_pb}
