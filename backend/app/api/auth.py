from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.config import settings
from app.models import User
from app.schemas import DemoAccountOut, LoginIn, TokenOut, UserOut
from app.security import Role, create_access_token, verify_password
from app.synthetic.personas import DEMO_PASSWORD, PERSONAS, UNDERWRITER

router = APIRouter(prefix="/api/auth", tags=["Авторизация"])


def user_out(user: User) -> UserOut:
    out = UserOut.model_validate(user)
    out.company_name = user.company.name if user.company else None
    return out


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, session: DbSession) -> TokenOut:
    user = session.scalar(select(User).where(User.login == data.login))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный логин или пароль")
    return TokenOut(access_token=create_access_token(user.id, user.role), user=user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return user_out(user)


@router.get("/demo-accounts", response_model=list[DemoAccountOut])
def demo_accounts() -> list[DemoAccountOut]:
    """Тестовые учётки для страницы входа. Отключается DEMO_MODE=false."""
    if not settings.demo_mode:
        return []
    accounts = [
        DemoAccountOut(
            login=UNDERWRITER["login"],
            password=DEMO_PASSWORD,
            full_name=UNDERWRITER["full_name"],
            role=Role.UNDERWRITER,
            company_name=None,
            hint="Андеррайтер: очередь ручной проверки и решения по заявкам",
        )
    ]
    accounts += [
        DemoAccountOut(
            login=p.login,
            password=DEMO_PASSWORD,
            full_name=p.full_name,
            role=Role.CLIENT,
            company_name=p.company["name"],
            hint=p.hint,
        )
        for p in PERSONAS
    ]
    return accounts
