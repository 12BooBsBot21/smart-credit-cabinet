"""Аннуитетный платёж и обратная задача — сколько можно занять при заданном платеже.

Перенесено из прототипа (engine/finance.ts).
"""


def annuity_payment(amount: float, rate_year: float, months: int) -> float:
    """Ежемесячный платёж. rate_year — процент годовых, например 23.9."""
    r = rate_year / 100 / 12
    if r == 0:
        return amount / months
    return amount * r / (1 - (1 + r) ** -months)


def max_amount_for_payment(payment: float, rate_year: float, months: int) -> float:
    """Максимальная сумма кредита, при которой аннуитетный платёж не больше payment."""
    if payment <= 0:
        return 0.0
    r = rate_year / 100 / 12
    if r == 0:
        return payment * months
    return payment * (1 - (1 + r) ** -months) / r
