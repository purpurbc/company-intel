from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field
from ..schemas import AppUserProfile

from ..services.profile_service import (
    get_app_user,
    update_app_user,
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
    company_id: int | None = Field(default=None, gt=0)
    company_description: str | None = None
    ideal_customer_description: str | None = None
    settings: dict[str, object] = Field(default_factory=dict)


@router.get("/user-profile", response_model=AppUserProfile)
def user_profile(user_id: UUID = DEFAULT_USER_ID):
    return get_app_user(user_id=user_id)


@router.put("/user-profile", response_model=AppUserProfile)
def update_user_profile(payload: AppUserPayload, user_id: UUID = DEFAULT_USER_ID):
    return update_app_user(payload.model_dump(), user_id=user_id)
