from fastapi import APIRouter
from ..services.option_service import (
    get_counties,
    get_municipalities,
    count_counties,
    count_municipalities,
)

router = APIRouter()

@router.get("/options/counties")
def options_counties():
    return get_counties()

@router.get("/options/municipalities")
def options_municipalities(county_code: str):
    return get_municipalities(county_code)

@router.get("/nof/municipalities")
def number_of_municipalities():
    return count_municipalities()

@router.get("/nof/counties")
def number_of_counties():
    return count_counties()