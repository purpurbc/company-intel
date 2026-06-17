import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

APP_ENV = os.getenv("APP_ENV", "develeopment")

def _csv_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]

CORS_ORIGINS = _csv_env("CORS_ORIGINS", "http://localhost:3000")
