import pytest
from fastapi import HTTPException

from api.services import saved_segment_service


def test_saved_segment_refresh_only_runs_the_count_query(monkeypatch):
    captured = {}

    def get_companies(**kwargs):
        captured.update(kwargs)
        return {"items": [], "total": 49, "limit": 1, "offset": 0}

    monkeypatch.setattr(saved_segment_service, "get_companies", get_companies)

    total = saved_segment_service._count_saved_segment_companies(
        {
            "county_codes": ["18"],
            "age_max": 1,
            "turnover_size_codes": ["4", "5"],
        }
    )

    assert total == 49
    assert captured["count_only"] is True
    assert captured["include_total"] is True
    assert captured["limit"] == 1
    assert captured["county_codes"] == ["18"]
    assert captured["allow_estimated_total"] is False


def test_saved_segment_refresh_does_not_replace_count_after_timeout(monkeypatch):
    monkeypatch.setattr(
        saved_segment_service,
        "get_companies",
        lambda **_: {"items": [], "total": None, "limit": 1, "offset": 0},
    )

    with pytest.raises(HTTPException, match="hann inte räknas") as error:
        saved_segment_service._count_saved_segment_companies({})

    assert error.value.status_code == 504


def test_saved_segment_refresh_never_saves_an_estimated_total(monkeypatch):
    monkeypatch.setattr(
        saved_segment_service,
        "get_companies",
        lambda **_: {
            "items": [],
            "total": 1200,
            "total_kind": "estimated",
            "limit": 1,
            "offset": 0,
        },
    )

    with pytest.raises(HTTPException, match="hann inte räknas"):
        saved_segment_service._count_saved_segment_companies({})
