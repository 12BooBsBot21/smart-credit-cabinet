"""Конечный автомат заявки: статусы, разрешённые переходы и действия ролей.

Единственный источник правды о статусах. Фронтенд статусы не вычисляет: API отдаёт
`available_actions`, а интерфейс рисует кнопки по этому списку.

Диаграмма для документации: `python -m app.domain.statuses` печатает её в формате Mermaid.
"""

from enum import StrEnum

from app.errors import Conflict


class Status(StrEnum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    VALIDATION = "VALIDATION"
    NEEDS_INFO = "NEEDS_INFO"
    ENRICHMENT = "ENRICHMENT"
    SCORING = "SCORING"
    DECISION = "DECISION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    APPROVED = "APPROVED"
    COUNTER_OFFER = "COUNTER_OFFER"
    REJECTED = "REJECTED"
    SIGNING = "SIGNING"
    ISSUED = "ISSUED"
    WITHDRAWN = "WITHDRAWN"
    OFFER_DECLINED = "OFFER_DECLINED"


LABELS: dict[Status, str] = {
    Status.DRAFT: "Черновик",
    Status.SUBMITTED: "Отправлена",
    Status.VALIDATION: "Проверка полноты",
    Status.NEEDS_INFO: "Нужны уточнения",
    Status.ENRICHMENT: "Сбор данных из источников",
    Status.SCORING: "Скоринг",
    Status.DECISION: "Кредитное решение",
    Status.MANUAL_REVIEW: "Ручная проверка",
    Status.APPROVED: "Одобрено",
    Status.COUNTER_OFFER: "Одобрено на иных условиях",
    Status.REJECTED: "Отказ",
    Status.SIGNING: "Подписание документов",
    Status.ISSUED: "Финансирование выдано",
    Status.WITHDRAWN: "Отозвана клиентом",
    Status.OFFER_DECLINED: "Клиент отклонил условия",
}


class Actor(StrEnum):
    CLIENT = "CLIENT"
    SYSTEM = "SYSTEM"
    UNDERWRITER = "UNDERWRITER"


class Action(StrEnum):
    SUBMIT = "SUBMIT"
    WITHDRAW = "WITHDRAW"
    ANSWER_INFO = "ANSWER_INFO"
    ACCEPT_OFFER = "ACCEPT_OFFER"
    DECLINE_OFFER = "DECLINE_OFFER"
    SIGN = "SIGN"
    DECIDE = "DECIDE"


S, A = Status, Actor

# (откуда, куда) → кто может выполнить переход
TRANSITIONS: dict[tuple[Status, Status], Actor] = {
    (S.DRAFT, S.SUBMITTED): A.CLIENT,
    (S.DRAFT, S.WITHDRAWN): A.CLIENT,
    (S.SUBMITTED, S.VALIDATION): A.SYSTEM,
    (S.VALIDATION, S.NEEDS_INFO): A.SYSTEM,
    (S.VALIDATION, S.ENRICHMENT): A.SYSTEM,
    (S.NEEDS_INFO, S.VALIDATION): A.CLIENT,
    (S.NEEDS_INFO, S.WITHDRAWN): A.CLIENT,
    (S.ENRICHMENT, S.SCORING): A.SYSTEM,
    (S.ENRICHMENT, S.MANUAL_REVIEW): A.SYSTEM,
    (S.SCORING, S.DECISION): A.SYSTEM,
    (S.DECISION, S.APPROVED): A.SYSTEM,
    (S.DECISION, S.COUNTER_OFFER): A.SYSTEM,
    (S.DECISION, S.NEEDS_INFO): A.SYSTEM,
    (S.DECISION, S.REJECTED): A.SYSTEM,
    (S.DECISION, S.MANUAL_REVIEW): A.SYSTEM,
    (S.MANUAL_REVIEW, S.APPROVED): A.UNDERWRITER,
    (S.MANUAL_REVIEW, S.COUNTER_OFFER): A.UNDERWRITER,
    (S.MANUAL_REVIEW, S.NEEDS_INFO): A.UNDERWRITER,
    (S.MANUAL_REVIEW, S.REJECTED): A.UNDERWRITER,
    (S.APPROVED, S.SIGNING): A.CLIENT,
    (S.APPROVED, S.OFFER_DECLINED): A.CLIENT,
    (S.COUNTER_OFFER, S.SIGNING): A.CLIENT,
    (S.COUNTER_OFFER, S.OFFER_DECLINED): A.CLIENT,
    (S.SIGNING, S.ISSUED): A.CLIENT,
}

# Пока заявка в этих статусах, её обрабатывает система, а клиент ждёт
IN_PROGRESS: frozenset[Status] = frozenset({S.SUBMITTED, S.VALIDATION, S.ENRICHMENT, S.SCORING, S.DECISION})
FINAL: frozenset[Status] = frozenset({S.ISSUED, S.REJECTED, S.WITHDRAWN, S.OFFER_DECLINED})

# Техническая ошибка на любом шаге конвейера → заявку разбирает человек
for _status in IN_PROGRESS:
    TRANSITIONS.setdefault((_status, S.MANUAL_REVIEW), A.SYSTEM)

ACTIONS: dict[Actor, dict[Status, tuple[Action, ...]]] = {
    A.CLIENT: {
        S.DRAFT: (Action.SUBMIT, Action.WITHDRAW),
        S.NEEDS_INFO: (Action.ANSWER_INFO, Action.WITHDRAW),
        S.APPROVED: (Action.ACCEPT_OFFER, Action.DECLINE_OFFER),
        S.COUNTER_OFFER: (Action.ACCEPT_OFFER, Action.DECLINE_OFFER),
        S.SIGNING: (Action.SIGN,),
    },
    A.UNDERWRITER: {
        S.MANUAL_REVIEW: (Action.DECIDE,),
    },
}


class TransitionError(Conflict):
    pass


def can_transition(src: Status, dst: Status, actor: Actor) -> bool:
    return TRANSITIONS.get((src, dst)) == actor


def ensure_transition(src: Status, dst: Status, actor: Actor) -> None:
    if not can_transition(src, dst, actor):
        raise TransitionError(f"Переход «{LABELS[src]}» → «{LABELS[dst]}» недоступен ({actor})")


def available_actions(status: Status, actor: Actor) -> list[Action]:
    return list(ACTIONS.get(actor, {}).get(status, ()))


def to_mermaid() -> str:
    """Диаграмма состояний из TRANSITIONS — документация всегда совпадает с кодом."""
    who = {A.CLIENT: "клиент", A.SYSTEM: "система", A.UNDERWRITER: "андеррайтер"}
    lines = ["stateDiagram-v2"]
    lines += [f'    state "{LABELS[s]}" as {s}' for s in Status]
    lines.append(f"    [*] --> {S.DRAFT}")
    lines += [f"    {src} --> {dst} : {who[actor]}" for (src, dst), actor in TRANSITIONS.items()]
    lines += [f"    {s} --> [*]" for s in Status if s in FINAL]
    return "\n".join(lines)


if __name__ == "__main__":
    print(to_mermaid())
