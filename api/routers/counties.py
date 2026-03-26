from fastapi import APIRouter
from ..services.county_service import get_county_overview

router = APIRouter()

@router.get("/county/{county_code}")
def county_overview(county_code: str):
    row = get_county_overview(county_code)
    if not row:
        return {"error": "not_found"}
    return row