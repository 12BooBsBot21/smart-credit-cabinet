"""Правила кредитного решения: каждый из исходов на подобранных входных данных."""

from dataclasses import replace

from app.domain.decision import DecisionInput, ProductTerms, decide
from app.domain.statuses import Status

UNSECURED = ProductTerms(
    code="working-capital",
    name="Кредит без залога",
    amount_min=100_000,
    amount_max=5_000_000,
    term_min=6,
    term_max=36,
    base_rate=23.9,
    min_grade="C",
    payment_share={"A": 0.25, "B": 0.2, "C": 0.15},
    min_business_age_months=6,
)
SECURED = ProductTerms(
    code="secured-loan",
    name="Кредит под залог",
    amount_min=500_000,
    amount_max=30_000_000,
    term_min=12,
    term_max=84,
    base_rate=16.5,
    min_grade="D",
    payment_share={"A": 0.35, "B": 0.3, "C": 0.25, "D": 0.2},
    collateral_required=True,
    min_business_age_months=12,
)

BASE = DecisionInput(
    product=UNSECURED,
    other_products=[SECURED],
    amount=2_000_000,
    term_months=24,
    collateral_value=None,
    grade="A",
    score=760,
    company_status="ACTIVE",
    is_bank_client=True,
    business_age_months=60,
    current_overdue_days=0,
    avg_monthly_revenue=2_400_000,
    current_monthly_payments=0,
    revenue_mismatch=None,
    revenue_confirmed_by_client=False,
    mass_registration=False,
)


def test_approval_on_requested_terms():
    result = decide(BASE)
    assert result.outcome == Status.APPROVED
    [offer] = result.offers
    assert (offer.amount, offer.term_months) == (2_000_000, 24)
    assert offer.rate == 23.9


def test_counter_offer_suggests_longer_term_and_smaller_amount():
    result = decide(replace(BASE, grade="C", amount=2_500_000, term_months=12, avg_monthly_revenue=1_130_000))
    assert result.outcome == Status.COUNTER_OFFER
    longer, smaller = result.offers
    assert longer.amount == 2_500_000 and longer.term_months > 12
    assert smaller.term_months == 12 and smaller.amount < 2_500_000


def test_stop_factor_overdue_means_rejection():
    result = decide(replace(BASE, current_overdue_days=45))
    assert result.outcome == Status.REJECTED
    assert result.reasons[0].code == "R11"


def test_liquidating_company_is_rejected():
    assert decide(replace(BASE, company_status="LIQUIDATING")).outcome == Status.REJECTED


def test_revenue_mismatch_requests_information():
    result = decide(replace(BASE, revenue_mismatch=0.4))
    assert result.outcome == Status.NEEDS_INFO
    assert result.info_items[0].code == "REVENUE_CONFIRM"


def test_confirmed_mismatch_goes_to_underwriter():
    result = decide(replace(BASE, revenue_mismatch=0.4, revenue_confirmed_by_client=True))
    assert result.outcome == Status.MANUAL_REVIEW
    assert result.recommendation is not None


def test_large_amount_goes_to_manual_review_with_recommendation():
    result = decide(replace(BASE, product=SECURED, amount=8_000_000, term_months=36, collateral_value=12_000_000))
    assert result.outcome == Status.MANUAL_REVIEW
    assert {r.code for r in result.reasons} == {"R20"}
    assert result.recommendation.outcome == Status.APPROVED


def test_same_grade_gives_different_terms_for_different_products():
    """Кейс, стр. 15: одинаковая оценка риска — разные условия для разных продуктов."""
    request = replace(BASE, grade="C", amount=3_000_000, term_months=24, avg_monthly_revenue=1_000_000)
    unsecured = decide(request)
    secured = decide(replace(request, product=SECURED, other_products=[UNSECURED], collateral_value=5_000_000))
    assert unsecured.outcome == Status.COUNTER_OFFER
    assert secured.outcome == Status.APPROVED
    assert secured.offers[0].rate < unsecured.offers[0].rate


def test_grade_below_product_minimum_offers_another_product_with_known_collateral():
    result = decide(replace(BASE, grade="D", score=560, known_asset_name="Автомобиль", known_asset_value=1_200_000))
    # Грейд D — серая зона, но рекомендация для андеррайтера — залоговый продукт
    assert result.outcome == Status.MANUAL_REVIEW
    recommendation = result.recommendation
    assert recommendation.outcome == Status.COUNTER_OFFER
    assert recommendation.offers[0].product_code == "secured-loan"
    assert recommendation.offers[0].amount <= 840_000  # не больше 70% стоимости залога
