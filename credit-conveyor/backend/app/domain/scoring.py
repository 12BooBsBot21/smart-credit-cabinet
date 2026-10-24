"""Скоринг: оценка риска заёмщика балльной картой (scorecard).

Скоринг отвечает только на вопрос «насколько рискован заёмщик». Условия кредита
он не определяет — это делает app/domain/decision.py.

Каждый признак добавляет или снимает баллы с базовых 600, сумма даёт грейд A–E.
Веса экспертные и подобраны на синтетике; в банке их калибруют на истории дефолтов.
Чтобы добавить признак: напишите функцию, возвращающую Factor, и добавьте её в FACTORS.
"""

from collections.abc import Callable
from dataclasses import dataclass

MODEL_VERSION = "scorecard-v0.1"
BASE_SCORE = 600
GRADE_THRESHOLDS = (("A", 700), ("B", 650), ("C", 600), ("D", 550))  # ниже 550 — E


@dataclass(frozen=True)
class ScoringInput:
    business_age_months: int
    avg_monthly_revenue: float
    revenue_volatility: float | None  # коэффициент вариации месячной выручки; None — нет выписки
    payment_to_revenue: float  # (текущие платежи + новый платёж) / среднемесячная выручка
    current_overdue_days: int
    max_overdue_days_24m: int
    closed_loans_without_overdue: int
    inquiries_30d: int
    amount_to_annual_revenue: float
    has_tax_debt: bool
    mass_registration: bool  # массовый адрес или руководитель по данным ФНС


@dataclass(frozen=True)
class Factor:
    code: str
    name: str
    value: str  # значение признака в понятном человеку виде
    points: int
    comment: str


@dataclass(frozen=True)
class ScoringResult:
    score: int
    grade: str
    factors: list[Factor]
    model_version: str = MODEL_VERSION


def grade_for(total: int) -> str:
    for grade, threshold in GRADE_THRESHOLDS:
        if total >= threshold:
            return grade
    return "E"


def _mln(value: float) -> str:
    return f"{value / 1_000_000:.2f} млн ₽".replace(".", ",")


def _pct(value: float) -> str:
    return f"{value * 100:.0f}%"


def business_age(x: ScoringInput) -> Factor:
    m = x.business_age_months
    name, value = "Срок работы бизнеса", f"{m // 12} г. {m % 12} мес."
    if m < 12:
        return Factor("F01", name, value, -60, "Бизнесу меньше года — риск выше")
    if m < 36:
        return Factor("F01", name, value, 0, "Бизнес работает 1–3 года")
    return Factor("F01", name, value, 40, "Бизнес работает больше 3 лет")


def revenue_level(x: ScoringInput) -> Factor:
    name, value = "Среднемесячная выручка", _mln(x.avg_monthly_revenue)
    if x.avg_monthly_revenue < 300_000:
        return Factor("F02", name, value, -40, "Небольшая выручка")
    if x.avg_monthly_revenue < 1_000_000:
        return Factor("F02", name, value, 0, "Средняя выручка для малого бизнеса")
    return Factor("F02", name, value, 20, "Выручка больше 1 млн ₽ в месяц")


def revenue_stability(x: ScoringInput) -> Factor:
    name = "Стабильность выручки"
    cv = x.revenue_volatility
    if cv is None:
        return Factor("F03", name, "нет данных", -10, "Нет выписки по счёту в банке — стабильность не подтверждена")
    value = f"коэф. вариации {cv:.2f}"
    if cv < 0.3:
        return Factor("F03", name, value, 20, "Выручка стабильна")
    if cv < 0.7:
        return Factor("F03", name, value, 0, "Умеренные колебания выручки")
    return Factor("F03", name, value, -30, "Сильные колебания выручки: сезонность или нестабильность")


def debt_load(x: ScoringInput) -> Factor:
    name, value = "Платежи по кредитам к выручке", _pct(x.payment_to_revenue)
    if x.payment_to_revenue < 0.10:
        return Factor("F04", name, value, 50, "Низкая долговая нагрузка")
    if x.payment_to_revenue < 0.20:
        return Factor("F04", name, value, 10, "Умеренная долговая нагрузка")
    if x.payment_to_revenue < 0.30:
        return Factor("F04", name, value, -30, "Высокая долговая нагрузка")
    return Factor("F04", name, value, -100, "Очень высокая долговая нагрузка")


def current_overdue(x: ScoringInput) -> Factor:
    name, value = "Текущая просрочка", f"{x.current_overdue_days} дн."
    if x.current_overdue_days == 0:
        return Factor("F05", name, value, 0, "Текущих просрочек нет")
    if x.current_overdue_days <= 30:
        return Factor("F05", name, value, -80, "Есть текущая просрочка")
    return Factor("F05", name, value, -150, "Просрочка больше 30 дней")


def overdue_history(x: ScoringInput) -> Factor:
    name, value = "Максимальная просрочка за 2 года", f"{x.max_overdue_days_24m} дн."
    if x.max_overdue_days_24m == 0:
        return Factor("F06", name, value, 0, "Просрочек за 2 года не было")
    if x.max_overdue_days_24m <= 30:
        return Factor("F06", name, value, -20, "Были короткие просрочки")
    if x.max_overdue_days_24m <= 60:
        return Factor("F06", name, value, -40, "Были просрочки до 60 дней")
    return Factor("F06", name, value, -60, "Были длительные просрочки")


def positive_history(x: ScoringInput) -> Factor:
    name, value = "Погашенные кредиты без просрочек", str(x.closed_loans_without_overdue)
    if x.closed_loans_without_overdue >= 2:
        return Factor("F07", name, value, 30, "Хорошая кредитная история")
    if x.closed_loans_without_overdue == 1:
        return Factor("F07", name, value, 15, "Есть положительная кредитная история")
    return Factor("F07", name, value, 0, "Кредитной истории нет — это не плохо, но банку меньше информации")


def inquiries(x: ScoringInput) -> Factor:
    name, value = "Запросы в бюро за 30 дней", str(x.inquiries_30d)
    if x.inquiries_30d <= 1:
        return Factor("F08", name, value, 0, "Обычное число запросов")
    if x.inquiries_30d <= 3:
        return Factor("F08", name, value, -15, "Несколько запросов в другие банки")
    return Factor("F08", name, value, -40, "Много запросов за месяц — возможен «кредитный голод»")


def amount_to_revenue(x: ScoringInput) -> Factor:
    name, value = "Сумма заявки к годовой выручке", _pct(x.amount_to_annual_revenue)
    if x.amount_to_annual_revenue <= 0.10:
        return Factor("F09", name, value, 20, "Сумма небольшая относительно оборотов")
    if x.amount_to_annual_revenue <= 0.25:
        return Factor("F09", name, value, 0, "Сумма соразмерна оборотам")
    if x.amount_to_annual_revenue <= 0.50:
        return Factor("F09", name, value, -30, "Сумма велика относительно оборотов")
    return Factor("F09", name, value, -60, "Сумма больше половины годовой выручки")


def tax_debt(x: ScoringInput) -> Factor:
    name = "Задолженность по налогам"
    if x.has_tax_debt:
        return Factor("F10", name, "есть", -50, "По данным ФНС есть недоимка")
    return Factor("F10", name, "нет", 0, "Недоимки нет")


def mass_registration(x: ScoringInput) -> Factor:
    name = "Массовый адрес или руководитель"
    if x.mass_registration:
        return Factor("F11", name, "да", -80, "Признак массовой регистрации по данным ФНС")
    return Factor("F11", name, "нет", 0, "Признаков массовой регистрации нет")


FACTORS: list[Callable[[ScoringInput], Factor]] = [
    business_age,
    revenue_level,
    revenue_stability,
    debt_load,
    current_overdue,
    overdue_history,
    positive_history,
    inquiries,
    amount_to_revenue,
    tax_debt,
    mass_registration,
]


def score(x: ScoringInput) -> ScoringResult:
    factors = [factor(x) for factor in FACTORS]
    total = BASE_SCORE + sum(f.points for f in factors)
    return ScoringResult(score=total, grade=grade_for(total), factors=factors)
