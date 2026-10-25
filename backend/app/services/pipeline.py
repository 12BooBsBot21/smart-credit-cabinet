"""Шаги конвейера: проверка полноты → обогащение → скоринг → решение.

Каждый шаг — отдельное задание в таблице jobs; шаг сам ставит в очередь следующий.
Шаги можно безопасно повторить: если воркер упал посреди шага, задание выполнится
снова и продолжит с того же статуса.
"""

import logging
import time
from collections.abc import Callable
from dataclasses import asdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.domain import decision, scoring
from app.domain.decision import RULES_VERSION, InfoItem, Reason
from app.domain.statuses import IN_PROGRESS, Actor, Status
from app.models import Application, Decision, ExternalCheck, InfoRequest, Job, Product, ScoreResult
from app.services import assessment, integrations
from app.services.workflow import add_event, apply_decision, change_status, enqueue

log = logging.getLogger(__name__)


def run_step(session: Session, job: Job) -> None:
    application = session.get(Application, job.application_id)
    STEPS[job.step](session, application)


def _enter(session: Session, application: Application, src: Status, dst: Status, message: str) -> bool:
    """Перевести заявку в статус шага и показать его клиенту.

    Возвращает False, если заявка уже не на этом шаге — значит, задание устарело.
    """
    if application.status == src:
        change_status(session, application, dst, actor=Actor.SYSTEM, message=message)
        session.commit()  # фиксируем сразу, чтобы клиент увидел новый статус
        if settings.pipeline_step_delay_sec > 0:
            time.sleep(settings.pipeline_step_delay_sec)
        return True
    return application.status == dst


def completeness_items(application: Application) -> list[InfoItem]:
    items = []
    if application.product.rules.get("collateral_required") and not (
        application.collateral_description and application.collateral_value
    ):
        items.append(InfoItem("COLLATERAL", "Опишите залог и укажите его примерную стоимость"))
    if not application.company.is_bank_client and not application.declared_revenue_12m:
        items.append(
            InfoItem(
                "REVENUE",
                "Укажите выручку компании за последние 12 месяцев — у банка нет выписки по вашему счёту",
            )
        )
    return items


def step_validate(session: Session, application: Application) -> None:
    if not _enter(session, application, Status.SUBMITTED, Status.VALIDATION, "Проверяем полноту и корректность данных"):
        return
    items = completeness_items(application)
    if items:
        session.add(
            InfoRequest(application_id=application.id, requested_by=Actor.SYSTEM, items=[asdict(i) for i in items])
        )
        change_status(
            session,
            application,
            Status.NEEDS_INFO,
            actor=Actor.SYSTEM,
            message="Не хватает данных: " + "; ".join(i.text for i in items),
        )
        return
    enqueue(session, application, "enrich")


def step_enrich(session: Session, application: Application) -> None:
    if not _enter(
        session,
        application,
        Status.VALIDATION,
        Status.ENRICHMENT,
        "Запрашиваем данные в ЕГРЮЛ/ЕГРИП, бюро кредитных историй и ФНС «Прозрачный бизнес»",
    ):
        return

    failed = []
    for source in integrations.SOURCES:
        name = integrations.SOURCE_NAMES[source]
        try:
            response = integrations.fetch(source, application.company.inn)
        except integrations.SourceUnavailable as exc:
            failed.append(source)
            session.add(
                ExternalCheck(
                    application_id=application.id, source=source, status="ERROR", attempts=exc.attempts, error=exc.error
                )
            )
            message = f"{name}: источник недоступен после {exc.attempts} попыток"
        else:
            session.add(
                ExternalCheck(
                    application_id=application.id,
                    source=source,
                    status="OK",
                    attempts=response.attempts,
                    response=response.data,
                )
            )
            message = f"{name}: ответ получен (попыток: {response.attempts})"
        add_event(session, application, actor=Actor.SYSTEM, message=message, event_type="EXTERNAL_CHECK", visible_to_client=False)

    if failed:
        names = ", ".join(integrations.SOURCE_NAMES[s] for s in failed)
        reason = Reason(
            "R60",
            "Часть внешних сервисов не ответила — заявку проверит специалист банка",
            f"Недоступны источники: {names}",
        )
        apply_decision(
            session, application, decision.DecisionResult(Status.MANUAL_REVIEW, [reason]), actor=Actor.SYSTEM
        )
        return
    enqueue(session, application, "score")


def step_score(session: Session, application: Application) -> None:
    if not _enter(session, application, Status.ENRICHMENT, Status.SCORING, "Оцениваем финансовое положение и риски"):
        return
    facts = assessment.collect_facts(application)
    result = scoring.score(assessment.scoring_input(application, facts))
    session.add(
        ScoreResult(
            application_id=application.id,
            score=result.score,
            grade=result.grade,
            factors=[asdict(f) for f in result.factors],
            model_version=result.model_version,
        )
    )
    add_event(
        session,
        application,
        actor=Actor.SYSTEM,
        message=f"Скоринг {result.model_version}: {result.score} баллов, грейд {result.grade}",
        event_type="SCORED",
        visible_to_client=False,
    )
    enqueue(session, application, "decide")


def step_decide(session: Session, application: Application) -> None:
    if not _enter(session, application, Status.SCORING, Status.DECISION, "Принимаем кредитное решение"):
        return
    facts = assessment.collect_facts(application)
    score = application.score_results[-1]
    products = list(session.scalars(select(Product).order_by(Product.sort_order)))
    result = decision.decide(assessment.decision_input(application, facts, score, products))
    apply_decision(session, application, result, actor=Actor.SYSTEM)


def send_to_manual_review(session: Session, application: Application, error: str) -> None:
    """Задание упало несколько раз подряд — отдаём заявку человеку, а не теряем её."""
    if Status(application.status) not in IN_PROGRESS:
        return
    reason = Reason("R61", "Заявку проверит специалист банка", f"Техническая ошибка конвейера: {error[:300]}")
    session.add(
        Decision(
            application_id=application.id,
            outcome=Status.MANUAL_REVIEW,
            decided_by=Actor.SYSTEM,
            reasons=[asdict(reason)],
            rules_version=RULES_VERSION,
        )
    )
    change_status(
        session, application, Status.MANUAL_REVIEW, actor=Actor.SYSTEM, message="Заявку проверяет специалист банка"
    )


STEPS: dict[str, Callable[[Session, Application], None]] = {
    "validate": step_validate,
    "enrich": step_enrich,
    "score": step_score,
    "decide": step_decide,
}
