from fastapi import APIRouter
from ..services.county_service import get_county_overview, get_municipality_overview

router = APIRouter()

@router.get("/county/{county_code}")
def county_overview(county_code: str):
    row = get_county_overview(county_code)
    if not row:
        return {"error": "not_found"}
    return row


@router.get("/municipality/{municipality_code}")
def municipality_overview(municipality_code: str):
    row = get_municipality_overview(municipality_code)
    if not row:
        return {"error": "not_found"}
    return row
