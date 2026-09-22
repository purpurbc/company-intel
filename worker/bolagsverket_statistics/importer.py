"""Streaming import orchestration for Bolagsverket aggregate statistics."""

from __future__ import annotations

import hashlib
import time
from pathlib import Path

from worker.bulk_files.parser import iter_delimited_rows
from worker.ingest.overview_cache import (
    invalidate_overview_caches,
    prewarm_overview_caches,
)
from worker.ingest.runs import checkpoint, finish_run, resume_or_start

from .catalog import DATASETS
from .parser import StatisticsRecord, parse_statistics_row
from .repository import SOURCE, finalize_statistics_run, stage_statistics_batch


ADAPTER_VERSIONS = {
    "companies": 1,
    "representatives": 3,
    "auditor_reservations": 2,
    "filing_delays": 2,
}


def file_checksum(path: Path) -> str:
    """Return a streaming SHA-256 without loading a national file into memory."""

    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


class BolagsverketStatisticsImporter:
    """Import complete CSV snapshots through durable stage into SCD2 history."""

    def __init__(self, *, batch_size: int = 20_000, progress_every: int = 10_000):
        if batch_size < 1 or progress_every < 1:
            raise ValueError("batch_size and progress_every must be positive")
        self.batch_size = batch_size
        self.progress_every = progress_every

    def import_file(
        self,
        dataset_key: str,
        path: str | Path,
        *,
        resume: bool = True,
        allow_large_removal: bool = False,
    ) -> dict[str, int]:
        try:
            dataset = DATASETS[dataset_key]
        except KeyError as error:
            raise ValueError(f"Unknown statistics dataset {dataset_key!r}") from error

        local_path = Path(path)
        if not local_path.is_file():
            raise FileNotFoundError(local_path)

        from worker.database import get_db_connection

        adapter_version = ADAPTER_VERSIONS[dataset_key]
        checksum = file_checksum(local_path)
        metadata = {
            "adapter_version": adapter_version,
            "delimiter": dataset.delimiter,
            "source_url": dataset.url,
        }
        lock_key = f"{SOURCE}:{dataset_key}:{checksum}:{adapter_version}"
        run_id: int | None = None
        started = time.monotonic()

        with get_db_connection() as conn:
            locked = conn.execute(
                "SELECT pg_try_advisory_lock(hashtextextended(%s, 0)) AS locked",
                (lock_key,),
            ).fetchone()["locked"]
            if not locked:
                raise RuntimeError("This exact statistics file import is already running")

            try:
                run_id, skipped_through, done = resume_or_start(
                    conn,
                    SOURCE,
                    dataset=dataset_key,
                    filename=local_path.name,
                    checksum=checksum,
                    metadata=metadata,
                    resume=resume,
                )
                conn.commit()

                run_state = conn.execute(
                    """
                    SELECT records_seen, records_new, records_changed, metadata
                    FROM meta.ingestion_run
                    WHERE id = %s
                    """,
                    (run_id,),
                ).fetchone()
                if done:
                    print(
                        f"Run {run_id}: this exact {dataset_key} snapshot is complete.",
                        flush=True,
                    )
                    return self._stored_result(run_state)

                print(
                    f"Run {run_id}: {dataset_key}, resume after source row "
                    f"{skipped_through:,}, batch={self.batch_size:,}",
                    flush=True,
                )
                records_seen = run_state["records_seen"]
                batch = []
                last_row = skipped_through

                for source_row in iter_delimited_rows(
                    local_path,
                    delimiter=dataset.delimiter,
                    skip_source_rows_through=skipped_through,
                    required_headers=set(dataset.required_headers),
                ):
                    last_row = source_row.source_row_number
                    batch.append(parse_statistics_row(dataset_key, source_row))

                    parsed_count = records_seen + len(batch)
                    if parsed_count % self.progress_every == 0:
                        elapsed = max(time.monotonic() - started, 0.001)
                        print(
                            f"{dataset_key}: parsed={parsed_count:,}, "
                            f"source_row={last_row:,}, elapsed={elapsed:.0f}s",
                            flush=True,
                        )
                    if len(batch) >= self.batch_size:
                        records_seen += self._commit_stage(
                            conn, dataset_key, run_id, batch, last_row
                        )
                        batch = []

                if batch:
                    records_seen += self._commit_stage(
                        conn, dataset_key, run_id, batch, last_row
                    )

                print(
                    f"{dataset_key}: publishing {records_seen:,} staged rows...",
                    flush=True,
                )
                snapshot = finalize_statistics_run(
                    conn,
                    dataset_key,
                    run_id,
                    allow_large_removal=allow_large_removal,
                )
                finish_run(conn, run_id)
                invalidate_overview_caches(conn)
                conn.commit()
                prewarm_overview_caches(get_db_connection)
                result = {"records_seen": records_seen} | snapshot.as_dict()
                print(
                    f"{dataset_key}: done in {time.monotonic() - started:.1f}s "
                    f"(new={snapshot.records_new:,}, "
                    f"changed={snapshot.records_changed:,}, "
                    f"removed={snapshot.records_removed:,})",
                    flush=True,
                )
                return result
            except BaseException as error:
                conn.rollback()
                if run_id is not None:
                    finish_run(
                        conn,
                        run_id,
                        status=(
                            "interrupted"
                            if isinstance(error, KeyboardInterrupt)
                            else "failed"
                        ),
                        error=str(error)[:2000],
                    )
                    conn.commit()
                raise
            finally:
                conn.execute(
                    "SELECT pg_advisory_unlock(hashtextextended(%s, 0))",
                    (lock_key,),
                )
                conn.commit()

    @staticmethod
    def _commit_stage(
        conn,
        dataset_key: str,
        run_id: int,
        batch: list[StatisticsRecord],
        last_row: int,
    ) -> int:
        result = stage_statistics_batch(conn, dataset_key, run_id, batch)
        checkpoint(conn, run_id, last_row, result)
        conn.commit()
        return result["records_seen"]

    @staticmethod
    def _stored_result(run_state: dict) -> dict[str, int]:
        metadata = run_state["metadata"] or {}
        return {
            "records_seen": run_state["records_seen"],
            "records_new": run_state["records_new"],
            # The run column includes retired keys for operational accounting.
            "records_changed": max(
                0,
                run_state["records_changed"]
                - int(metadata.get("records_removed", 0)),
            ),
            "records_removed": int(metadata.get("records_removed", 0)),
            "records_unchanged": int(metadata.get("records_unchanged", 0)),
            "snapshot_rows": int(
                metadata.get("snapshot_rows", run_state["records_seen"])
            ),
        }
