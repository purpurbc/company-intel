from __future__ import annotations

import copy
from typing import Any

from worker.database import get_db_connection
from worker.scb.config import PARTITIONS
from worker.scb.constants import SCB_MAX_ROWS_RETURNED
from worker.scb.models.category import Category, SCBCategory
from worker.scb.scb_base_client import SCBClient
from worker.ingest.adapters import api_record
from worker.ingest.raw import archive_api_payloads
from worker.ingest.repository import load_batch
from worker.ingest.overview_cache import (
    invalidate_overview_caches,
    prewarm_overview_caches,
)
from worker.ingest.runs import checkpoint, finish_run, start_run


class SCBCompanyImporter:
    """Stable company import flow that can run against different SCB clients."""

    def __init__(self, client: SCBClient, sni_version: str = 'unknown'):
        self.client = client
        self.sni_version = sni_version

    def within_limits(self, row_count: int) -> bool:
        return row_count <= SCB_MAX_ROWS_RETURNED

    def count_companies(
        self,
        reg_status: str = "1",
        co_status: str = "1",
        categories: list[SCBCategory] | None = None,
    ) -> int:
        try:
            result = self.client._post_Je_RaknaForetag(
                registration_status=reg_status,
                company_status=co_status,
                categories=categories or [],
            )
            print("|", end="")
            return int(result)
        except Exception as exc:
            raise RuntimeError(
                f"SCB count failed: reg_status={reg_status}, "
                f"company_status={co_status}, categories={categories or []}"
            ) from exc

    def _partition(
        self,
        partitions: dict[int, dict[str, Any]],
        level: int = 0,
        reg_status: str = "1",
        co_status: str = "1",
    ):
        success_list = []
        fail_list = []
        zeros_list = []
        insufficient_list = []

        p_dict = partitions.get(level)
        if p_dict is None:
            raise RuntimeError(f"Missing SCB partition level: {level}")

        current_cat: Category = p_dict.get("cat", Category.EMPTY)

        if current_cat == Category.INDUSTRY:
            prev_val = [
                pd["values"][pd.get("active_value", 0)]
                for lvl, pd in partitions.items()
                if lvl == level - 1
            ][0].get("Varde", "")
            current_values = [
                v
                for v in p_dict.get("values", [])
                if v.get("Varde", "").startswith(prev_val)
            ]
        else:
            current_values = p_dict.get("values", []) or []

        print(" " * level + f"======== {current_cat} ==========")

        prev_cats = [pd["cat"] for lvl, pd in partitions.items() if lvl < level]
        prev_vals = [
            pd["values"][pd.get("active_value", 0)]
            for lvl, pd in partitions.items()
            if lvl < level
        ]
        prev_categories = [
            SCBCategory(c, codes=[v.get("Varde")])
            for c, v in zip(prev_cats, prev_vals)
        ]

        next_level = level + 1 if level < max(partitions.keys()) else None

        for vd in current_values:
            categories = prev_categories + [
                SCBCategory(current_cat, codes=[vd.get("Varde")])
            ]
            num_co = self.count_companies(
                reg_status=reg_status,
                co_status=co_status,
                categories=categories,
            )

            p_dict["current_sum"] += num_co if num_co >= 0 else 0
            print(
                " " * level
                + f"{vd.get('Text')}: found {num_co} companies. "
                + f"({p_dict['current_sum']}) [{p_dict['active_value']}]"
            )

            cats = [cat.dict for cat in categories]
            data = {"num_co": num_co, "num_cat": len(cats), "cats": cats}

            if self.within_limits(num_co):
                if num_co < 0:
                    fail_list.append(data)
                elif num_co > 0:
                    success_list.append(data)
                else:
                    zeros_list.append(data)
            elif next_level is not None:
                p_dict["current_sum"] = 0

                s, f, z, i = self._partition(
                    partitions,
                    level=next_level,
                    reg_status=reg_status,
                    co_status=co_status,
                )
                if not s and not f and not z and not i:
                    insufficient_list.append(data)
                else:
                    success_list.extend(s)
                    fail_list.extend(f)
                    zeros_list.extend(z)
                    insufficient_list.extend(i)
            else:
                insufficient_list.append(data)

            p_dict["active_value"] += 1

        p_dict["active_value"] = 0
        p_dict["current_sum"] = 0

        print(
            "\t partitioning done: "
            f"{len(success_list)}, {len(fail_list)}, "
            f"{len(zeros_list)}, {len(insufficient_list)}"
        )

        return success_list, fail_list, zeros_list, insufficient_list

    def _get_company_partitions(
        self,
        reg_status: str = "1",
        co_status: str = "1",
    ):
        cat_tables = self.client._get_Je_KategorierMedKodtabeller()
        partitions = copy.deepcopy(PARTITIONS)

        for p_dict in partitions.values():
            partition_cat = p_dict.get("cat")
            partition_cat_id = (
                partition_cat.value
                if isinstance(partition_cat, Category)
                else str(partition_cat)
            )
            cat_dict = next(
                (
                    ct
                    for ct in cat_tables
                    if ct.get("Id_Kategori_JE") == partition_cat_id
                ),
                None,
            )

            if cat_dict is None:
                raise NameError(f"Partition category {partition_cat_id} does not exist.")

            values = cat_dict.get("VardeLista", [])
            if not values:
                raise RuntimeError(
                    f"No SCB values found for partition category {partition_cat_id}."
                )
            p_dict["values"] = (
                values if not p_dict.get("exclude_first_last") else values[1:-1]
            )

        expected_population = self.count_companies(
            reg_status=reg_status, co_status=co_status, categories=[],
        )
        if expected_population < 0:
            raise RuntimeError('SCB returned an invalid total population count')
        result = self._partition(
            partitions,
            reg_status=reg_status,
            co_status=co_status,
        )
        success, failed, _, insufficient = result
        covered_population = sum(item['num_co'] for item in success)
        if not failed and not insufficient and covered_population != expected_population:
            insufficient.append({
                'num_co': expected_population, 'covered_num_co': covered_population,
                'cats': [], 'reason': 'partition_population_count_mismatch',
            })
        return result

    def _fail_ingestion_run(
        self,
        ingestion_run_id: int | None,
        error: str,
    ) -> None:
        if ingestion_run_id is None:
            return

        try:
            with get_db_connection() as conn:
                finish_run(
                    conn,
                    ingestion_run_id,
                    status="failed",
                    error=error,
                )
                conn.commit()
        except Exception as exc:
            print(f"Failed to mark ingestion_run={ingestion_run_id} as failed: {exc}")

    def seed_all_companies(
        self,
        reg_status: str = "1",
        co_status: str = "1",
    ) -> None:
        ingestion_run_id = None

        try:
            with get_db_connection() as conn:
                ingestion_run_id = start_run(
                    conn,
                    source='scb_api',
                    metadata={'registration_status': reg_status, 'company_status': co_status,
                              'sni_version': self.sni_version},
                )
                conn.commit()

            success_list, fail_list, zeros_list, insufficient_list = (
                self._get_company_partitions(
                    reg_status=reg_status,
                    co_status=co_status,
                )
            )

            if fail_list or insufficient_list:
                raise RuntimeError(
                    "SCB partitioning did not cover the full import: "
                    f"failed_counts={len(fail_list)}, "
                    f"insufficient_partitions={len(insufficient_list)}"
                )

            expected_total = 0
            actual_total = 0
            update_freq = 100
            num_lines = len(success_list)

            for i, data in enumerate(success_list):
                cats = data.get("cats", [])
                expected_num_co = data.get("num_co", -9999)
                categories = [
                    SCBCategory(
                        category=cd.get("Kategori", Category.EMPTY),
                        codes=cd.get("Kod") or [],
                    )
                    for cd in cats
                ]

                raw_rows = self.client._post_Je_HamtaForetag(
                    registration_status=reg_status,
                    company_status=co_status,
                    categories=categories,
                )
                if not isinstance(raw_rows, list):
                    raise RuntimeError(
                        "SCB returned an unexpected company payload: "
                        f"{type(raw_rows).__name__}"
                    )

                num_co = len(raw_rows)
                expected_total += expected_num_co
                actual_total += num_co

                with get_db_connection() as conn:
                    archive_api_payloads(conn, ingestion_run_id, raw_rows, actual_total - num_co + 1)
                    conn.commit()

                if num_co != expected_num_co:
                    raise RuntimeError(
                        f"SCB partition returned {num_co} rows, "
                        f"expected {expected_num_co}, categories={categories}"
                    )

                with get_db_connection() as conn:
                    result = load_batch(
                        conn, 'scb_api', ingestion_run_id,
                        [api_record(row, number, sni_version=self.sni_version)
                         for number, row in enumerate(raw_rows, start=actual_total - num_co + 1)],
                    )
                    checkpoint(conn, ingestion_run_id, actual_total, result)
                    conn.commit()

                if i % update_freq == 0:
                    progress = (i + 1) / num_lines if num_lines else 1
                    print(
                        f"[{i}] ({progress:.1%}) ({i + 1}/{num_lines}) "
                        f"expected: {expected_total} actual: {actual_total} "
                        f"diff: {expected_total - actual_total}"
                    )

            with get_db_connection() as conn:
                finish_run(conn, ingestion_run_id)
                invalidate_overview_caches(conn)
                conn.commit()
            prewarm_overview_caches(get_db_connection)
        except Exception as exc:
            self._fail_ingestion_run(ingestion_run_id, str(exc))
            raise

        print(
            f"DONE: expected: {expected_total} actual: {actual_total} "
            f"diff: {expected_total - actual_total}"
        )
