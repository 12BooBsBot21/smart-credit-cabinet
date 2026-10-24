"""Кредитное решение: правила поверх скоринга, параметров продукта и результатов проверок.

Порядок правил:
1. Стоп-факторы → отказ.
2. Заявленная выручка расходится с оборотами → запрос информации.
3. Автоматическое решение по продукту → одобрение, иные условия или отказ.
4. Серая зона → ручная проверка; автоматическое решение становится рекомендацией андеррайтеру.

Один и тот же грейд даёт разные условия для разных продуктов: у каждого продукта
своя допустимая доля выручки на платёж, минимальный грейд и требования к залогу.
"""

from dataclasses import dataclass, field

from app.domain.finance import annuity_payment, max_amount_for_payment
from app.domain.statuses import Status

RULES_VERSION = "rules-v0.1"

AUTO_APPROVAL_LIMIT = 5_000_000  # выше — решает человек
REVENUE_MISMATCH_LIMIT = 0.30  # допустимое расхождение заявленной выручки и оборотов по счёту
LOAN_TO_VALUE = 0.7  # кредит под залог — не больше 70% стоимости залога
STOP_OVERDUE_DAYS = 30
GRADES = "ABCDE"
GRADE_RATE_MARKUP = {"A": 0.0, "B": 1.0, "C": 2.5, "D": 4.0, "E": 6.0}
TERM_STEP_MONTHS = 6
AMOUNT_STEP = 50_000


@dataclass(frozen=True)
class ProductTerms:
    code: str
    name: str
    amount_min: int
    amount_max: int
    term_min: int
    term_max: int
    base_rate: float
    min_grade: str
    # Какую долю среднемесячной выручки может занимать платёж — по грейдам
    payment_share: dict[str, float]
    collateral_required: bool = False
    min_business_age_months: int = 0
    requires_bank_account: bool = False


@dataclass(frozen=True)
class DecisionInput:
    product: ProductTerms
    other_products: list[ProductTerms]
    amount: int
    term_months: int
    collateral_value: int | None
    grade: str
    score: int
    company_status: str  # из ЕГРЮЛ: ACTIVE, LIQUIDATING, …
    is_bank_client: bool
    business_age_months: int
    current_overdue_days: int
    avg_monthly_revenue: float
    current_monthly_payments: float
    revenue_mismatch: float | None
    revenue_confirmed_by_client: bool
    mass_registration: bool
    # Имущество, о котором банк знает сам, — его можно предложить в залог
    known_asset_name: str | None = None
    known_asset_value: int | None = None


@dataclass(frozen=True)
class Reason:
    code: str
    client_text: str  # можно показать клиенту
    bank_text: str  # подробности для андеррайтера


@dataclass(frozen=True)
class OfferDraft:
    product_code: str
    amount: int
    term_months: int
    rate: float
    monthly_payment: int
    collateral: str | None = None


@dataclass(frozen=True)
class InfoItem:
    code: str  # REVENUE | COLLATERAL | REVENUE_CONFIRM | OTHER
    text: str


@dataclass(frozen=True)
class DecisionResult:
    outcome: Status
    reasons: list[Reason]
    offers: list[OfferDraft] = field(default_factory=list)
    info_items: list[InfoItem] = field(default_factory=list)
    # Только для ручной проверки: что система решила бы сама
    recommendation: "DecisionResult | None" = None


def decide(x: DecisionInput) -> DecisionResult:
    stop = stop_factors(x)
    if stop:
        return DecisionResult(Status.REJECTED, stop)

    if needs_revenue_confirmation(x):
        mismatch = _pct(x.revenue_mismatch or 0)
        return DecisionResult(
            Status.NEEDS_INFO,
            [Reason("R50", "Нужно уточнить выручку", f"Заявленная выручка расходится с оборотами по счёту на {mismatch}")],
            info_items=[
                InfoItem(
                    "REVENUE_CONFIRM",
                    "Выручка в анкете заметно отличается от оборотов по вашему счёту в банке. "
                    "Исправьте сумму или поясните расхождение — например, часть выручки идёт через другой банк.",
                )
            ],
        )

    auto = automatic_decision(x)
    gray = gray_zone(x)
    if gray:
        return DecisionResult(Status.MANUAL_REVIEW, gray, recommendation=auto)
    return auto


def stop_factors(x: DecisionInput) -> list[Reason]:
    reasons = []
    if x.company_status != "ACTIVE":
        reasons.append(
            Reason(
                "R10",
                "По данным ЕГРЮЛ компания не может получить кредит в текущем статусе",
                f"ЕГРЮЛ: статус {x.company_status}",
            )
        )
    if x.current_overdue_days > STOP_OVERDUE_DAYS:
        reasons.append(
            Reason(
                "R11",
                "Есть просроченная задолженность по действующим кредитам",
                f"БКИ: текущая просрочка {x.current_overdue_days} дн. (стоп-фактор — больше {STOP_OVERDUE_DAYS})",
            )
        )
    if x.grade == "E":
        reasons.append(
            Reason("R12", "Финансовые показатели пока не позволяют выдать кредит", f"Грейд E, балл {x.score}")
        )
    return reasons


def needs_revenue_confirmation(x: DecisionInput) -> bool:
    return (
        x.revenue_mismatch is not None
        and x.revenue_mismatch > REVENUE_MISMATCH_LIMIT
        and not x.revenue_confirmed_by_client
    )


def gray_zone(x: DecisionInput) -> list[Reason]:
    reasons = []
    if x.amount > AUTO_APPROVAL_LIMIT:
        reasons.append(
            Reason(
                "R20",
                "Сумма больше лимита автоматического решения — заявку проверит специалист банка",
                f"Сумма {rub(x.amount)} выше порога автоодобрения {rub(AUTO_APPROVAL_LIMIT)}",
            )
        )
    if x.mass_registration:
        reasons.append(
            Reason(
                "R21",
                "Нужна дополнительная проверка сведений о компании",
                "ФНС «Прозрачный бизнес»: массовый адрес или руководитель",
            )
        )
    if x.grade == "D":
        reasons.append(
            Reason("R22", "Нужна дополнительная проверка финансовых показателей", f"Пограничный грейд D, балл {x.score}")
        )
    if x.revenue_mismatch is not None and x.revenue_mismatch > REVENUE_MISMATCH_LIMIT and x.revenue_confirmed_by_client:
        reasons.append(
            Reason(
                "R23",
                "Специалист банка проверит подтверждение выручки",
                f"Клиент подтвердил выручку, расхождение с оборотами {_pct(x.revenue_mismatch)}",
            )
        )
    return reasons


def automatic_decision(x: DecisionInput) -> DecisionResult:
    blockers = eligibility(x.product, x)
    if blockers:
        alternative = alternative_offer(x)
        if alternative:
            reason = Reason(
                "R42",
                "Банк готов предложить другой продукт",
                f"Альтернатива: {alternative.product_code} на {rub(alternative.amount)}",
            )
            return DecisionResult(Status.COUNTER_OFFER, [*blockers, reason], offers=[alternative])
        return DecisionResult(Status.REJECTED, blockers)

    limit = credit_limit(x.product, x.term_months, x.grade, x, x.collateral_value)
    if x.amount <= limit:
        reason = Reason(
            "R01",
            "Финансовые показатели и кредитная история позволяют выдать кредит на запрошенных условиях",
            f"Грейд {x.grade}, лимит {rub(limit)} не меньше запрошенных {rub(x.amount)}",
        )
        return DecisionResult(Status.APPROVED, [reason], offers=[build_offer(x.product, x.amount, x.term_months, x.grade)])

    offers = counter_offers(x, limit)
    if offers:
        reason = Reason(
            "R41",
            "Платёж на запрошенных условиях занял бы слишком большую долю выручки. Банк готов выдать кредит на других условиях",
            f"Грейд {x.grade}, лимит на {x.term_months} мес. — {rub(limit)}, запрошено {rub(x.amount)}",
        )
        return DecisionResult(Status.COUNTER_OFFER, [reason], offers=offers)

    reason = Reason(
        "R40",
        "Платёж по кредиту занял бы слишком большую долю выручки бизнеса",
        f"Грейд {x.grade}, допустимый лимит {rub(limit)} меньше минимальной суммы продукта",
    )
    return DecisionResult(Status.REJECTED, [reason])


def eligibility(product: ProductTerms, x: DecisionInput) -> list[Reason]:
    """Требования продукта к заёмщику. Пустой список — продукт доступен."""
    reasons = []
    if x.business_age_months < product.min_business_age_months:
        reasons.append(
            Reason(
                "R30",
                f"Продукт доступен бизнесу старше {product.min_business_age_months} мес.",
                f"Срок бизнеса {x.business_age_months} мес. < {product.min_business_age_months}",
            )
        )
    if product.requires_bank_account and not x.is_bank_client:
        reasons.append(
            Reason("R31", "Продукт доступен клиентам с расчётным счётом в банке", "Нет расчётного счёта в банке")
        )
    if GRADES.index(x.grade) > GRADES.index(product.min_grade):
        reasons.append(
            Reason(
                "R32",
                "Для этого продукта нужна более устойчивая финансовая картина",
                f"Грейд {x.grade} ниже минимального {product.min_grade} для «{product.name}»",
            )
        )
    return reasons


def rate_for(product: ProductTerms, grade: str) -> float:
    return round(product.base_rate + GRADE_RATE_MARKUP[grade], 2)


def credit_limit(product: ProductTerms, term: int, grade: str, x: DecisionInput, collateral_value: int | None) -> int:
    """Максимальная сумма: платёж укладывается в долю выручки, а под залог — ещё и в LTV."""
    share = product.payment_share.get(grade, 0.0)
    max_payment = share * x.avg_monthly_revenue - x.current_monthly_payments
    limit = min(float(product.amount_max), max_amount_for_payment(max_payment, rate_for(product, grade), term))
    if product.collateral_required:
        limit = min(limit, LOAN_TO_VALUE * (collateral_value or 0))
    return int(limit // AMOUNT_STEP * AMOUNT_STEP)


def build_offer(product: ProductTerms, amount: int, term: int, grade: str, collateral: str | None = None) -> OfferDraft:
    rate = rate_for(product, grade)
    payment = round(annuity_payment(amount, rate, term))
    return OfferDraft(product.code, int(amount), term, rate, payment, collateral)


def counter_offers(x: DecisionInput, limit: int) -> list[OfferDraft]:
    offers = []
    # Вариант 1: та же сумма, но на больший срок — платёж меньше
    for term in _longer_terms(x.term_months, x.product.term_max):
        if credit_limit(x.product, term, x.grade, x, x.collateral_value) >= x.amount:
            offers.append(build_offer(x.product, x.amount, term, x.grade))
            break
    # Вариант 2: тот же срок, но меньшая сумма
    if limit >= x.product.amount_min:
        offers.append(build_offer(x.product, limit, x.term_months, x.grade))
    return offers


def alternative_offer(x: DecisionInput) -> OfferDraft | None:
    """Другой продукт, который клиенту доступен. Залогом может стать имущество, известное банку."""
    for product in x.other_products:
        if eligibility(product, x):
            continue
        collateral_value = x.known_asset_value if product.collateral_required else None
        if product.collateral_required and not collateral_value:
            continue
        term = min(max(x.term_months, product.term_min), product.term_max)
        amount = min(x.amount, credit_limit(product, term, x.grade, x, collateral_value))
        if amount >= product.amount_min:
            collateral = x.known_asset_name if product.collateral_required else None
            return build_offer(product, amount, term, x.grade, collateral)
    return None


def _longer_terms(term: int, term_max: int) -> list[int]:
    terms = list(range(term + TERM_STEP_MONTHS, term_max + 1, TERM_STEP_MONTHS))
    if term < term_max and term_max not in terms:
        terms.append(term_max)
    return terms


def rub(value: float) -> str:
    return f"{int(value):,} ₽".replace(",", " ")


def _pct(value: float) -> str:
    return f"{value * 100:.0f}%"
