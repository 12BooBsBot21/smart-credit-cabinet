"""Демо-персоны: компании, их учётки и ответы «внешних источников».

Из этого файла берут данные и seed (что банк знает о клиенте), и моки ЕГРЮЛ/БКИ/ФНС
(что знают внешние реестры). Поэтому данные везде согласованы.

ИНН и ОГРН вымышленные, но с правильными контрольными суммами; год и регион в ОГРН
совпадают с датой регистрации и регионом компании.
Каждая персона детерминированно приводит к своему исходу — см. поле hint.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Any

DEMO_PASSWORD = "demo"


@dataclass(frozen=True)
class Persona:
    login: str
    full_name: str  # представитель компании, который входит в кабинет
    hint: str  # что демонстрирует персона — показывается на странице входа
    company: dict[str, Any]
    # Поступления на расчётный счёт за 12 последних месяцев, от старых к новым.
    # None — у компании нет счёта в банке
    monthly_inflow: list[int] | None
    egrul_status: str
    address: str
    # Ответ БКИ. None — бюро «не отвечает» (проверка отказоустойчивости)
    bki: dict[str, Any] | None
    fns_pb: dict[str, Any]
    assets: list[dict[str, Any]] = field(default_factory=list)


PERSONAS: list[Persona] = [
    Persona(
        login="bakery",
        full_name="Ковалёв Дмитрий Сергеевич",
        hint="Кредит без залога 2 млн ₽ на 24 мес. → автоматическое одобрение",
        company={
            "inn": "7812045738",
            "ogrn": "1217847005122",
            "name": "ООО «Северная пекарня»",
            "legal_form": "OOO",
            "okved": "10.71",
            "okved_name": "Производство хлеба и мучных кондитерских изделий",
            "region": "Санкт-Петербург",
            "director": "Ковалёв Дмитрий Сергеевич",
            "registered_at": date(2021, 3, 16),
        },
        monthly_inflow=[
            2_310_000, 2_420_000, 2_510_000, 2_380_000, 2_450_000, 2_400_000,
            2_490_000, 2_560_000, 2_420_000, 2_330_000, 2_470_000, 2_600_000,
        ],
        egrul_status="ACTIVE",
        address="г. Санкт-Петербург, ул. Профессора Попова, д. 23",
        bki={
            "current_overdue_days": 0,
            "max_overdue_days_24m": 0,
            "closed_loans_without_overdue": 2,
            "inquiries_30d": 0,
            "active_loans": [],
        },
        fns_pb={"tax_debt": False, "mass_address": False, "mass_director": False, "employees": 34, "tax_regime": "ОСН"},
        assets=[{"name": "Хлебопекарная печь Miwe, 2022", "value": 3_200_000}],
    ),
    Persona(
        login="sokolova",
        full_name="Соколова Мария Андреевна",
        hint="Кредит без залога 2,5 млн ₽ на 12 мес. → иные условия: сезонный бизнес",
        company={
            "inn": "502419837683",
            "ogrn": "323502400198468",
            "name": "ИП Соколова Мария Андреевна",
            "legal_form": "IP",
            "okved": "47.78",
            "okved_name": "Торговля розничная прочая в специализированных магазинах",
            "region": "Московская область",
            "director": "Соколова Мария Андреевна",
            "registered_at": date(2023, 5, 12),
        },
        # Магазин новогоднего декора из прототипа: пик в ноябре–декабре, провал летом
        monthly_inflow=[
            1_000_000, 2_650_000, 4_550_000, 1_850_000, 560_000, 420_000,
            380_000, 340_000, 340_000, 340_000, 420_000, 720_000,
        ],
        egrul_status="ACTIVE",
        address="Московская обл., г. Мытищи, ул. Колпакова, д. 2",
        bki={
            "current_overdue_days": 0,
            "max_overdue_days_24m": 0,
            "closed_loans_without_overdue": 1,
            "inquiries_30d": 1,
            "active_loans": [],
        },
        fns_pb={"tax_debt": False, "mass_address": False, "mass_director": False, "employees": 4, "tax_regime": "УСН"},
        assets=[{"name": "Автомобиль Kia Rio, 2021", "value": 1_200_000}],
    ),
    Persona(
        login="stroy",
        full_name="Гусев Павел Игоревич",
        hint="Кредит без залога 4 млн ₽ на 24 мес., выручка в анкете 50 млн ₽ → запрос уточнений",
        company={
            "inn": "6627350189",
            "ogrn": "1196658019470",
            "name": "ООО «СтройМонтаж»",
            "legal_form": "OOO",
            "okved": "43.29",
            "okved_name": "Производство прочих строительно-монтажных работ",
            "region": "Свердловская область",
            "director": "Гусев Павел Игоревич",
            "registered_at": date(2019, 8, 20),
        },
        monthly_inflow=[
            2_950_000, 3_100_000, 2_880_000, 3_050_000, 2_990_000, 3_120_000,
            2_970_000, 3_040_000, 3_010_000, 2_930_000, 3_080_000, 3_000_000,
        ],
        egrul_status="ACTIVE",
        address="Свердловская обл., г. Екатеринбург, ул. Шефская, д. 3",
        bki={
            "current_overdue_days": 0,
            "max_overdue_days_24m": 12,
            "closed_loans_without_overdue": 1,
            "inquiries_30d": 2,
            "active_loans": [],
        },
        fns_pb={"tax_debt": False, "mass_address": False, "mass_director": False, "employees": 21, "tax_regime": "ОСН"},
    ),
    Persona(
        login="petrov",
        full_name="Петров Алексей Викторович",
        hint="Любой кредит → отказ: просрочка 45 дней по действующему кредиту",
        company={
            "inn": "165893042730",
            "ogrn": "320169000512369",
            "name": "ИП Петров Алексей Викторович",
            "legal_form": "IP",
            "okved": "45.20",
            "okved_name": "Техническое обслуживание и ремонт автотранспортных средств",
            "region": "Республика Татарстан",
            "director": "Петров Алексей Викторович",
            "registered_at": date(2020, 2, 11),
        },
        monthly_inflow=[
            820_000, 860_000, 790_000, 880_000, 840_000, 900_000,
            870_000, 810_000, 850_000, 830_000, 880_000, 860_000,
        ],
        egrul_status="ACTIVE",
        address="Республика Татарстан, г. Казань, ул. Техническая, д. 15",
        bki={
            "current_overdue_days": 45,
            "max_overdue_days_24m": 60,
            "closed_loans_without_overdue": 0,
            "inquiries_30d": 4,
            "active_loans": [{"type": "Кредит на оборудование", "balance": 640_000, "monthly_payment": 38_000}],
        },
        fns_pb={"tax_debt": True, "mass_address": False, "mass_director": False, "employees": 3, "tax_regime": "ПСН"},
    ),
    Persona(
        login="vector",
        full_name="Тарасов Олег Николаевич",
        hint="Кредит под залог склада 8 млн ₽ на 36 мес. → ручная проверка андеррайтером",
        company={
            "inn": "7709583147",
            "ogrn": "1227700547810",
            "name": "ООО «Вектор Логистик»",
            "legal_form": "OOO",
            "okved": "52.10",
            "okved_name": "Деятельность по складированию и хранению",
            "region": "Москва",
            "director": "Тарасов Олег Николаевич",
            "registered_at": date(2022, 3, 1),
        },
        monthly_inflow=[
            6_100_000, 6_350_000, 5_980_000, 6_220_000, 6_400_000, 6_050_000,
            6_180_000, 6_300_000, 6_120_000, 6_260_000, 6_090_000, 6_330_000,
        ],
        egrul_status="ACTIVE",
        address="г. Москва, ул. Земляной Вал, д. 9",
        bki={
            "current_overdue_days": 0,
            "max_overdue_days_24m": 0,
            "closed_loans_without_overdue": 1,
            "inquiries_30d": 1,
            "active_loans": [{"type": "Лизинг грузовиков", "balance": 2_400_000, "monthly_payment": 180_000}],
        },
        # Адрес из ЕГРЮЛ указан у многих компаний — признак массовой регистрации
        fns_pb={"tax_debt": False, "mass_address": True, "mass_director": False, "employees": 48, "tax_regime": "ОСН"},
        assets=[{"name": "Складское помещение 1 200 м², г. Подольск", "value": 12_000_000}],
    ),
    Persona(
        login="techno",
        full_name="Ли Анна Викторовна",
        hint="Новый клиент: кредит без залога 1,5 млн ₽ без выручки в анкете → запрос уточнений; БКИ не отвечает → ручная проверка",
        company={
            "inn": "5406129879",
            "ogrn": "1245400177395",
            "name": "ООО «ТехноСтарт»",
            "legal_form": "OOO",
            "okved": "62.01",
            "okved_name": "Разработка компьютерного программного обеспечения",
            "region": "Новосибирская область",
            "director": "Ли Анна Викторовна",
            "registered_at": date(2024, 1, 22),
        },
        monthly_inflow=None,
        egrul_status="ACTIVE",
        address="Новосибирская обл., г. Новосибирск, ул. Инженерная, д. 20",
        bki=None,
        fns_pb={"tax_debt": False, "mass_address": False, "mass_director": False, "employees": 9, "tax_regime": "УСН"},
    ),
]

UNDERWRITER = {"login": "underwriter", "full_name": "Андреева Ирина Павловна"}


def find_by_inn(inn: str) -> Persona | None:
    return next((p for p in PERSONAS if p.company["inn"] == inn), None)
