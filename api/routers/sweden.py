from fastapi import APIRouter

from ..schemas import (
    BolagsverketStatisticsOverview,
    GeographyCounts,
    SwedenOverview,
)
from ..services.bolagsverket_statistics_service import (
    get_bolagsverket_statistics_overview,
)
from ..services.geography_service import get_geography_counts
from ..services.sweden_service import get_sweden_overview

router = APIRouter()


@router.get("/sweden", response_model=SwedenOverview)
def sweden_overview():
    return get_sweden_overview()


@router.get(
    "/sweden/bolagsverket-statistics",
    response_model=BolagsverketStatisticsOverview,
)
def bolagsverket_statistics_overview():
    return get_bolagsverket_statistics_overview()


@router.get("/geography/counts", response_model=GeographyCounts)
def geography_counts():
    return get_geography_counts()
