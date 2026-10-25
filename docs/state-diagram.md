# Диаграмма состояний заявки

Сгенерирована из `backend/app/domain/statuses.py` командой `python -m app.domain.statuses` — при изменении переходов перегенерируйте.

Подпись на стрелке — кто выполняет переход: клиент, система или андеррайтер.

```mermaid
stateDiagram-v2
    state "Черновик" as DRAFT
    state "Отправлена" as SUBMITTED
    state "Проверка полноты" as VALIDATION
    state "Нужны уточнения" as NEEDS_INFO
    state "Сбор данных из источников" as ENRICHMENT
    state "Скоринг" as SCORING
    state "Кредитное решение" as DECISION
    state "Ручная проверка" as MANUAL_REVIEW
    state "Одобрено" as APPROVED
    state "Одобрено на иных условиях" as COUNTER_OFFER
    state "Отказ" as REJECTED
    state "Подписание документов" as SIGNING
    state "Финансирование выдано" as ISSUED
    state "Отозвана клиентом" as WITHDRAWN
    state "Клиент отклонил условия" as OFFER_DECLINED
    [*] --> DRAFT
    DRAFT --> SUBMITTED : клиент
    DRAFT --> WITHDRAWN : клиент
    SUBMITTED --> VALIDATION : система
    VALIDATION --> NEEDS_INFO : система
    VALIDATION --> ENRICHMENT : система
    NEEDS_INFO --> VALIDATION : клиент
    NEEDS_INFO --> WITHDRAWN : клиент
    ENRICHMENT --> SCORING : система
    ENRICHMENT --> MANUAL_REVIEW : система
    SCORING --> DECISION : система
    DECISION --> APPROVED : система
    DECISION --> COUNTER_OFFER : система
    DECISION --> NEEDS_INFO : система
    DECISION --> REJECTED : система
    DECISION --> MANUAL_REVIEW : система
    MANUAL_REVIEW --> APPROVED : андеррайтер
    MANUAL_REVIEW --> COUNTER_OFFER : андеррайтер
    MANUAL_REVIEW --> NEEDS_INFO : андеррайтер
    MANUAL_REVIEW --> REJECTED : андеррайтер
    APPROVED --> SIGNING : клиент
    APPROVED --> OFFER_DECLINED : клиент
    COUNTER_OFFER --> SIGNING : клиент
    COUNTER_OFFER --> OFFER_DECLINED : клиент
    SIGNING --> ISSUED : клиент
    VALIDATION --> MANUAL_REVIEW : система
    SUBMITTED --> MANUAL_REVIEW : система
    SCORING --> MANUAL_REVIEW : система
    REJECTED --> [*]
    ISSUED --> [*]
    WITHDRAWN --> [*]
    OFFER_DECLINED --> [*]
```

| Исход из кейса (стр. 15) | Статус |
|---|---|
| Одобрение | `APPROVED` |
| Одобрение на иных условиях | `COUNTER_OFFER` |
| Запрос дополнительной информации | `NEEDS_INFO` |
| Отказ | `REJECTED` |
