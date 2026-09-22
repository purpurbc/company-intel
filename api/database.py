from threading import Lock

from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from .config import DATABASE_URL, DB_POOL_MAX_SIZE, DB_POOL_MIN_SIZE


_CONNECTION_OPTIONS = (
    "-c timezone=Europe/Stockholm "
    "-c search_path=app,extensions,pg_catalog"
)
_pool = ConnectionPool(
    conninfo=DATABASE_URL,
    min_size=DB_POOL_MIN_SIZE,
    max_size=DB_POOL_MAX_SIZE,
    kwargs={"row_factory": dict_row, "options": _CONNECTION_OPTIONS},
    open=False,
    name="company-intel-api",
)
_pool_start_lock = Lock()


def open_db_pool() -> None:
    """Open and warm the shared API pool once during application startup."""
    if not _pool.closed:
        return
    with _pool_start_lock:
        if _pool.closed:
            _pool.open(wait=True, timeout=15)


def close_db_pool() -> None:
    if not _pool.closed:
        _pool.close()


def get_db_connection():
    """Borrow a transaction-scoped connection; the context returns it safely."""
    open_db_pool()
    return _pool.connection()
