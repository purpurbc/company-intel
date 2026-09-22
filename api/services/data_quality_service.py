from typing import Mapping


PRODUCT_TIMEZONE = "Europe/Stockholm"
PRODUCT_SOURCE_FALLBACK = "SCB:s företagsregister och Bolagsverket"


def _iso_or_none(value):
    return value.isoformat() if value is not None else None


def metric_coverage(covered: int, total: int) -> dict:
    """Describe field coverage without conflating missing data with zero values."""
    return {
        "covered": covered,
        "total": total,
        "percent": round((covered / total) * 100, 1) if total else None,
    }


def get_overview_metadata(
    cur,
    *,
    total: int,
    coverage_counts: Mapping[str, int],
    technical_geography: Mapping[str, int] | None = None,
) -> dict:
    cur.execute(
        """
        SELECT
            MAX(run.source_as_of_date) AS data_as_of,
            MAX(run.finished_at) AS last_successful_import_at,
            string_agg(
                DISTINCT CASE run.source
                    WHEN 'scb_api' THEN 'SCB API'
                    WHEN 'scb_bulk' THEN 'SCB:s bulkfil'
                    WHEN 'bolagsverket' THEN 'Bolagsverkets bulkfil'
                    WHEN 'legacy' THEN 'Migrerade äldre data'
                    ELSE source.name
                END,
                ', '
            ) AS source
        FROM meta.ingestion_run run
        JOIN meta.source source ON source.code = run.source
        WHERE run.status = 'done';
        """
    )
    freshness = cur.fetchone()

    return {
        "data_as_of": _iso_or_none(freshness["data_as_of"]),
        "source": freshness["source"] or PRODUCT_SOURCE_FALLBACK,
        "last_successful_import_at": _iso_or_none(
            freshness["last_successful_import_at"]
        ),
        "timezone": PRODUCT_TIMEZONE,
        "coverage": {
            key: metric_coverage(int(covered), int(total))
            for key, covered in coverage_counts.items()
        },
        "technical_geography": dict(technical_geography or {}),
    }
