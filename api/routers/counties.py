from fastapi import APIRouter, HTTPException
from ..schemas import CountyOverview, MunicipalityOverview
from ..services.county_service import get_county_overview, get_municipality_overview

router = APIRouter()

@router.get("/county/{county_code}", response_model=CountyOverview)
def county_overview(county_code: str):
    row = get_county_overview(county_code)
    if not row:
        raise HTTPException(status_code=404, detail="county_not_found")
    return row


@router.get("/municipality/{municipality_code}", response_model=MunicipalityOverview)
def municipality_overview(municipality_code: str):
    row = get_municipality_overview(municipality_code)
    if not row:
        raise HTTPException(status_code=404, detail="municipality_not_found")
    return row
