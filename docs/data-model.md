# Модель данных

Источник правды — `backend/app/models.py`, миграции — `backend/alembic/versions`. Здесь — ключевые поля и связи.

```mermaid
erDiagram
    COMPANY ||--o{ ACCOUNT_TURNOVER : "обороты по счёту"
    COMPANY |o--o{ USERS : "сотрудники клиента"
    COMPANY ||--o{ APPLICATION : "подаёт"
    PRODUCT ||--o{ APPLICATION : "запрошенный продукт"
    USERS ||--o{ APPLICATION : "создал"
    APPLICATION ||--o{ EXTERNAL_CHECK : "ответы источников"
    APPLICATION ||--o{ SCORE_RESULT : "скоринг"
    APPLICATION ||--o{ DECISION : "решения"
    APPLICATION ||--o{ OFFER : "предложения"
    DECISION ||--o{ OFFER : "варианты условий"
    APPLICATION ||--o{ INFO_REQUEST : "запросы уточнений"
    APPLICATION ||--o{ APPLICATION_EVENT : "журнал"
    APPLICATION ||--o{ JOB : "шаги конвейера"
    USERS |o--o{ DECISION : "андеррайтер"
    USERS |o--o{ APPLICATION_EVENT : "автор"

    COMPANY {
        int id PK
        string inn UK "ИНН"
        string ogrn "ОГРН или ОГРНИП"
        string legal_form "OOO или IP"
        string okved
        date registered_at
        bool is_bank_client "есть расчётный счёт"
        json assets "имущество, известное банку"
    }
    ACCOUNT_TURNOVER {
        int company_id FK
        string month "YYYY-MM"
        int inflow
        int outflow
    }
    USERS {
        int id PK
        string login UK
        string role "CLIENT или UNDERWRITER"
        int company_id FK "пусто у сотрудника банка"
    }
    PRODUCT {
        string code PK
        int amount_min
        int amount_max
        float base_rate
        json rules "мин. грейд, доля выручки на платёж, залог"
    }
    APPLICATION {
        int id PK
        string number UK "КР-000001"
        string status "см. state-diagram.md"
        int amount
        int term_months
        int declared_revenue_12m
        string collateral_description
        bool revenue_confirmed_by_client
        string sign_code "мок простой ЭП"
        int version "оптимистичная блокировка"
    }
    EXTERNAL_CHECK {
        string source "EGRUL, BKI, FNS_PB"
        string status "OK или ERROR"
        int attempts
        json response "снимок ответа"
    }
    SCORE_RESULT {
        int score
        string grade "A-E"
        json factors "признак, значение, баллы"
        string model_version
    }
    DECISION {
        string outcome
        string decided_by "SYSTEM или UNDERWRITER"
        json reasons "коды причин и тексты"
        json recommendation "для ручной проверки"
        string rules_version
    }
    OFFER {
        int amount
        int term_months
        float rate
        int monthly_payment
        string status "PROPOSED, ACCEPTED, DECLINED, WITHDRAWN"
    }
    INFO_REQUEST {
        json items "REVENUE, COLLATERAL, REVENUE_CONFIRM, OTHER"
        string status "OPEN или ANSWERED"
    }
    APPLICATION_EVENT {
        string actor "CLIENT, SYSTEM, UNDERWRITER"
        string from_status
        string to_status
        string message
        bool visible_to_client
    }
    JOB {
        string step "validate, enrich, score, decide"
        string status "PENDING, RUNNING, DONE, FAILED"
        int attempts
        datetime run_after
    }
```

## Почему так

| Решение | Зачем |
|---|---|
| `APPLICATION_EVENT` — и аудит, и лента клиента | Одна таблица: клиент видит события с `visible_to_client`, банк — все |
| Снимки ответов в `EXTERNAL_CHECK`, версии в `SCORE_RESULT` и `DECISION` | Любое решение можно воспроизвести и объяснить |
| `JOB` — очередь в той же БД | Не нужны Redis и Kafka; воркеров можно запустить несколько (`SKIP LOCKED`) |
| `version` в `APPLICATION` | Два участника не перезапишут изменения друг друга — второй получит 409 |
| Деньги — целые рубли | Упрощение прототипа; в проде — копейки или Decimal |
