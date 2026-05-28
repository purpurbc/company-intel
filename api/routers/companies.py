from fastapi import APIRouter, Query
from ..services.company_service import (
    get_companies,
    get_company_by_orgnr,
    get_company_turnover_history,
)
from typing import Annotated

router = APIRouter()


@router.get("/companies")
def companies(
    q: str | None = Query(default=None),
    search_by: str = Query(default="all"),

    county_codes: Annotated[list[str] | None, Query()] = None,
    municipality_codes: Annotated[list[str] | None, Query()] = None,
    company_status_codes: Annotated[list[str] | None, Query()] = None,
    company_state_codes: Annotated[list[str] | None, Query()] = None,
    employer_status_codes: Annotated[list[str] | None, Query()] = None,
    vat_status_codes: Annotated[list[str] | None, Query()] = None,
    f_tax_status_codes: Annotated[list[str] | None, Query()] = None,
    marketing_status_codes: Annotated[list[str] | None, Query()] = None,
    size_class_codes: Annotated[list[str] | None, Query()] = None,
    age_min: int | None = Query(default=None, ge=0, le=100),
    age_max: int | None = Query(default=None, ge=0, le=100),
    post_ort: str | None = Query(default=None),
    post_nr: str | None = Query(default=None),
    owner_category_codes: Annotated[list[str] | None, Query()] = None,
    sme_size_codes: Annotated[list[str] | None, Query()] = None,
    export_import_marks: Annotated[list[str] | None, Query()] = None,
    section_codes: Annotated[list[str] | None, Query()] = None,
    industry_codes: Annotated[list[str] | None, Query()] = None,
    industry_detail_codes: Annotated[list[str] | None, Query()] = None,
    turnover_size_codes: Annotated[list[str] | None, Query()] = None,

    name_sort: str = Query(default="asc"),
    metric_sort: str = Query(default="none"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    return get_companies(
        q=q,
        search_by=search_by,
        county_codes=county_codes,
        municipality_codes=municipality_codes,
        company_status_codes=company_status_codes,
        company_state_codes=company_state_codes,
        employer_status_codes=employer_status_codes,
        vat_status_codes=vat_status_codes,
        f_tax_status_codes=f_tax_status_codes,
        marketing_status_codes=marketing_status_codes,
        size_class_codes=size_class_codes,
        age_min=age_min,
        age_max=age_max,
        post_ort=post_ort,
        post_nr=post_nr,
        owner_category_codes=owner_category_codes,
        sme_size_codes=sme_size_codes,
        export_import_marks=export_import_marks,
        section_codes=section_codes,
        industry_codes=industry_codes,
        industry_detail_codes=industry_detail_codes,
        turnover_size_codes=turnover_size_codes,
        name_sort=name_sort,
        metric_sort=metric_sort,
        limit=limit,
        offset=offset,
    )
    
@router.get("/company/{org_nr}")
def company(org_nr: str):
    row = get_company_by_orgnr(org_nr)
    if not row:
        return {"error": "not_found"}
    return row


@router.get("/company/{org_nr}/turnover-history")
def company_turnover_history(org_nr: str):
    return get_company_turnover_history(org_nr)
