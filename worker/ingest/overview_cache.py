"""Shared cache lifecycle used by every successful import path."""

from __future__ import annotations

import logging


logger = logging.getLogger(__name__)


def invalidate_overview_caches(conn) -> None:
    """Remove derived overview responses inside the caller's transaction."""

    row = conn.execute(
        "SELECT to_regclass('app.overview_cache') IS NOT NULL AS cache_exists"
    ).fetchone()
    if row and row["cache_exists"]:
        conn.execute("DELETE FROM app.overview_cache")


def prewarm_overview_caches(connection_factory) -> None:
    """Warm global overview caches; regional scopes remain lazy."""

    # Imports are durable before warming starts. A cache failure must not turn a
    # successful source import into a failed ingestion run.
    try:
        from api.services.geography_service import get_geography_counts
        from api.services.bolagsverket_statistics_service import (
            get_bolagsverket_statistics_overview,
        )
        from api.services.sweden_service import get_sweden_overview

        get_geography_counts(connection_factory=connection_factory)
        get_sweden_overview(connection_factory=connection_factory)
        get_bolagsverket_statistics_overview(connection_factory=connection_factory)
    except Exception:
        logger.exception("Overview cache prewarming failed after import")
