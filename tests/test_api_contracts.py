from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from pydantic import TypeAdapter, ValidationError

from api.main import app
from api.routers import companies as companies_router
from api.routers import counties as counties_router
from api.schemas import (
    BolagsverketStatisticsOverview,
    CompaniesResponse,
    MetricSort,
    NameSort,
    SearchBy,
)


def test_company_search_rejects_unknown_enum_values():
    for parameter_type in (SearchBy, NameSort, MetricSort):
        with pytest.raises(ValidationError):
            TypeAdapter(parameter_type).validate_python("invalid")

    parameters = {
        parameter["name"]: parameter["schema"]
        for parameter in app.openapi()["paths"]["/companies"]["get"]["parameters"]
    }
    assert parameters["search_by"]["enum"] == ["all", "company_name", "org_nr"]
    assert parameters["name_sort"]["enum"] == ["asc", "desc"]
    assert parameters["metric_sort"]["enum"] == [
        "none",
        "turnover_asc",
        "turnover_desc",
        "size_asc",
        "size_desc",
    ]
    assert parameters["offset"]["exclusiveMaximum"] == 10_000


def test_unknown_detail_resources_return_404(monkeypatch):
    monkeypatch.setattr(companies_router, "get_company_by_orgnr", lambda _: None)
    monkeypatch.setattr(counties_router, "get_county_overview", lambda _: None)
    monkeypatch.setattr(counties_router, "get_municipality_overview", lambda _: None)

    for endpoint in (
        lambda: companies_router.company("unknown"),
        lambda: counties_router.county_overview("unknown"),
        lambda: counties_router.municipality_overview("unknown"),
    ):
        with pytest.raises(HTTPException) as error:
            endpoint()
        assert error.value.status_code == 404


def test_companies_response_is_validated_and_serialized():
    response = CompaniesResponse.model_validate(
        {
            "items": [
                {
                    "company_id": 1,
                    "entity_type": "organization",
                    "org_nr": "5560000000",
                    "company_name": "Test AB",
                    "ingested_at": datetime(2026, 9, 9, tzinfo=timezone.utc),
                }
            ],
            "total": 1,
            "limit": 100,
            "offset": 0,
        }
    )
    payload = response.model_dump(mode="json")
    assert payload["items"][0]["ingested_at"] == "2026-09-09T00:00:00Z"
    assert payload["items"][0]["matched_name"] is None
    assert payload["total_kind"] == "none"
    assert payload["search_mode"] == "results"
    assert payload["has_more"] is False
    assert payload["result_window_limit"] == 10_000


def test_public_read_endpoints_publish_response_schemas():
    openapi = app.openapi()
    for path, methods in openapi["paths"].items():
        for method, operation in methods.items():
            schema = operation["responses"]["200"]["content"]["application/json"][
                "schema"
            ]
            assert schema, f"Missing response schema for {method.upper()} {path}"


def test_bolagsverket_statistics_response_contract():
    response = BolagsverketStatisticsOverview.model_validate(
        {
            "source": "Bolagsverket",
            "license": "CC BY 2.5 SE",
            "last_successful_import_at": "2026-09-13T21:22:01Z",
            "company_dynamics": [
                {
                    "period": "2026-08-01",
                    "registered": 4215,
                    "closed": 3151,
                    "net_change": 1064,
                    "total_registered": 1130245,
                }
            ],
            "company_forms": [{"code": "AB", "name": "Aktiebolag", "count": 10}],
            "representative_history": [],
            "representative_roles": [],
            "auditor_reservations": [],
            "filing_delays": [],
        }
    )

    payload = response.model_dump(mode="json")
    assert payload["company_dynamics"][0]["period"] == "2026-08-01"
    assert payload["company_dynamics"][0]["net_change"] == 1064


def test_removed_crm_and_watch_routes_are_not_published():
    paths = app.openapi()["paths"]

    assert "/customers" not in paths
    assert "/sales-offers" not in paths
    assert "/watched-companies" not in paths
    assert "/companies/{company_id}/watch" not in paths
