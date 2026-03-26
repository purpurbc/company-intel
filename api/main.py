from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import ALLOWED_ORIGIN
from .routers import health, companies, options, counties

app = FastAPI(title="Company Intel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins= [ALLOWED_ORIGIN],
    allow_credentials= True,
    allow_methods= ["*"],
    allow_headers= ["*"],
)

app.include_router(health.router)
app.include_router(companies.router)
app.include_router(counties.router)
app.include_router(options.router)
