"""Сценарии андеррайтера: очередь заявок и ручное решение."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.decision import DecisionResult, InfoItem, Reason, build_offer
from app.domain.statuses import Action, Actor, Status
from app.errors import InvalidInput, NotFound
from app.models import Application, User
from app.schemas import UnderwriterDecisionIn
from app.services.assessment import product_terms
from app.services.workflow import apply_decision, require_action

# Если скоринга нет (например, бюро не ответило), условия считаем по среднему грейду
FALLBACK_GRADE = "C"

CLIENT_TEXTS = {
    Status.APPROVED: "Кредит одобрен специалистом банка",
    Status.COUNTER_OFFER: "Специалист банка предложил другие условия",
    Status.NEEDS_INFO: "Специалисту банка нужна дополнительная информация",
    Status.REJECTED: "Решение принято специалистом банка по результатам проверки",
}


def list_applications(session: Session, status: Status | None) -> list[Application]:
    query = select(Application).where(Application.status != Status.DRAFT).order_by(Application.updated_at.desc())
    if status is not None:
        query = query.where(Application.status == status)
    return list(session.scalars(query))


def get(session: Session, application_id: int) -> Application:
    application = session.get(Application, application_id)
    if application is None:
        raise NotFound("Заявка не найдена")
    return application


def decide(session: Session, application: Application, user: User, data: UnderwriterDecisionIn) -> None:
    require_action(application, Actor.UNDERWRITER, Action.DECIDE)
    terms = product_terms(application.product)
    grade = application.score_results[-1].grade if application.score_results else FALLBACK_GRADE
    offers, info_items = [], []

    if data.outcome == Status.APPROVED:
        offers.append(
            build_offer(terms, application.amount, application.term_months, grade, application.collateral_description)
        )
    elif data.outcome == Status.COUNTER_OFFER:
        if data.amount is None or data.term_months is None:
            raise InvalidInput("Для иных условий укажите сумму и срок")
        if not terms.amount_min <= data.amount <= terms.amount_max or not terms.term_min <= data.term_months <= terms.term_max:
            raise InvalidInput("Сумма или срок вне границ продукта")
        offers.append(build_offer(terms, data.amount, data.term_months, grade, application.collateral_description))
    elif data.outcome == Status.NEEDS_INFO:
        if not data.info_text:
            raise InvalidInput("Опишите, какая информация нужна от клиента")
        info_items.append(InfoItem("OTHER", data.info_text))

    reason = Reason("U01", CLIENT_TEXTS[data.outcome], f"Решение андеррайтера: {data.comment}")
    result = DecisionResult(data.outcome, [reason], offers=offers, info_items=info_items)
    apply_decision(session, application, result, actor=Actor.UNDERWRITER, user=user, comment=data.comment)
    session.commit()
