from fastapi import APIRouter

from ..schemas import AdminDataOverview
from ..services.admin_service import get_admin_data_overview

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/data", response_model=AdminDataOverview)
def admin_data_overview():
    return get_admin_data_overview()
