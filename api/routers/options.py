from fastapi import APIRouter
from ..schemas import CountyOption, MunicipalityOption
from ..services.option_service import (
    get_counties,
    get_municipalities,
    count_counties,
    count_municipalities,
)

router = APIRouter()

@router.get("/options/counties", response_model=list[CountyOption])
def options_counties():
    return get_counties()

@router.get("/options/municipalities", response_model=list[MunicipalityOption])
def options_municipalities(county_code: str):
    return get_municipalities(county_code)

@router.get("/nof/municipalities", response_model=int)
def number_of_municipalities():
    return count_municipalities()

@router.get("/nof/counties", response_model=int)
def number_of_counties():
    return count_counties()
