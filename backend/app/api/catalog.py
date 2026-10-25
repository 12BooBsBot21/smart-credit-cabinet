from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import ClientUser, DbSession
from app.models import Product
from app.schemas import CompanyOut, ProductOut

router = APIRouter(prefix="/api", tags=["Справочники"])


@router.get("/products", response_model=list[ProductOut])
def list_products(session: DbSession) -> list[ProductOut]:
    products = session.scalars(select(Product).order_by(Product.sort_order))
    return [
        ProductOut(
            code=p.code,
            name=p.name,
            plain_name=p.plain_name,
            amount_min=p.amount_min,
            amount_max=p.amount_max,
            term_min=p.term_min,
            term_max=p.term_max,
            base_rate=p.base_rate,
            collateral_required=p.rules.get("collateral_required", False),
            requires_bank_account=p.rules.get("requires_bank_account", False),
            min_business_age_months=p.rules.get("min_business_age_months", 0),
        )
        for p in products
    ]


@router.get("/companies/me", response_model=CompanyOut)
def my_company(user: ClientUser) -> CompanyOut:
    """Данные компании, которые банк уже знает, — клиенту не нужно вводить их заново."""
    return CompanyOut.model_validate(user.company)
