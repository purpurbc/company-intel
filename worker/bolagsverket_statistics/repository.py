"""Persistence for complete, versioned Bolagsverket statistics snapshots."""

from __future__ import annotations

import math
from dataclasses import dataclass

from psycopg import ClientCursor

from .parser import StatisticsRecord


SOURCE = "bolagsverket_statistics"
DEFAULT_MAX_REMOVAL_FRACTION = 0.05
MIN_REMOVALS_BEFORE_GUARD = 10


@dataclass(frozen=True, slots=True)
class SnapshotResult:
    records_new: int
    records_changed: int
    records_removed: int
    records_unchanged: int
    snapshot_rows: int

    def as_dict(self) -> dict[str, int]:
        return {
            "records_new": self.records_new,
            "records_changed": self.records_changed,
            "records_removed": self.records_removed,
            "records_unchanged": self.records_unchanged,
            "snapshot_rows": self.snapshot_rows,
        }


class SnapshotRemovalError(ValueError):
    """Raised when a snapshot would unexpectedly retire many current rows."""


def stage_statistics_batch(
    conn,
    dataset: str,
    run_id: int,
    records: list[StatisticsRecord],
) -> dict[str, int]:
    """Archive and stage one parsed batch; caller commits it with a checkpoint."""

    if not records:
        return {"records_seen": 0, "records_new": 0, "records_changed": 0}

    params = {"dataset": dataset, "run_id": run_id}
    with ClientCursor(conn) as cursor:
        cursor.execute(
            """
            SELECT source, dataset, status, started_at
            FROM meta.ingestion_run
            WHERE id = %(run_id)s
            FOR UPDATE
            """,
            params,
        )
        run = cursor.fetchone()
        if (
            not run
            or run["source"] != SOURCE
            or run["dataset"] != dataset
            or run["status"] != "running"
        ):
            raise ValueError(
                "Import run is missing, finished, or belongs to another dataset"
            )
        params["observed_at"] = run["started_at"]

        cursor.execute(
            """
            CREATE TEMP TABLE incoming_statistics_record (
                row_number bigint PRIMARY KEY,
                source_file text,
                payload json NOT NULL,
                raw_hash text NOT NULL,
                natural_key jsonb NOT NULL,
                natural_key_hash text NOT NULL,
                data jsonb NOT NULL,
                row_hash text NOT NULL
            ) ON COMMIT DROP
            """
        )
        with cursor.copy("COPY incoming_statistics_record FROM STDIN") as copy:
            for record in records:
                copy.write_row(record.copy_row())
        cursor.execute("ANALYZE incoming_statistics_record")

        cursor.execute(
            """
            SELECT natural_key_hash
            FROM incoming_statistics_record
            GROUP BY natural_key_hash
            HAVING count(*) > 1 OR count(DISTINCT natural_key) > 1
            LIMIT 1
            """
        )
        if cursor.fetchone():
            raise ValueError(
                "The source snapshot contains duplicate or colliding natural keys"
            )

        cursor.execute(
            """
            SELECT incoming.row_number
            FROM incoming_statistics_record incoming
            JOIN raw.statistics_record archived
              ON archived.dataset = %(dataset)s
             AND archived.ingestion_run_id = %(run_id)s
             AND archived.row_number = incoming.row_number
            WHERE archived.raw_hash <> incoming.raw_hash
            LIMIT 1
            """,
            params,
        )
        if cursor.fetchone():
            raise ValueError(
                "A previously archived row changed; start a new ingestion run"
            )

        cursor.execute(
            """
            SELECT incoming.row_number
            FROM incoming_statistics_record incoming
            JOIN src_bolagsverket.statistics_import_stage staged
              ON staged.ingestion_run_id = %(run_id)s
             AND staged.dataset = %(dataset)s
             AND staged.row_number = incoming.row_number
            WHERE staged.natural_key <> incoming.natural_key
               OR staged.row_hash <> incoming.row_hash
            LIMIT 1
            """,
            params,
        )
        if cursor.fetchone():
            raise ValueError(
                "The resumed snapshot conflicts with rows already staged for this run"
            )
        cursor.execute(
            """
            SELECT incoming.row_number
            FROM incoming_statistics_record incoming
            JOIN src_bolagsverket.statistics_import_stage staged
              ON staged.dataset = %(dataset)s
             AND staged.ingestion_run_id = %(run_id)s
             AND staged.natural_key_hash = incoming.natural_key_hash
            WHERE staged.row_number <> incoming.row_number
               OR staged.natural_key <> incoming.natural_key
               OR staged.row_hash <> incoming.row_hash
            LIMIT 1
            """,
            params,
        )
        if cursor.fetchone():
            raise ValueError(
                "The source snapshot repeats a natural key across committed batches"
            )

        cursor.execute(
            """
            INSERT INTO raw.statistics_record(
                ingestion_run_id, dataset, row_number, source_file, payload,
                raw_hash, observed_at
            )
            SELECT
                %(run_id)s, %(dataset)s, row_number, source_file, payload,
                raw_hash, %(observed_at)s
            FROM incoming_statistics_record
            ON CONFLICT DO NOTHING
            """,
            params,
        )
        cursor.execute(
            """
            INSERT INTO src_bolagsverket.statistics_import_stage(
                ingestion_run_id, dataset, row_number,
                natural_key, natural_key_hash, data, row_hash
            )
            SELECT
                %(run_id)s, %(dataset)s, row_number,
                natural_key, natural_key_hash, data, row_hash
            FROM incoming_statistics_record
            ON CONFLICT DO NOTHING
            """,
            params,
        )

        cursor.execute(
            """
            INSERT INTO meta.data_quality_issue(
                ingestion_run_id, row_number, issue_code, detail, observed_at
            )
            SELECT
                %(run_id)s,
                row_number,
                'nul_in_source_text',
                'Escaped NUL retained in immutable raw JSON',
                %(observed_at)s
            FROM incoming_statistics_record
            WHERE position(chr(92) || 'u0000' IN payload::text) > 0
            """,
            params,
        )
        cursor.execute(
            """
            INSERT INTO meta.data_quality_issue(
                ingestion_run_id, row_number, issue_code, detail, observed_at
            )
            SELECT
                %(run_id)s,
                row_number,
                'unmapped_county',
                'Could not map county name ' || (data->>'county_name')
                    || ' to an SCB code',
                %(observed_at)s
            FROM incoming_statistics_record
            WHERE %(dataset)s IN ('representatives', 'filing_delays')
              AND data->>'county_name' IS NOT NULL
              AND data->>'county_code' IS NULL
            """,
            params,
        )
        cursor.execute(
            """
            INSERT INTO meta.data_quality_issue(
                ingestion_run_id, row_number, issue_code, detail, observed_at
            )
            SELECT
                %(run_id)s,
                row_number,
                'unmapped_municipality',
                'Could not map municipality name '
                    || (data->>'municipality_name') || ' to an SCB code',
                %(observed_at)s
            FROM incoming_statistics_record
            WHERE %(dataset)s = 'representatives'
              AND data->>'municipality_name' IS NOT NULL
              AND lower(data->>'municipality_name') <> 'saknas'
              AND data->>'municipality_code' IS NULL
            """,
            params,
        )

    return {
        "records_seen": len(records),
        "records_new": 0,
        "records_changed": 0,
    }


def finalize_statistics_run(
    conn,
    dataset: str,
    run_id: int,
    *,
    allow_large_removal: bool = False,
    max_removal_fraction: float = DEFAULT_MAX_REMOVAL_FRACTION,
) -> SnapshotResult:
    """Atomically merge one complete staged file into SCD2 source history."""

    if not 0 <= max_removal_fraction <= 1:
        raise ValueError("max_removal_fraction must be between 0 and 1")

    params = {"dataset": dataset, "run_id": run_id}
    with ClientCursor(conn) as cursor:
        cursor.execute(
            "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
            (f"{SOURCE}:{dataset}",),
        )
        cursor.execute(
            """
            SELECT source, dataset, status, started_at, records_seen
            FROM meta.ingestion_run
            WHERE id = %(run_id)s
            FOR UPDATE
            """,
            params,
        )
        run = cursor.fetchone()
        if (
            not run
            or run["source"] != SOURCE
            or run["dataset"] != dataset
            or run["status"] != "running"
        ):
            raise ValueError(
                "Import run is missing, finished, or belongs to another dataset"
            )
        params["observed_at"] = run["started_at"]

        cursor.execute(
            """
            SELECT count(*) AS stage_count
            FROM src_bolagsverket.statistics_import_stage
            WHERE ingestion_run_id = %(run_id)s AND dataset = %(dataset)s
            """,
            params,
        )
        stage_count = cursor.fetchone()["stage_count"]
        if stage_count == 0:
            raise ValueError("A statistics snapshot may not be empty")
        if stage_count != run["records_seen"]:
            raise ValueError(
                "The staged row count does not match the committed file checkpoint"
            )

        cursor.execute(
            """
            SELECT max(valid_from) AS latest_observation
            FROM src_bolagsverket.statistics_history
            WHERE dataset = %(dataset)s
            """,
            params,
        )
        latest_observation = cursor.fetchone()["latest_observation"]
        if latest_observation is not None and latest_observation >= run["started_at"]:
            raise ValueError(
                "A newer or equally timed snapshot already exists for this dataset"
            )

        cursor.execute(
            """
            SELECT staged.row_number
            FROM src_bolagsverket.statistics_import_stage staged
            JOIN src_bolagsverket.statistics_history current
              ON current.dataset = staged.dataset
             AND current.natural_key_hash = staged.natural_key_hash
             AND current.valid_to IS NULL
            WHERE staged.ingestion_run_id = %(run_id)s
              AND staged.dataset = %(dataset)s
              AND current.natural_key <> staged.natural_key
            LIMIT 1
            """,
            params,
        )
        if cursor.fetchone():
            raise ValueError("Natural-key SHA-256 collision detected")

        cursor.execute(
            """
            SELECT staged.row_number
            FROM src_bolagsverket.statistics_import_stage staged
            JOIN src_bolagsverket.statistics_history current
              ON current.dataset = staged.dataset
             AND current.natural_key_hash = staged.natural_key_hash
             AND current.natural_key = staged.natural_key
             AND current.valid_to IS NULL
            WHERE staged.ingestion_run_id = %(run_id)s
              AND staged.dataset = %(dataset)s
              AND current.row_hash = staged.row_hash
              AND current.data <> staged.data
            LIMIT 1
            """,
            params,
        )
        if cursor.fetchone():
            raise ValueError("Row SHA-256 collision detected")

        cursor.execute(
            """
            CREATE TEMP TABLE incoming_statistics_snapshot ON COMMIT DROP AS
            SELECT
                staged.row_number,
                staged.natural_key,
                staged.natural_key_hash,
                staged.data,
                staged.row_hash,
                current.id AS previous_id,
                current.row_hash AS previous_hash
            FROM src_bolagsverket.statistics_import_stage staged
            LEFT JOIN src_bolagsverket.statistics_history current
              ON current.dataset = staged.dataset
             AND current.natural_key_hash = staged.natural_key_hash
             AND current.natural_key = staged.natural_key
             AND current.valid_to IS NULL
            WHERE staged.ingestion_run_id = %(run_id)s
              AND staged.dataset = %(dataset)s;

            CREATE UNIQUE INDEX ON incoming_statistics_snapshot(natural_key_hash);
            ANALYZE incoming_statistics_snapshot;

            CREATE TEMP TABLE removed_statistics_snapshot ON COMMIT DROP AS
            SELECT current.id
            FROM src_bolagsverket.statistics_history current
            LEFT JOIN incoming_statistics_snapshot incoming
              ON incoming.natural_key_hash = current.natural_key_hash
             AND incoming.natural_key = current.natural_key
            WHERE current.dataset = %(dataset)s
              AND current.valid_to IS NULL
              AND incoming.natural_key_hash IS NULL;

            CREATE UNIQUE INDEX ON removed_statistics_snapshot(id);
            ANALYZE removed_statistics_snapshot;
            """,
            params,
        )
        cursor.execute(
            """
            SELECT
                count(*) FILTER (WHERE previous_id IS NULL) AS records_new,
                count(*) FILTER (
                    WHERE previous_id IS NOT NULL AND row_hash <> previous_hash
                ) AS records_changed,
                count(*) FILTER (
                    WHERE previous_id IS NOT NULL AND row_hash = previous_hash
                ) AS records_unchanged
            FROM incoming_statistics_snapshot
            """
        )
        counts = cursor.fetchone()
        cursor.execute("SELECT count(*) AS n FROM removed_statistics_snapshot")
        removed_count = cursor.fetchone()["n"]
        current_count = (
            counts["records_changed"]
            + counts["records_unchanged"]
            + removed_count
        )
        allowed_removals = max(
            MIN_REMOVALS_BEFORE_GUARD,
            math.ceil(current_count * max_removal_fraction),
        )
        if (
            not allow_large_removal
            and current_count > 0
            and removed_count > allowed_removals
        ):
            raise SnapshotRemovalError(
                f"Snapshot would retire {removed_count:,} of {current_count:,} "
                f"current rows; rerun with explicit approval after verifying the file"
            )

        cursor.execute(
            """
            UPDATE src_bolagsverket.statistics_history current
            SET valid_to = %(observed_at)s
            FROM incoming_statistics_snapshot incoming
            WHERE current.id = incoming.previous_id
              AND incoming.row_hash <> incoming.previous_hash;

            UPDATE src_bolagsverket.statistics_history current
            SET valid_to = %(observed_at)s
            FROM removed_statistics_snapshot removed
            WHERE current.id = removed.id;

            INSERT INTO src_bolagsverket.statistics_history(
                dataset, natural_key, natural_key_hash, data, row_hash,
                valid_from, first_ingestion_run_id, last_ingestion_run_id,
                first_row_number, last_row_number
            )
            SELECT
                %(dataset)s,
                incoming.natural_key,
                incoming.natural_key_hash,
                incoming.data,
                incoming.row_hash,
                %(observed_at)s,
                %(run_id)s,
                %(run_id)s,
                incoming.row_number,
                incoming.row_number
            FROM incoming_statistics_snapshot incoming
            WHERE incoming.previous_id IS NULL
               OR incoming.row_hash <> incoming.previous_hash;

            UPDATE src_bolagsverket.statistics_history current
            SET
                last_ingestion_run_id = %(run_id)s,
                last_row_number = incoming.row_number
            FROM incoming_statistics_snapshot incoming
            WHERE current.id = incoming.previous_id
              AND incoming.row_hash = incoming.previous_hash;

            UPDATE meta.ingestion_run
            SET
                records_new = %(records_new)s,
                records_changed = %(records_changed_total)s,
                metadata = metadata || jsonb_build_object(
                    'snapshot_rows', %(snapshot_rows)s,
                    'records_removed', %(records_removed)s,
                    'records_unchanged', %(records_unchanged)s
                )
            WHERE id = %(run_id)s;

            DELETE FROM src_bolagsverket.statistics_import_stage
            WHERE ingestion_run_id = %(run_id)s AND dataset = %(dataset)s;
            """,
            params
            | {
                "records_new": counts["records_new"],
                "records_changed_total": (
                    counts["records_changed"] + removed_count
                ),
                "snapshot_rows": stage_count,
                "records_removed": removed_count,
                "records_unchanged": counts["records_unchanged"],
            },
        )

        # The product page reads compact national summaries. Refresh only the
        # materialized mart owned by the dataset being published, inside the
        # same transaction so current source rows and summaries stay aligned.
        if dataset == "companies":
            cursor.execute(
                "REFRESH MATERIALIZED VIEW "
                "mart.bolagsverket_company_statistics_monthly"
            )
        elif dataset == "representatives":
            cursor.execute(
                "REFRESH MATERIALIZED VIEW "
                "mart.bolagsverket_representative_statistics_yearly"
            )

    return SnapshotResult(
        records_new=counts["records_new"],
        records_changed=counts["records_changed"],
        records_removed=removed_count,
        records_unchanged=counts["records_unchanged"],
        snapshot_rows=stage_count,
    )
