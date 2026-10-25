"""Схемы запросов и ответов API (Pydantic). Из них FastAPI строит OpenAPI,
а фронтенд генерирует TypeScript-типы: npm run api:types."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.statuses import Action, Actor, Status
from app.security import Role


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- Авторизация ---


class LoginIn(BaseModel):
    login: str
    password: str


class UserOut(Schema):
    id: int
    login: str
    full_name: str
    role: Role
    company_id: int | None
    company_name: str | None = None


class TokenOut(BaseModel):
    access_token: str
    user: UserOut


class DemoAccountOut(BaseModel):
    login: str
    password: str
    full_name: str
    role: Role
    company_name: str | None
    hint: str


# --- Справочники ---


class ProductOut(BaseModel):
    code: str
    name: str
    plain_name: str
    amount_min: int
    amount_max: int
    term_min: int
    term_max: int
    base_rate: float
    collateral_required: bool
    requires_bank_account: bool
    min_business_age_months: int


class CompanyOut(Schema):
    id: int
    inn: str
    ogrn: str
    name: str
    legal_form: str
    okved: str
    okved_name: str
    region: str
    director: str
    registered_at: date
    is_bank_client: bool


class AssetOut(BaseModel):
    name: str
    value: int


class TurnoverOut(Schema):
    month: str
    inflow: int
    outflow: int


# --- Действия клиента ---


class ApplicationCreate(BaseModel):
    product_code: str
    amount: int = Field(gt=0, description="Сумма, ₽")
    term_months: int = Field(gt=0)
    purpose: str = Field(min_length=3, max_length=500)
    declared_revenue_12m: int | None = Field(default=None, gt=0, description="Выручка за 12 месяцев, ₽")
    collateral_description: str | None = Field(default=None, max_length=500)
    collateral_value: int | None = Field(default=None, gt=0)


class InfoResponseIn(BaseModel):
    comment: str = Field(min_length=1, max_length=1000)
    declared_revenue_12m: int | None = Field(default=None, gt=0)
    collateral_description: str | None = Field(default=None, max_length=500)
    collateral_value: int | None = Field(default=None, gt=0)


class SignIn(BaseModel):
    code: str = Field(min_length=4, max_length=8)


# --- Действия андеррайтера ---


class UnderwriterDecisionIn(BaseModel):
    outcome: Literal[Status.APPROVED, Status.COUNTER_OFFER, Status.NEEDS_INFO, Status.REJECTED]
    comment: str = Field(min_length=3, max_length=1000, description="Обоснование — попадает в журнал")
    amount: int | None = Field(default=None, gt=0, description="Для COUNTER_OFFER")
    term_months: int | None = Field(default=None, gt=0, description="Для COUNTER_OFFER")
    info_text: str | None = Field(default=None, max_length=1000, description="Для NEEDS_INFO — что запросить у клиента")


# --- Заявка ---


class OfferOut(BaseModel):
    id: int
    product_code: str
    product_name: str
    amount: int
    term_months: int
    rate: float
    monthly_payment: int
    collateral: str | None
    status: str


class InfoItemOut(BaseModel):
    code: str
    text: str


class InfoRequestOut(Schema):
    id: int
    requested_by: Actor
    items: list[InfoItemOut]
    status: str
    response_comment: str | None
    created_at: datetime


class EventOut(Schema):
    id: int
    actor: Actor
    actor_name: str | None = None
    event_type: str
    from_status: Status | None
    to_status: Status | None
    message: str
    visible_to_client: bool
    created_at: datetime


class ClientDecisionOut(BaseModel):
    outcome: Status
    reasons: list[str]
    created_at: datetime


class ApplicationSummary(BaseModel):
    id: int
    number: str
    status: Status
    product_code: str
    product_name: str
    company_name: str
    amount: int
    term_months: int
    created_at: datetime
    updated_at: datetime


class ApplicationDetail(ApplicationSummary):
    purpose: str
    declared_revenue_12m: int | None
    collateral_description: str | None
    collateral_value: int | None
    available_actions: list[Action]
    offers: list[OfferOut]
    info_request: InfoRequestOut | None
    decision: ClientDecisionOut | None
    sign_code: str | None = Field(description="Код подтверждения подписи — только в статусе SIGNING")
    events: list[EventOut]


# --- Карточка андеррайтера ---


class ReasonOut(BaseModel):
    code: str
    client_text: str
    bank_text: str


class OfferDraftOut(BaseModel):
    product_code: str
    amount: int
    term_months: int
    rate: float
    monthly_payment: int
    collateral: str | None


class RecommendationOut(BaseModel):
    outcome: Status
    reasons: list[ReasonOut]
    offers: list[OfferDraftOut]


class BankDecisionOut(Schema):
    id: int
    outcome: Status
    decided_by: Actor
    user_name: str | None
    reasons: list[ReasonOut]
    recommendation: RecommendationOut | None
    rules_version: str
    comment: str | None
    created_at: datetime


class ExternalCheckOut(Schema):
    id: int
    source: str
    source_name: str
    status: str
    attempts: int
    response: dict[str, Any] | None
    error: str | None
    created_at: datetime


class FactorOut(BaseModel):
    code: str
    name: str
    value: str
    points: int
    comment: str


class ScoreOut(Schema):
    score: int
    grade: str
    factors: list[FactorOut]
    model_version: str
    created_at: datetime


class FactsOut(BaseModel):
    is_bank_client: bool
    business_age_months: int
    company_status: str
    avg_monthly_revenue: float
    revenue_source: str
    revenue_volatility: float | None
    revenue_mismatch: float | None
    current_overdue_days: int
    max_overdue_days_24m: int
    closed_loans_without_overdue: int
    current_monthly_payments: float
    inquiries_30d: int
    has_tax_debt: bool
    mass_registration: bool
    bki_available: bool


class BankApplicationDetail(ApplicationDetail):
    company: CompanyOut
    company_assets: list[AssetOut]
    turnovers: list[TurnoverOut]
    facts: FactsOut
    external_checks: list[ExternalCheckOut]
    score: ScoreOut | None
    decisions: list[BankDecisionOut]
