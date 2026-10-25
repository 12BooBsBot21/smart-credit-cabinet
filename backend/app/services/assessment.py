"""Факты о заявке: из внутренних данных банка и ответов внешних источников.

Факты нужны скорингу, правилам решения и карточке андеррайтера, поэтому собираются
в одном месте. Здесь же — перевод фактов во входные данные app/domain/scoring.py и decision.py.
"""

from dataclasses import dataclass
from datetime import date
from statistics import mean, pstdev
from typing import Any

from app.domain.decision import DecisionInput, ProductTerms
from app.domain.finance import annuity_payment
from app.domain.scoring import ScoringInput
from app.models import Application, Product, ScoreResult


@dataclass(frozen=True)
class Facts:
    is_bank_client: bool
    business_age_months: int
    company_status: str
    avg_monthly_revenue: float
    revenue_source: str  # ACCOUNT — по оборотам счёта, DECLARED — со слов клиента
    revenue_volatility: float | None
    revenue_mismatch: float | None  # доля расхождения заявленной выручки с оборотами
    current_overdue_days: int
    max_overdue_days_24m: int
    closed_loans_without_overdue: int
    current_monthly_payments: float
    inquiries_30d: int
    has_tax_debt: bool
    mass_registration: bool
    bki_available: bool


def latest_responses(application: Application) -> dict[str, dict[str, Any]]:
    """Последний успешный ответ каждого источника."""
    result: dict[str, dict[str, Any]] = {}
    for check in application.external_checks:
        if check.status == "OK" and check.response is not None:
            result[check.source] = check.response
    return result


def months_between(start: date, end: date) -> int:
    return (end.year - start.year) * 12 + end.month - start.month - (1 if end.day < start.day else 0)


def collect_facts(application: Application, today: date | None = None) -> Facts:
    today = today or date.today()
    company = application.company
    responses = latest_responses(application)
    egrul = responses.get("EGRUL", {})
    bki = responses.get("BKI")
    fns = responses.get("FNS_PB", {})

    registered_at = date.fromisoformat(egrul["registered_at"]) if "registered_at" in egrul else company.registered_at

    inflows = [t.inflow for t in company.turnovers]
    revenue_mismatch = None
    if inflows:
        avg_revenue = mean(inflows)
        volatility = pstdev(inflows) / avg_revenue if avg_revenue else None
        revenue_source = "ACCOUNT"
        if application.declared_revenue_12m:
            actual = sum(inflows)
            revenue_mismatch = abs(application.declared_revenue_12m - actual) / actual
    else:
        avg_revenue = (application.declared_revenue_12m or 0) / 12
        volatility = None
        revenue_source = "DECLARED"

    bki = bki or {}
    return Facts(
        is_bank_client=company.is_bank_client,
        business_age_months=months_between(registered_at, today),
        company_status=egrul.get("status", "UNKNOWN"),
        avg_monthly_revenue=avg_revenue,
        revenue_source=revenue_source,
        revenue_volatility=volatility,
        revenue_mismatch=revenue_mismatch,
        current_overdue_days=bki.get("current_overdue_days", 0),
        max_overdue_days_24m=bki.get("max_overdue_days_24m", 0),
        closed_loans_without_overdue=bki.get("closed_loans_without_overdue", 0),
        current_monthly_payments=sum(loan["monthly_payment"] for loan in bki.get("active_loans", [])),
        inquiries_30d=bki.get("inquiries_30d", 0),
        has_tax_debt=fns.get("tax_debt", False),
        mass_registration=fns.get("mass_address", False) or fns.get("mass_director", False),
        bki_available="BKI" in responses,
    )


def product_terms(product: Product) -> ProductTerms:
    rules = product.rules
    return ProductTerms(
        code=product.code,
        name=product.name,
        amount_min=product.amount_min,
        amount_max=product.amount_max,
        term_min=product.term_min,
        term_max=product.term_max,
        base_rate=product.base_rate,
        min_grade=rules["min_grade"],
        payment_share=rules["payment_share"],
        collateral_required=rules.get("collateral_required", False),
        min_business_age_months=rules.get("min_business_age_months", 0),
        requires_bank_account=rules.get("requires_bank_account", False),
    )


def scoring_input(application: Application, facts: Facts) -> ScoringInput:
    new_payment = annuity_payment(application.amount, application.product.base_rate, application.term_months)
    revenue = facts.avg_monthly_revenue or 1  # защита от деления на ноль: без выручки нагрузка будет огромной
    return ScoringInput(
        business_age_months=facts.business_age_months,
        avg_monthly_revenue=facts.avg_monthly_revenue,
        revenue_volatility=facts.revenue_volatility,
        payment_to_revenue=(facts.current_monthly_payments + new_payment) / revenue,
        current_overdue_days=facts.current_overdue_days,
        max_overdue_days_24m=facts.max_overdue_days_24m,
        closed_loans_without_overdue=facts.closed_loans_without_overdue,
        inquiries_30d=facts.inquiries_30d,
        amount_to_annual_revenue=application.amount / (revenue * 12),
        has_tax_debt=facts.has_tax_debt,
        mass_registration=facts.mass_registration,
    )


def decision_input(
    application: Application, facts: Facts, score: ScoreResult, products: list[Product]
) -> DecisionInput:
    asset = max(application.company.assets, key=lambda a: a["value"], default=None)
    return DecisionInput(
        product=product_terms(application.product),
        other_products=[product_terms(p) for p in products if p.code != application.product_code],
        amount=application.amount,
        term_months=application.term_months,
        collateral_value=application.collateral_value,
        grade=score.grade,
        score=score.score,
        company_status=facts.company_status,
        is_bank_client=facts.is_bank_client,
        business_age_months=facts.business_age_months,
        current_overdue_days=facts.current_overdue_days,
        avg_monthly_revenue=facts.avg_monthly_revenue,
        current_monthly_payments=facts.current_monthly_payments,
        revenue_mismatch=facts.revenue_mismatch,
        revenue_confirmed_by_client=application.revenue_confirmed_by_client,
        mass_registration=facts.mass_registration,
        known_asset_name=asset["name"] if asset else None,
        known_asset_value=asset["value"] if asset else None,
    )
