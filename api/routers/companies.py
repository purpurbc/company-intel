from fastapi import APIRouter, Query
from ..services.company_service import get_companies, get_company_by_orgnr

router = APIRouter()

@router.get("/companies")
def companies(
    q: str | None = Query(default=None),
    search_by: str = Query(default="all"),
    county_code: str | None = None,
    municipality_code: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return get_companies(
        q=q,
        search_by=search_by,
        county_code=county_code,
        municipality_code=municipality_code,
        limit=limit,
        offset=offset,
    )

@router.get("/company/{org_nr}")
def company(org_nr: str):
    row = get_company_by_orgnr(org_nr)
    if not row:
        return {"error": "not_found"}
    return row