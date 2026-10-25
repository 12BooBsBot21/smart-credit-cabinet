from fastapi import APIRouter

from app.api.deps import DbSession, UnderwriterUser
from app.domain.statuses import Status
from app.schemas import ApplicationSummary, BankApplicationDetail, UnderwriterDecisionIn
from app.services import underwriting, views

router = APIRouter(prefix="/api/bank", tags=["Рабочее место банка"])


@router.get("/applications", response_model=list[ApplicationSummary])
def list_applications(
    user: UnderwriterUser, session: DbSession, status: Status | None = None
) -> list[ApplicationSummary]:
    """Все заявки, кроме черновиков. status=MANUAL_REVIEW — очередь ручной проверки."""
    return [views.summary(a) for a in underwriting.list_applications(session, status)]


@router.get("/applications/{application_id}", response_model=BankApplicationDetail)
def get_application(application_id: int, user: UnderwriterUser, session: DbSession) -> BankApplicationDetail:
    return views.bank_detail(underwriting.get(session, application_id))


@router.post("/applications/{application_id}/decision", response_model=BankApplicationDetail)
def decide(
    application_id: int, data: UnderwriterDecisionIn, user: UnderwriterUser, session: DbSession
) -> BankApplicationDetail:
    application = underwriting.get(session, application_id)
    underwriting.decide(session, application, user, data)
    return views.bank_detail(application)
