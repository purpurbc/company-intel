"""Read models for Bolagsverket's public aggregate statistics."""

from threading import Lock

from ..database import get_db_connection
from .overview_cache import get_overview_cache, set_overview_cache


STATISTICS_CACHE_KEY = "bolagsverket-statistics:v2"
_statistics_lock = Lock()


def _iso_or_none(value):
    return value.isoformat() if value is not None else None


def _as_int(value):
    return int(value) if value is not None else None


def _as_float(value):
    return float(value) if value is not None else None


def get_bolagsverket_statistics_overview(*, connection_factory=None):
    """Return a bounded, cached national view of the four statistics files."""

    cached = get_overview_cache(
        STATISTICS_CACHE_KEY,
        connection_factory=connection_factory,
    )
    if cached:
        return cached

    with _statistics_lock:
        cached = get_overview_cache(
            STATISTICS_CACHE_KEY,
            connection_factory=connection_factory,
        )
        if cached:
            return cached

        overview = _calculate_statistics_overview(
            connection_factory=connection_factory,
        )
        set_overview_cache(
            STATISTICS_CACHE_KEY,
            overview,
            connection_factory=connection_factory,
        )
        return overview


def _calculate_statistics_overview(*, connection_factory=None):
    connect = connection_factory or get_db_connection
    with connect() as conn, conn.cursor() as cur:
        # The endpoint exposes fixed recent windows. Keep every aggregate
        # bounded so a normal page load never returns source-sized datasets.
        cur.execute("SET LOCAL statement_timeout = '8s'")
        cur.execute("SET LOCAL max_parallel_workers_per_gather = 2")

        cur.execute(
            """
            SELECT max(finished_at) AS last_successful_import_at
            FROM meta.ingestion_run
            WHERE source = 'bolagsverket_statistics'
              AND status = 'done';
            """
        )
        import_row = cur.fetchone()

        cur.execute(
            """
            WITH monthly_counts AS (
                SELECT
                    statistics.period_start,
                    statistics.event_code,
                    sum(statistics.company_count)::bigint AS company_count
                FROM mart.bolagsverket_company_statistics_monthly statistics
                WHERE statistics.period_start >= (
                    SELECT max(period_start) - interval '23 months'
                    FROM mart.bolagsverket_company_statistics_monthly
                )
                GROUP BY statistics.period_start, statistics.event_code
            )
            SELECT
                period_start,
                max(company_count) FILTER (WHERE event_code = 1) AS registered,
                max(company_count) FILTER (WHERE event_code = 2) AS total_registered,
                max(company_count) FILTER (WHERE event_code = 3) AS closed
            FROM monthly_counts
            GROUP BY period_start
            ORDER BY period_start DESC;
            """
        )
        company_dynamics = []
        for row in cur.fetchall():
            registered = _as_int(row["registered"])
            closed = _as_int(row["closed"])
            company_dynamics.append(
                {
                    "period": _iso_or_none(row["period_start"]),
                    "registered": registered,
                    "closed": closed,
                    "net_change": (
                        registered - closed
                        if registered is not None and closed is not None
                        else None
                    ),
                    "total_registered": _as_int(row["total_registered"]),
                }
            )

        cur.execute(
            """
            SELECT
                statistics.organization_form_code AS code,
                coalesce(
                    statistics.organization_form_name,
                    statistics.organization_form_code
                ) AS name,
                statistics.company_count AS count
            FROM mart.bolagsverket_company_statistics_monthly statistics
            WHERE statistics.event_code = 2
              AND statistics.period_start = (
                  SELECT max(period_start)
                  FROM mart.bolagsverket_company_statistics_monthly
              )
            ORDER BY statistics.company_count DESC, name
            LIMIT 10;
            """
        )
        company_forms = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT
                statistics.year,
                max(statistics.representative_count)
                    FILTER (WHERE statistics.representative_role_code = 'VD')
                    AS chief_executives,
                max(statistics.representative_count)
                    FILTER (WHERE statistics.representative_role_code = 'LE')
                    AS board_members,
                max(statistics.representative_count)
                    FILTER (WHERE statistics.representative_role_code = 'OF')
                    AS chairpersons,
                max(statistics.representative_count)
                    FILTER (WHERE statistics.representative_role_code = 'SU')
                    AS deputies
            FROM mart.bolagsverket_representative_statistics_yearly statistics
            WHERE statistics.year >= (
                SELECT max(year) - 9
                FROM mart.bolagsverket_representative_statistics_yearly
            )
            GROUP BY statistics.year
            ORDER BY statistics.year DESC;
            """
        )
        representative_history = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT
                statistics.representative_role_code AS code,
                coalesce(
                    statistics.representative_role_name,
                    statistics.representative_role_code
                ) AS name,
                statistics.representative_count AS count
            FROM mart.bolagsverket_representative_statistics_yearly statistics
            WHERE statistics.year = (
                SELECT max(year)
                FROM mart.bolagsverket_representative_statistics_yearly
            )
            ORDER BY statistics.representative_count DESC, name
            LIMIT 10;
            """
        )
        representative_roles = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT
                statistics.registration_year AS year,
                statistics.formation_type_code,
                coalesce(
                    formation_type.name,
                    statistics.formation_type_code
                ) AS formation_type_name,
                statistics.company_count,
                statistics.with_auditor_at_formation_count,
                statistics.with_auditor_reservation_count,
                statistics.without_auditor_with_reservation_count,
                statistics.with_auditor_reservation_share::double precision,
                statistics.without_auditor_with_reservation_share::double precision
            FROM app.bolagsverket_auditor_reservation_statistics statistics
            LEFT JOIN app.dim_bolagsverket_formation_type formation_type
                ON formation_type.code = statistics.formation_type_code
            ORDER BY statistics.registration_year DESC, formation_type_name
            LIMIT 100;
            """
        )
        auditor_reservations = [dict(row) for row in cur.fetchall()]

        cur.execute(
            """
            SELECT
                statistics.period_through_year AS year,
                statistics.expected_to_file_count,
                statistics.filed_annual_report_count,
                statistics.late_fee_count,
                statistics.filed_annual_report_share::double precision,
                statistics.late_fee_share::double precision
            FROM app.bolagsverket_filing_delay_statistics statistics
            WHERE statistics.period_through_year >= (
                SELECT max(period_through_year) - 9
                FROM app.bolagsverket_filing_delay_statistics
            )
            ORDER BY statistics.period_through_year DESC;
            """
        )
        filing_delays = [dict(row) for row in cur.fetchall()]

    return {
        "source": "Bolagsverket",
        "license": "CC BY 2.5 SE",
        "last_successful_import_at": _iso_or_none(
            import_row["last_successful_import_at"]
        ),
        "company_dynamics": company_dynamics,
        "company_forms": company_forms,
        "representative_history": representative_history,
        "representative_roles": representative_roles,
        "auditor_reservations": [
            {
                **row,
                "company_count": _as_int(row["company_count"]),
                "with_auditor_at_formation_count": _as_int(
                    row["with_auditor_at_formation_count"]
                ),
                "with_auditor_reservation_count": _as_int(
                    row["with_auditor_reservation_count"]
                ),
                "without_auditor_with_reservation_count": _as_int(
                    row["without_auditor_with_reservation_count"]
                ),
                "with_auditor_reservation_share": _as_float(
                    row["with_auditor_reservation_share"]
                ),
                "without_auditor_with_reservation_share": _as_float(
                    row["without_auditor_with_reservation_share"]
                ),
            }
            for row in auditor_reservations
        ],
        "filing_delays": [
            {
                **row,
                "expected_to_file_count": _as_int(row["expected_to_file_count"]),
                "filed_annual_report_count": _as_int(
                    row["filed_annual_report_count"]
                ),
                "late_fee_count": _as_int(row["late_fee_count"]),
                "filed_annual_report_share": _as_float(
                    row["filed_annual_report_share"]
                ),
                "late_fee_share": _as_float(row["late_fee_share"]),
            }
            for row in filing_delays
        ],
    }
