"""Преобразование заявки из БД в ответы API. Клиент и банк видят разное:
клиенту — понятные тексты и свои события, андеррайтеру — всё, включая баллы и сырые ответы источников."""

from dataclasses import asdict

from app.domain.statuses import Actor, Status, available_actions
from app.models import Application, ApplicationEvent, Decision, ExternalCheck, Offer
from app.schemas import (
    ApplicationDetail,
    ApplicationSummary,
    BankApplicationDetail,
    BankDecisionOut,
    ClientDecisionOut,
    CompanyOut,
    EventOut,
    ExternalCheckOut,
    FactsOut,
    InfoRequestOut,
    OfferOut,
    ScoreOut,
    TurnoverOut,
)
from app.services.assessment import collect_facts
from app.services.integrations import SOURCE_NAMES

VISIBLE_OFFER_STATUSES = ("PROPOSED", "ACCEPTED")


def summary(application: Application) -> ApplicationSummary:
    return ApplicationSummary(
        id=application.id,
        number=application.number or "",
        status=Status(application.status),
        product_code=application.product_code,
        product_name=application.product.name,
        company_name=application.company.name,
        amount=application.amount,
        term_months=application.term_months,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


def _offer(offer: Offer) -> OfferOut:
    return OfferOut(
        id=offer.id,
        product_code=offer.product_code,
        product_name=offer.product.name,
        amount=offer.amount,
        term_months=offer.term_months,
        rate=offer.rate,
        monthly_payment=offer.monthly_payment,
        collateral=offer.collateral,
        status=offer.status,
    )


def _event(event: ApplicationEvent) -> EventOut:
    return EventOut(
        id=event.id,
        actor=Actor(event.actor),
        actor_name=event.actor_user.full_name if event.actor_user else None,
        event_type=event.event_type,
        from_status=event.from_status,
        to_status=event.to_status,
        message=event.message,
        visible_to_client=event.visible_to_client,
        created_at=event.created_at,
    )


def _external_check(check: ExternalCheck) -> ExternalCheckOut:
    return ExternalCheckOut(
        id=check.id,
        source=check.source,
        source_name=SOURCE_NAMES.get(check.source, check.source),
        status=check.status,
        attempts=check.attempts,
        response=check.response,
        error=check.error,
        created_at=check.created_at,
    )


def _bank_decision(decision: Decision) -> BankDecisionOut:
    return BankDecisionOut(
        id=decision.id,
        outcome=Status(decision.outcome),
        decided_by=Actor(decision.decided_by),
        user_name=decision.user.full_name if decision.user else None,
        reasons=decision.reasons,
        recommendation=decision.recommendation,
        rules_version=decision.rules_version,
        comment=decision.comment,
        created_at=decision.created_at,
    )


def _detail_fields(application: Application, actor: Actor, events: list[ApplicationEvent]) -> dict:
    status = Status(application.status)
    open_request = next((r for r in reversed(application.info_requests) if r.status == "OPEN"), None)
    last_decision = application.decisions[-1] if application.decisions else None
    return {
        **summary(application).model_dump(),
        "purpose": application.purpose,
        "declared_revenue_12m": application.declared_revenue_12m,
        "collateral_description": application.collateral_description,
        "collateral_value": application.collateral_value,
        "available_actions": available_actions(status, actor),
        "offers": [_offer(o) for o in application.offers if o.status in VISIBLE_OFFER_STATUSES],
        "info_request": InfoRequestOut.model_validate(open_request) if open_request else None,
        "decision": ClientDecisionOut(
            outcome=Status(last_decision.outcome),
            reasons=[r["client_text"] for r in last_decision.reasons],
            created_at=last_decision.created_at,
        )
        if last_decision
        else None,
        "sign_code": application.sign_code if status == Status.SIGNING else None,
        "events": [_event(e) for e in events],
    }


def client_detail(application: Application) -> ApplicationDetail:
    events = [e for e in application.events if e.visible_to_client]
    return ApplicationDetail(**_detail_fields(application, Actor.CLIENT, events))


def bank_detail(application: Application) -> BankApplicationDetail:
    last_score = application.score_results[-1] if application.score_results else None
    return BankApplicationDetail(
        **_detail_fields(application, Actor.UNDERWRITER, application.events),
        company=CompanyOut.model_validate(application.company),
        company_assets=application.company.assets,
        turnovers=[TurnoverOut.model_validate(t) for t in application.company.turnovers],
        facts=FactsOut(**asdict(collect_facts(application))),
        external_checks=[_external_check(c) for c in application.external_checks],
        score=ScoreOut.model_validate(last_score) if last_score else None,
        decisions=[_bank_decision(d) for d in application.decisions],
    )
