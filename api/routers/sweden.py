from fastapi import APIRouter

from ..services.sweden_service import get_sweden_overview

router = APIRouter()


@router.get("/sweden")
def sweden_overview():
    return get_sweden_overview()
