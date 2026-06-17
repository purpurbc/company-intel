from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ..services.profile_service import (
    create_customer_account,
    create_sales_offer,
    delete_customer_account,
    delete_sales_offer,
    get_app_user,
    list_customer_accounts,
    list_sales_offers,
    update_app_user,
    update_customer_account,
    update_sales_offer,
)
from ..services.saved_segment_service import DEFAULT_USER_ID


router = APIRouter()


class AppUserPayload(BaseModel):
    auth_provider: str | None = None
    auth_subject: str | None = None
    email: str | None = None
    display_name: str | None = None
    role: str = "user"
    company_org_nr: str | None = None
    company_description: str | None = None
    ideal_customer_description: str | None = None
    settings: dict[str, object] = Field(default_factory=dict)


class SalesOfferPayload(BaseModel):
    name: str
    description: str | None = None
    target: str | None = None
    saved_segment_id: UUID | None = None
    customer_ids: list[UUID] = Field(default_factory=list)


class CustomerAccountPayload(BaseModel):
    org_nr: str
    customer_labels: list[str] = Field(default_factory=list)
    offer_ids: list[UUID] = Field(default_factory=list)
    connection_text: str | None = None
    why_fit: str | None = None
    pain_points: str | None = None
    buying_trigger: str | None = None
    outcome: str | None = None
    tags: list[str] = Field(default_factory=list)
    fit_score: int = Field(default=0, ge=0, le=10)


@router.get("/user-profile")
def user_profile(user_id: UUID = DEFAULT_USER_ID):
    return get_app_user(user_id=user_id)


@router.put("/user-profile")
def update_user_profile(payload: AppUserPayload, user_id: UUID = DEFAULT_USER_ID):
    return update_app_user(payload.model_dump(), user_id=user_id)


@router.get("/sales-offers")
def sales_offers(user_id: UUID = DEFAULT_USER_ID):
    return {"items": list_sales_offers(user_id=user_id)}


@router.post("/sales-offers")
def create_offer(payload: SalesOfferPayload, user_id: UUID = DEFAULT_USER_ID):
    return create_sales_offer(payload.model_dump(), user_id=user_id)


@router.put("/sales-offers/{offer_id}")
def update_offer(
    offer_id: UUID,
    payload: SalesOfferPayload,
    user_id: UUID = DEFAULT_USER_ID,
):
    row = update_sales_offer(offer_id, payload.model_dump(), user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="sales_offer_not_found")
    return row


@router.delete("/sales-offers/{offer_id}")
def delete_offer(offer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    row = delete_sales_offer(offer_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="sales_offer_not_found")
    return {"ok": True, "id": str(row["id"])}


@router.get("/customers")
def customers(user_id: UUID = DEFAULT_USER_ID):
    return {"items": list_customer_accounts(user_id=user_id)}


@router.post("/customers")
def create_customer(payload: CustomerAccountPayload, user_id: UUID = DEFAULT_USER_ID):
    return create_customer_account(payload.model_dump(), user_id=user_id)


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: UUID,
    payload: CustomerAccountPayload,
    user_id: UUID = DEFAULT_USER_ID,
):
    row = update_customer_account(customer_id, payload.model_dump(), user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="customer_not_found")
    return row


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: UUID, user_id: UUID = DEFAULT_USER_ID):
    row = delete_customer_account(customer_id, user_id=user_id)
    if not row:
        raise HTTPException(status_code=404, detail="customer_not_found")
    return {"ok": True, "id": str(row["id"])}
