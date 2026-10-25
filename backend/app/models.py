"""Таблицы БД (SQLAlchemy 2). Схема описана в docs/data-model.md, миграции — в alembic/versions."""

from datetime import UTC, date, datetime
from typing import Any

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class Company(Base):
    """Компания клиента — то, что банк уже знает о ней."""

    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    inn: Mapped[str] = mapped_column(String(12), unique=True)
    ogrn: Mapped[str] = mapped_column(String(15))
    name: Mapped[str] = mapped_column(String(255))
    legal_form: Mapped[str] = mapped_column(String(8))  # OOO | IP
    okved: Mapped[str] = mapped_column(String(16))
    okved_name: Mapped[str] = mapped_column(String(255))
    region: Mapped[str] = mapped_column(String(128))
    director: Mapped[str] = mapped_column(String(255))
    registered_at: Mapped[date] = mapped_column(Date)
    # Есть расчётный счёт в банке → есть обороты (account_turnovers), анкета почти не нужна
    is_bank_client: Mapped[bool] = mapped_column(Boolean, default=False)
    # Имущество, о котором знает банк: [{"name": ..., "value": ...}] — кандидат в залог
    assets: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)

    turnovers: Mapped[list["AccountTurnover"]] = relationship(
        back_populates="company", order_by="AccountTurnover.month", cascade="all, delete-orphan"
    )


class AccountTurnover(Base):
    """Обороты по расчётному счёту за месяц — внутренние данные банка."""

    __tablename__ = "account_turnovers"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    month: Mapped[str] = mapped_column(String(7))  # YYYY-MM
    inflow: Mapped[int] = mapped_column(BigInteger)
    outflow: Mapped[int] = mapped_column(BigInteger)

    company: Mapped[Company] = relationship(back_populates="turnovers")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(String(64), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16))  # CLIENT | UNDERWRITER
    # У сотрудника банка компании нет
    company_id: Mapped[int | None] = mapped_column(ForeignKey("companies.id"))

    company: Mapped[Company | None] = relationship()


class Product(Base):
    """Кредитный продукт. Параметры кредитной политики — в rules (см. app/synthetic/products.py)."""

    __tablename__ = "products"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    plain_name: Mapped[str] = mapped_column(Text)
    amount_min: Mapped[int] = mapped_column(BigInteger)
    amount_max: Mapped[int] = mapped_column(BigInteger)
    term_min: Mapped[int] = mapped_column(Integer)
    term_max: Mapped[int] = mapped_column(Integer)
    base_rate: Mapped[float] = mapped_column(Float)
    rules: Mapped[dict[str, Any]] = mapped_column(JSONB)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Application(Base):
    """Кредитная заявка — центральная сущность. Статусы: app/domain/statuses.py."""

    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str | None] = mapped_column(String(16), unique=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True)
    product_code: Mapped[str] = mapped_column(ForeignKey("products.code"))
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(24), index=True)

    amount: Mapped[int] = mapped_column(BigInteger)
    term_months: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(Text)
    declared_revenue_12m: Mapped[int | None] = mapped_column(BigInteger)
    collateral_description: Mapped[str | None] = mapped_column(Text)
    collateral_value: Mapped[int | None] = mapped_column(BigInteger)
    # Клиент подтвердил заявленную выручку, хотя она расходится с оборотами по счёту
    revenue_confirmed_by_client: Mapped[bool] = mapped_column(Boolean, default=False)
    # Код подтверждения подписи (мок простой электронной подписи) — показывается в кабинете
    sign_code: Mapped[str | None] = mapped_column(String(8))

    # Оптимистичная блокировка: SQLAlchemy сам увеличивает version и проверяет её при UPDATE.
    # Если заявку одновременно изменили двое, второй получит StaleDataError → HTTP 409.
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    __mapper_args__ = {"version_id_col": version}

    company: Mapped[Company] = relationship()
    product: Mapped[Product] = relationship()
    events: Mapped[list["ApplicationEvent"]] = relationship(order_by="ApplicationEvent.id")
    offers: Mapped[list["Offer"]] = relationship(order_by="Offer.id")
    info_requests: Mapped[list["InfoRequest"]] = relationship(order_by="InfoRequest.id")
    external_checks: Mapped[list["ExternalCheck"]] = relationship(order_by="ExternalCheck.id")
    score_results: Mapped[list["ScoreResult"]] = relationship(order_by="ScoreResult.id")
    decisions: Mapped[list["Decision"]] = relationship(order_by="Decision.id")


class ExternalCheck(Base):
    """Ответ внешнего источника. Хранится снимком, чтобы решение можно было воспроизвести."""

    __tablename__ = "external_checks"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    source: Mapped[str] = mapped_column(String(16))  # EGRUL | BKI | FNS_PB
    status: Mapped[str] = mapped_column(String(8))  # OK | ERROR
    attempts: Mapped[int] = mapped_column(Integer)
    response: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ScoreResult(Base):
    __tablename__ = "score_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)
    grade: Mapped[str] = mapped_column(String(1))
    factors: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    model_version: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Decision(Base):
    """Кредитное решение — системы или андеррайтера. Каждое решение сохраняется, история не теряется."""

    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    outcome: Mapped[str] = mapped_column(String(24))
    decided_by: Mapped[str] = mapped_column(String(16))  # SYSTEM | UNDERWRITER
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    # [{"code": "R41", "client_text": ..., "bank_text": ...}]
    reasons: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    # Для ручной проверки — что предложила бы система автоматически
    recommendation: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    rules_version: Mapped[str] = mapped_column(String(32))
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User | None] = relationship()


class Offer(Base):
    """Вариант условий, который банк предлагает клиенту."""

    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"))
    product_code: Mapped[str] = mapped_column(ForeignKey("products.code"))
    amount: Mapped[int] = mapped_column(BigInteger)
    term_months: Mapped[int] = mapped_column(Integer)
    rate: Mapped[float] = mapped_column(Float)
    monthly_payment: Mapped[int] = mapped_column(BigInteger)
    collateral: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12))  # PROPOSED | ACCEPTED | DECLINED | WITHDRAWN
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship()


class InfoRequest(Base):
    """Запрос дополнительной информации у клиента."""

    __tablename__ = "info_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    requested_by: Mapped[str] = mapped_column(String(16))  # SYSTEM | UNDERWRITER
    # [{"code": "REVENUE", "text": "..."}]; коды: REVENUE, COLLATERAL, REVENUE_CONFIRM, OTHER
    items: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(12), default="OPEN")  # OPEN | ANSWERED
    response_comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ApplicationEvent(Base):
    """Журнал заявки: аудит для банка и лента событий для клиента (visible_to_client)."""

    __tablename__ = "application_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    actor: Mapped[str] = mapped_column(String(16))  # CLIENT | SYSTEM | UNDERWRITER
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(32))
    from_status: Mapped[str | None] = mapped_column(String(24))
    to_status: Mapped[str | None] = mapped_column(String(24))
    message: Mapped[str] = mapped_column(Text)
    visible_to_client: Mapped[bool] = mapped_column(Boolean, default=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    actor_user: Mapped[User | None] = relationship()


class Job(Base):
    """Задание конвейера. Таблица работает как очередь: воркер забирает строки
    через SELECT … FOR UPDATE SKIP LOCKED, поэтому воркеров можно запускать несколько."""

    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_queue", "status", "run_after"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True)
    step: Mapped[str] = mapped_column(String(16))  # validate | enrich | score | decide
    status: Mapped[str] = mapped_column(String(12), default="PENDING")  # PENDING | RUNNING | DONE | FAILED
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    run_after: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
