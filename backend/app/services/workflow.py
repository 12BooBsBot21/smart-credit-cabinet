"""Базовые операции над заявкой: смена статуса с записью в журнал, задания конвейера, решения.

Статус заявки меняется только через change_status — так каждый переход
проверяется по конечному автомату и попадает в журнал.
"""

import logging
from dataclasses import asdict
from typing import Any

from sqlalchemy.orm import Session

from app.domain.decision import RULES_VERSION, DecisionResult
from app.domain.statuses import LABELS, Action, Actor, Status, available_actions, ensure_transition
from app.errors import Conflict
from app.models import Application, ApplicationEvent, Decision, InfoRequest, Job, Offer, User

log = logging.getLogger(__name__)

# Что видит клиент, когда система или андеррайтер принимают решение
DECISION_MESSAGES = {
    Status.APPROVED: "Кредит одобрен. Ознакомьтесь с условиями и примите предложение",
    Status.COUNTER_OFFER: "Банк готов выдать кредит на других условиях — выберите подходящий вариант",
    Status.NEEDS_INFO: "Нужны уточнения — ответьте на запрос банка",
    Status.REJECTED: "К сожалению, банк не может выдать кредит",
    Status.MANUAL_REVIEW: "Заявку проверяет специалист банка",
}


def add_event(
    session: Session,
    application: Application,
    *,
    actor: Actor,
    message: str,
    event_type: str = "NOTE",
    user: User | None = None,
    visible_to_client: bool = True,
    payload: dict[str, Any] | None = None,
    from_status: Status | None = None,
    to_status: Status | None = None,
) -> None:
    session.add(
        ApplicationEvent(
            application_id=application.id,
            actor=actor,
            actor_user_id=user.id if user else None,
            event_type=event_type,
            from_status=from_status,
            to_status=to_status,
            message=message,
            visible_to_client=visible_to_client,
            payload=payload or {},
        )
    )


def change_status(
    session: Session,
    application: Application,
    to: Status,
    *,
    actor: Actor,
    message: str,
    user: User | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    src = Status(application.status)
    ensure_transition(src, to, actor)
    application.status = to
    add_event(
        session,
        application,
        actor=actor,
        user=user,
        message=message,
        event_type="STATUS_CHANGED",
        from_status=src,
        to_status=to,
        payload=payload,
    )
    log.info("Статус: %s → %s", LABELS[src], LABELS[to], extra={"application_id": application.id})


def require_action(application: Application, actor: Actor, action: Action) -> None:
    if action not in available_actions(Status(application.status), actor):
        raise Conflict(f"Действие недоступно, пока заявка в статусе «{LABELS[Status(application.status)]}»")


def enqueue(session: Session, application: Application, step: str) -> None:
    """Поставить шаг конвейера в очередь — его выполнит воркер (app/worker.py)."""
    session.add(Job(application_id=application.id, step=step))


def apply_decision(
    session: Session,
    application: Application,
    result: DecisionResult,
    *,
    actor: Actor,
    user: User | None = None,
    comment: str | None = None,
) -> Decision:
    """Сохранить решение, предложения и запрос информации, перевести заявку в статус исхода."""
    for offer in application.offers:
        if offer.status == "PROPOSED":
            offer.status = "WITHDRAWN"  # прежние предложения больше не действуют

    decision = Decision(
        application_id=application.id,
        outcome=result.outcome,
        decided_by=actor,
        user_id=user.id if user else None,
        reasons=[asdict(r) for r in result.reasons],
        recommendation=asdict(result.recommendation) if result.recommendation else None,
        rules_version=RULES_VERSION,
        comment=comment,
    )
    session.add(decision)
    session.flush()  # нужен decision.id для предложений

    for draft in result.offers:
        session.add(Offer(application_id=application.id, decision_id=decision.id, status="PROPOSED", **asdict(draft)))
    if result.info_items:
        session.add(
            InfoRequest(
                application_id=application.id,
                requested_by=actor,
                items=[asdict(item) for item in result.info_items],
            )
        )

    change_status(
        session,
        application,
        result.outcome,
        actor=actor,
        user=user,
        message=DECISION_MESSAGES[result.outcome],
        payload={"reasons": [r.code for r in result.reasons]},
    )
    return decision
