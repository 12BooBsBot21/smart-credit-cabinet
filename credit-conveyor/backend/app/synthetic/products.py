"""Каталог кредитных продуктов. Тексты — из прототипа, условия демонстрационные.

rules — параметры кредитной политики продукта (их читает app/domain/decision.py):
- min_grade — худший грейд, при котором продукт доступен;
- payment_share — какую долю среднемесячной выручки может занимать платёж, по грейдам;
- collateral_required — нужен ли залог;
- min_business_age_months — минимальный срок работы бизнеса;
- requires_bank_account — только для клиентов с расчётным счётом в банке.
"""

PRODUCTS = [
    {
        "code": "working-capital",
        "name": "Кредит на любые цели без залога",
        "plain_name": "Разовая сумма на нужды бизнеса без залога и поручителей. Гасите равными платежами каждый месяц.",
        "amount_min": 100_000,
        "amount_max": 5_000_000,
        "term_min": 6,
        "term_max": 36,
        "base_rate": 23.9,
        "sort_order": 1,
        "rules": {
            "min_grade": "C",
            "payment_share": {"A": 0.25, "B": 0.2, "C": 0.15},
            "collateral_required": False,
            "min_business_age_months": 6,
            "requires_bank_account": False,
        },
    },
    {
        "code": "credit-line",
        "name": "Возобновляемая кредитная линия",
        "plain_name": "Банк открывает лимит: берёте деньги частями, когда нужно, гасите после продаж — и снова можете взять.",
        "amount_min": 300_000,
        "amount_max": 10_000_000,
        "term_min": 6,
        "term_max": 36,
        "base_rate": 18.5,
        "sort_order": 2,
        "rules": {
            "min_grade": "B",
            "payment_share": {"A": 0.3, "B": 0.25},
            "collateral_required": False,
            "min_business_age_months": 12,
            "requires_bank_account": True,
        },
    },
    {
        "code": "secured-loan",
        "name": "Кредит под залог",
        "plain_name": "Крупная сумма под меньший процент, если оставить банку в залог автомобиль, оборудование или недвижимость.",
        "amount_min": 500_000,
        "amount_max": 30_000_000,
        "term_min": 12,
        "term_max": 84,
        "base_rate": 16.5,
        "sort_order": 3,
        "rules": {
            "min_grade": "D",
            "payment_share": {"A": 0.35, "B": 0.3, "C": 0.25, "D": 0.2},
            "collateral_required": True,
            "min_business_age_months": 12,
            "requires_bank_account": False,
        },
    },
]
