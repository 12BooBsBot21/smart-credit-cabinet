from fastapi import APIRouter, status

from app.api.deps import ClientUser, DbSession
from app.schemas import ApplicationCreate, ApplicationDetail, ApplicationSummary, InfoResponseIn, SignIn
from app.services import applications, views

router = APIRouter(prefix="/api/applications", tags=["Заявки клиента"])


@router.get("", response_model=list[ApplicationSummary])
def list_applications(user: ClientUser, session: DbSession) -> list[ApplicationSummary]:
    return [views.summary(a) for a in applications.list_for_company(session, user.company_id)]


@router.post("", response_model=ApplicationDetail, status_code=status.HTTP_201_CREATED)
def create_application(data: ApplicationCreate, user: ClientUser, session: DbSession) -> ApplicationDetail:
    """Создать черновик. Чтобы заявка ушла в банк, вызовите /submit."""
    application = applications.create(session, user, data)
    return views.client_detail(application)


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(application_id: int, user: ClientUser, session: DbSession) -> ApplicationDetail:
    return views.client_detail(applications.get_for_client(session, application_id, user))


@router.post("/{application_id}/submit", response_model=ApplicationDetail)
def submit(application_id: int, user: ClientUser, session: DbSession) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.submit(session, application, user)
    return views.client_detail(application)


@router.post("/{application_id}/withdraw", response_model=ApplicationDetail)
def withdraw(application_id: int, user: ClientUser, session: DbSession) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.withdraw(session, application, user)
    return views.client_detail(application)


@router.post("/{application_id}/info-response", response_model=ApplicationDetail)
def answer_info_request(
    application_id: int, data: InfoResponseIn, user: ClientUser, session: DbSession
) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.answer_info_request(session, application, user, data)
    return views.client_detail(application)


@router.post("/{application_id}/offers/{offer_id}/accept", response_model=ApplicationDetail)
def accept_offer(application_id: int, offer_id: int, user: ClientUser, session: DbSession) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.accept_offer(session, application, user, offer_id)
    return views.client_detail(application)


@router.post("/{application_id}/decline-offer", response_model=ApplicationDetail)
def decline_offer(application_id: int, user: ClientUser, session: DbSession) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.decline_offer(session, application, user)
    return views.client_detail(application)


@router.post("/{application_id}/sign", response_model=ApplicationDetail)
def sign(application_id: int, data: SignIn, user: ClientUser, session: DbSession) -> ApplicationDetail:
    application = applications.get_for_client(session, application_id, user)
    applications.sign(session, application, user, data.code)
    return views.client_detail(application)
