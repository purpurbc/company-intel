from datetime import datetime, timezone

from ..database import get_db_connection


def get_admin_data_overview():
    """Return operational import and data-health facts without scanning product tables."""
    with get_db_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                count(*)::bigint AS runs_total,
                count(*) FILTER (WHERE status = 'done')::bigint AS done,
                count(*) FILTER (WHERE status = 'failed')::bigint AS failed,
                count(*) FILTER (WHERE status = 'running')::bigint AS running,
                count(*) FILTER (WHERE status = 'interrupted')::bigint AS interrupted,
                max(finished_at) FILTER (WHERE status = 'done') AS latest_successful_import_at,
                (SELECT count(*)::bigint FROM meta.data_quality_issue) AS quality_issues_total,
                pg_database_size(current_database())::bigint AS database_size_bytes
            FROM meta.ingestion_run;
            """
        )
        summary = cur.fetchone()

        cur.execute(
            """
            SELECT
                source.code AS source,
                source.name AS source_name,
                count(run.id)::bigint AS runs,
                count(run.id) FILTER (WHERE run.status = 'done')::bigint AS done,
                count(run.id) FILTER (WHERE run.status = 'failed')::bigint AS failed,
                coalesce(sum(run.records_seen), 0)::bigint AS records_seen,
                coalesce(sum(run.records_new), 0)::bigint AS records_new,
                coalesce(sum(run.records_changed), 0)::bigint AS records_changed,
                coalesce(sum(run.records_skipped), 0)::bigint AS records_skipped,
                max(run.started_at) AS latest_started_at,
                max(run.finished_at) FILTER (WHERE run.status = 'done') AS latest_successful_import_at
            FROM meta.source source
            LEFT JOIN meta.ingestion_run run ON run.source = source.code
            GROUP BY source.code, source.name
            ORDER BY source.name;
            """
        )
        source_summaries = cur.fetchall()

        cur.execute(
            """
            SELECT
                run.id,
                run.source,
                source.name AS source_name,
                run.dataset,
                run.started_at,
                run.finished_at,
                greatest(
                    extract(epoch FROM (coalesce(run.finished_at, current_timestamp) - run.started_at)),
                    0
                )::double precision AS duration_seconds,
                run.source_as_of_date,
                run.filename,
                run.file_checksum,
                run.schema_version,
                run.metadata,
                run.records_seen,
                run.records_new,
                run.records_changed,
                run.records_skipped,
                run.last_row_number,
                run.status,
                run.error,
                count(issue.id)::bigint AS quality_issue_count
            FROM meta.ingestion_run run
            JOIN meta.source source ON source.code = run.source
            LEFT JOIN meta.data_quality_issue issue ON issue.ingestion_run_id = run.id
            GROUP BY run.id, source.name
            ORDER BY run.started_at DESC, run.id DESC;
            """
        )
        ingestion_runs = cur.fetchall()

        cur.execute(
            """
            SELECT issue_code, count(*)::bigint AS count
            FROM meta.data_quality_issue
            GROUP BY issue_code
            ORDER BY count DESC, issue_code;
            """
        )
        quality_issues_by_code = cur.fetchall()

        cur.execute(
            """
            SELECT
                issue.id,
                issue.ingestion_run_id,
                run.source,
                issue.row_number,
                issue.issue_code,
                issue.detail,
                issue.observed_at
            FROM meta.data_quality_issue issue
            JOIN meta.ingestion_run run ON run.id = issue.ingestion_run_id
            ORDER BY issue.observed_at DESC, issue.id DESC
            LIMIT 100;
            """
        )
        recent_quality_issues = cur.fetchall()

        cur.execute(
            """
            SELECT
                schemaname AS schema_name,
                relname AS table_name,
                greatest(n_live_tup, 0)::bigint AS estimated_rows,
                greatest(n_dead_tup, 0)::bigint AS dead_rows,
                pg_total_relation_size(relid)::bigint AS total_bytes,
                last_analyze,
                last_autoanalyze
            FROM pg_stat_user_tables
            WHERE schemaname IN ('raw', 'src_scb', 'src_bolagsverket', 'core', 'app')
            ORDER BY pg_total_relation_size(relid) DESC, schemaname, relname;
            """
        )
        table_stats = cur.fetchall()

        cur.execute(
            """
            SELECT scope, generated_at, expires_at
            FROM app.overview_cache
            ORDER BY generated_at DESC, scope;
            """
        )
        cache_entries = cur.fetchall()

        cur.execute(
            """
            SELECT payload->'metadata' AS overview_metadata,
                   payload->'totals' AS overview_totals
            FROM app.overview_cache
            WHERE scope LIKE 'sweden:v%'
            ORDER BY generated_at DESC
            LIMIT 1;
            """
        )
        cached_overview = cur.fetchone() or {}

        cur.execute(
            """
            WITH search_events AS (
                SELECT *
                FROM app.search_event
                WHERE observed_at >= current_timestamp - interval '7 days'
            ), data_events AS (
                SELECT *
                FROM search_events
                WHERE event_type = 'data'
            ), click_events AS (
                SELECT *
                FROM search_events
                WHERE event_type = 'click'
            )
            SELECT
                168::integer AS window_hours,
                count(*)::bigint AS data_requests,
                count(*) FILTER (WHERE search_mode = 'autocomplete')::bigint
                    AS autocomplete_requests,
                (percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms)
                    FILTER (WHERE duration_ms IS NOT NULL))::double precision AS p50_ms,
                (percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
                    FILTER (WHERE duration_ms IS NOT NULL))::double precision AS p95_ms,
                coalesce(100.0 * count(*) FILTER (WHERE EXISTS (
                    SELECT 1
                    FROM search_events timeout_event
                    WHERE timeout_event.search_id = data_events.search_id
                      AND timeout_event.outcome = 'timeout'
                ))
                    / nullif(count(*), 0), 0)::double precision AS timeout_percent,
                coalesce(100.0 * count(*) FILTER (
                    WHERE outcome = 'ok' AND result_count = 0
                ) / nullif(count(*) FILTER (WHERE outcome = 'ok'), 0), 0)::double precision
                    AS zero_result_percent,
                coalesce(100.0 * count(*) FILTER (WHERE reformulated)
                    / nullif(count(*), 0), 0)::double precision AS reformulation_percent,
                coalesce(100.0 * count(*) FILTER (WHERE fuzzy_used)
                    / nullif(count(*), 0), 0)::double precision AS fuzzy_percent,
                coalesce(avg(filter_count), 0)::double precision AS average_filter_count,
                (SELECT count(*)::bigint FROM click_events) AS clicks,
                (SELECT avg(click_position)::double precision FROM click_events)
                    AS average_click_position
            FROM data_events;
            """
        )
        search_metrics = cur.fetchone()

        cur.execute(
            """
            SELECT filter_key, count(*)::bigint AS searches
            FROM app.search_event event
            CROSS JOIN LATERAL unnest(event.filter_keys) AS filter_key
            WHERE event.event_type = 'data'
              AND event.observed_at >= current_timestamp - interval '7 days'
            GROUP BY filter_key
            ORDER BY searches DESC, filter_key;
            """
        )
        search_filter_usage = cur.fetchall()

    return {
        "generated_at": datetime.now(timezone.utc),
        "summary": summary,
        "source_summaries": source_summaries,
        "ingestion_runs": ingestion_runs,
        "quality_issues_by_code": quality_issues_by_code,
        "recent_quality_issues": recent_quality_issues,
        "table_stats": table_stats,
        "cache_entries": cache_entries,
        "overview_metadata": cached_overview.get("overview_metadata"),
        "overview_totals": cached_overview.get("overview_totals") or {},
        "search_metrics": search_metrics,
        "search_filter_usage": search_filter_usage,
    }
