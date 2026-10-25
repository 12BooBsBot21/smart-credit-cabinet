from dataclasses import replace

from app.domain.scoring import BASE_SCORE, FACTORS, ScoringInput, grade_for, score

STRONG = ScoringInput(
    business_age_months=60,
    avg_monthly_revenue=2_500_000,
    revenue_volatility=0.1,
    payment_to_revenue=0.05,
    current_overdue_days=0,
    max_overdue_days_24m=0,
    closed_loans_without_overdue=3,
    inquiries_30d=0,
    amount_to_annual_revenue=0.05,
    has_tax_debt=False,
    mass_registration=False,
)


def test_grade_thresholds():
    assert grade_for(700) == "A"
    assert grade_for(699) == "B"
    assert grade_for(600) == "C"
    assert grade_for(550) == "D"
    assert grade_for(549) == "E"


def test_strong_borrower_gets_grade_a():
    result = score(STRONG)
    assert result.grade == "A"
    assert result.score == BASE_SCORE + sum(f.points for f in result.factors)


def test_every_factor_is_explained():
    result = score(STRONG)
    assert len(result.factors) == len(FACTORS)
    assert all(f.code and f.name and f.comment for f in result.factors)


def test_overdue_and_tax_debt_lower_the_score():
    risky = replace(STRONG, current_overdue_days=45, max_overdue_days_24m=90, has_tax_debt=True)
    assert score(risky).score < score(STRONG).score - 200
    assert score(risky).grade in "DE"


def test_missing_bank_statement_is_penalised_but_not_blocking():
    result = score(replace(STRONG, revenue_volatility=None))
    stability = next(f for f in result.factors if f.code == "F03")
    assert stability.points < 0
    assert result.grade == "A"
