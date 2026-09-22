import os
from urllib.parse import urlsplit

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()


def _positive_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc
    if value < 1:
        raise RuntimeError(f"{name} must be at least 1")
    return value


DB_POOL_MIN_SIZE = _positive_int_env("DB_POOL_MIN_SIZE", 1)
DB_POOL_MAX_SIZE = _positive_int_env("DB_POOL_MAX_SIZE", 10)
OVERVIEW_CACHE_TTL_SECONDS = _positive_int_env(
    "OVERVIEW_CACHE_TTL_SECONDS",
    3600,
)
if DB_POOL_MIN_SIZE > DB_POOL_MAX_SIZE:
    raise RuntimeError("DB_POOL_MIN_SIZE cannot exceed DB_POOL_MAX_SIZE")

def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured is None:
        if APP_ENV in {"development", "test"}:
            configured = "http://localhost:3000,http://127.0.0.1:3000"
        else:
            raise RuntimeError(
                "CORS_ORIGINS must be set explicitly outside development/test"
            )

    origins = [item.strip().rstrip("/") for item in configured.split(",") if item.strip()]
    if not origins:
        raise RuntimeError("CORS_ORIGINS must contain at least one origin")

    for origin in origins:
        parsed = urlsplit(origin)
        if origin == "*" or parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise RuntimeError(f"Invalid CORS origin: {origin!r}")
        if parsed.path or parsed.query or parsed.fragment:
            raise RuntimeError(f"CORS origins may not contain a path: {origin!r}")
        if APP_ENV in {"staging", "production"} and parsed.hostname in {
            "localhost",
            "127.0.0.1",
        }:
            raise RuntimeError(
                f"Localhost is not an allowed {APP_ENV} CORS origin: {origin!r}"
            )

    return list(dict.fromkeys(origins))


CORS_ORIGINS = _cors_origins()
