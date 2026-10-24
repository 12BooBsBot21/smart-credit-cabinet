"""Демо-данные: продукты, компании, обороты по счёту, пользователи. Запускать можно сколько угодно раз.

    python -m app.seed           # создать или обновить справочники и учётки
    python -m app.seed --reset   # то же + удалить все заявки (сброс демо)
"""

import sys
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import (
    AccountTurnover,
    Application,
    ApplicationEvent,
    Company,
    Decision,
    ExternalCheck,
    InfoRequest,
    Job,
    Offer,
    Product,
    ScoreResult,
    User,
)
from app.security import Role, hash_password
from app.synthetic.personas import DEMO_PASSWORD, PERSONAS, UNDERWRITER
from app.synthetic.products import PRODUCTS


def last_months(count: int, today: date | None = None) -> list[str]:
    """Последние count полных месяцев, от старых к новым: ['2025-10', …, '2026-09']."""
    today = today or date.today()
    year, month = today.year, today.month
    months = []
    for _ in range(count):
        month -= 1
        if month == 0:
            year, month = year - 1, 12
        months.append(f"{year}-{month:02d}")
    return months[::-1]


def reset_applications(session: Session) -> None:
    # Порядок важен: сначала зависимые таблицы
    for model in (Job, ApplicationEvent, Offer, Decision, ScoreResult, ExternalCheck, InfoRequest, Application):
        session.execute(delete(model))


def upsert_user(session: Session, login: str, full_name: str, role: Role, company_id: int | None) -> None:
    user = session.scalar(select(User).where(User.login == login)) or User(login=login)
    user.full_name = full_name
    user.role = role
    user.company_id = company_id
    user.password_hash = hash_password(DEMO_PASSWORD)
    session.add(user)


def seed(session: Session, reset: bool = False) -> None:
    if reset:
        reset_applications(session)

    for data in PRODUCTS:
        session.merge(Product(**data))

    months = last_months(12)
    for persona in PERSONAS:
        company = session.scalar(select(Company).where(Company.inn == persona.company["inn"])) or Company()
        for key, value in persona.company.items():
            setattr(company, key, value)
        company.is_bank_client = persona.monthly_inflow is not None
        company.assets = persona.assets
        company.turnovers = [
            AccountTurnover(month=month, inflow=inflow, outflow=round(inflow * 0.88))
            for month, inflow in zip(months, persona.monthly_inflow or [])
        ]
        session.add(company)
        session.flush()
        upsert_user(session, persona.login, persona.full_name, Role.CLIENT, company.id)

    upsert_user(session, UNDERWRITER["login"], UNDERWRITER["full_name"], Role.UNDERWRITER, None)
    session.commit()


if __name__ == "__main__":
    with SessionLocal() as db_session:
        seed(db_session, reset="--reset" in sys.argv)
    print("Демо-данные загружены")
