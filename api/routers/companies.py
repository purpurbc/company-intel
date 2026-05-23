from fastapi import APIRouter, Query
from ..services.company_service import get_companies, get_company_by_orgnr
from typing import Annotated

router = APIRouter()


@router.get("/companies")
def companies(
    q: str | None = Query(default=None),
    search_by: str = Query(default="all"),

    county_codes: Annotated[list[str] | None, Query()] = None,
    municipality_codes: Annotated[list[str] | None, Query()] = None,
    size_class_codes: Annotated[list[str] | None, Query()] = None,
    industry_codes: Annotated[list[str] | None, Query()] = None,

    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    return get_companies(
        q=q,
        search_by=search_by,
        county_codes=county_codes,
        municipality_codes=municipality_codes,
        size_class_codes=size_class_codes,
        industry_codes=industry_codes,
        limit=limit,
        offset=offset,
    )
    
@router.get("/company/{org_nr}")
def company(org_nr: str):
    row = get_company_by_orgnr(org_nr)
    if not row:
        return {"error": "not_found"}
    return row