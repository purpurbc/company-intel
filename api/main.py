from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .routers import (
    health,
    companies,
    options,
    counties,
    sweden,
    saved_segments,
    profile,
)

app = FastAPI(title="Company Intel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(companies.router)
app.include_router(counties.router)
app.include_router(sweden.router)
app.include_router(options.router)
app.include_router(saved_segments.router)
app.include_router(profile.router)
