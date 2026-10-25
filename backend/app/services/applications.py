"""Сценарии клиента: создать заявку, отправить, ответить на запрос, принять условия, подписать."""

import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.decision import rub
from app.domain.statuses import Action, Actor, Status
from app.errors import Conflict, InvalidInput, NotFound
from app.models import Application, Product, User, utcnow
from app.schemas import ApplicationCreate, InfoResponseIn
from app.services.workflow import add_event, change_status, enqueue, require_action


def list_for_company(session: Session, company_id: int) -> list[Application]:
    query = (
        select(Application)
        .where(Application.company_id == company_id)
        .order_by(Application.updated_at.desc())
    )
    return list(session.scalars(query))


def get_for_client(session: Session, application_id: int, user: User) -> Application:
    application = session.get(Application, application_id)
    # Чужую заявку отдаём как «не найдена», чтобы не раскрывать, что она существует
    if application is None or application.company_id != user.company_id:
        raise NotFound("Заявка не найдена")
    return application


def create(session: Session, user: User, data: ApplicationCreate) -> Application:
    product = session.get(Product, data.product_code)
    if product is None:
        raise InvalidInput("Неизвестный продукт")
    if not product.amount_min <= data.amount <= product.amount_max:
        raise InvalidInput(f"Сумма по продукту — от {rub(product.amount_min)} до {rub(product.amount_max)}")
    if not product.term_min <= data.term_months <= product.term_max:
        raise InvalidInput(f"Срок по продукту — от {product.term_min} до {product.term_max} мес.")

    application = Application(
        company_id=user.company_id,
        created_by_id=user.id,
        status=Status.DRAFT,
        **data.model_dump(),
    )
    session.add(application)
    session.flush()  # нужен id для номера
    application.number = f"КР-{application.id:06d}"
    add_event(session, application, actor=Actor.CLIENT, user=user, message="Заявка создана", event_type="CREATED")
    session.commit()
    return application


def submit(session: Session, application: Application, user: User) -> None:
    require_action(application, Actor.CLIENT, Action.SUBMIT)
    change_status(session, application, Status.SUBMITTED, actor=Actor.CLIENT, user=user, message="Заявка отправлена в банк")
    enqueue(session, application, "validate")
    session.commit()


def withdraw(session: Session, application: Application, user: User) -> None:
    require_action(application, Actor.CLIENT, Action.WITHDRAW)
    change_status(session, application, Status.WITHDRAWN, actor=Actor.CLIENT, user=user, message="Клиент отозвал заявку")
    session.commit()


def answer_info_request(session: Session, application: Application, user: User, data: InfoResponseIn) -> None:
    require_action(application, Actor.CLIENT, Action.ANSWER_INFO)
    request = next((r for r in reversed(application.info_requests) if r.status == "OPEN"), None)
    if request is None:
        raise Conflict("Нет открытого запроса информации")

    codes = {item["code"] for item in request.items}
    if data.declared_revenue_12m is not None:
        application.declared_revenue_12m = data.declared_revenue_12m
    elif "REVENUE_CONFIRM" in codes:
        # Сумму не исправили — значит, клиент подтверждает её; проверит андеррайтер
        application.revenue_confirmed_by_client = True
    if data.collateral_description:
        application.collateral_description = data.collateral_description
    if data.collateral_value:
        application.collateral_value = data.collateral_value

    request.status = "ANSWERED"
    request.response_comment = data.comment
    request.answered_at = utcnow()
    change_status(
        session,
        application,
        Status.VALIDATION,
        actor=Actor.CLIENT,
        user=user,
        message=f"Клиент ответил на запрос банка: {data.comment}",
    )
    enqueue(session, application, "validate")
    session.commit()


def accept_offer(session: Session, application: Application, user: User, offer_id: int) -> None:
    require_action(application, Actor.CLIENT, Action.ACCEPT_OFFER)
    offer = next((o for o in application.offers if o.id == offer_id and o.status == "PROPOSED"), None)
    if offer is None:
        raise NotFound("Предложение не найдено или уже неактуально")

    for other in application.offers:
        if other.status == "PROPOSED":
            other.status = "DECLINED"
    offer.status = "ACCEPTED"
    # Мок простой электронной подписи: код показываем в кабинете, без SMS (требование кейса)
    application.sign_code = f"{secrets.randbelow(9000) + 1000}"
    change_status(
        session,
        application,
        Status.SIGNING,
        actor=Actor.CLIENT,
        user=user,
        message=f"Условия приняты: {rub(offer.amount)} на {offer.term_months} мес. Подпишите договор в кабинете",
    )
    session.commit()


def decline_offer(session: Session, application: Application, user: User) -> None:
    require_action(application, Actor.CLIENT, Action.DECLINE_OFFER)
    for offer in application.offers:
        if offer.status == "PROPOSED":
            offer.status = "DECLINED"
    change_status(
        session, application, Status.OFFER_DECLINED, actor=Actor.CLIENT, user=user, message="Клиент отказался от условий"
    )
    session.commit()


def sign(session: Session, application: Application, user: User, code: str) -> None:
    require_action(application, Actor.CLIENT, Action.SIGN)
    if code.strip() != application.sign_code:
        raise InvalidInput("Неверный код подтверждения")
    change_status(
        session,
        application,
        Status.ISSUED,
        actor=Actor.CLIENT,
        user=user,
        message="Договор подписан простой электронной подписью (симуляция)",
    )
    add_event(
        session,
        application,
        actor=Actor.SYSTEM,
        event_type="DISBURSED",
        message="Средства зачислены на расчётный счёт (симуляция — реальных операций нет)",
    )
    session.commit()
