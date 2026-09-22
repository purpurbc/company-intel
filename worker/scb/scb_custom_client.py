from __future__ import annotations

from typing import Any

from worker.scb.models.category import Category, SCBCategory
from worker.scb.models.company import CompanyJE
from worker.scb.models.variable import Operator, Variable
from worker.scb.scb_base_client import LegacyCertScbClient
from worker.scb.utils.client_config import SCBClientConfig


def valid_operator(operator: Operator | str) -> bool:
    try:
        return Operator(operator) != Operator.EMPTY
    except ValueError:
        return False


class SCBCustomClient(LegacyCertScbClient):
    """Compatibility helper around the legacy certificate SCB client."""

    def __init__(self, cfg: SCBClientConfig | None = None):
        super().__init__(cfg)

    def get_companies_by_name(
        self,
        name: str,
        operator: Operator = Operator.STARTS_WITH,
    ) -> list[CompanyJE] | None:
        if not valid_operator(operator):
            return None

        rows = self._post_Je_HamtaForetag(
            variables=[
                Variable(
                    variable="Namn",
                    operator=operator,
                    val_1=name,
                )
            ]
        )
        return [CompanyJE.from_scb(c) for c in rows]

    def get_companies_by_orgnr(
        self,
        orgnr: str,
        operator: Operator = Operator.EQUAL,
    ) -> list[CompanyJE] | None:
        if not valid_operator(operator):
            return None

        rows = self._post_Je_HamtaForetag(
            variables=[
                Variable(
                    variable="OrgNr (10 siffror)",
                    operator=operator,
                    val_1=orgnr,
                )
            ]
        )
        return [CompanyJE.from_scb(c) for c in rows]

    def count_companies_municipality(self, municipality_codes: list[str]) -> int:
        return int(
            self._post_Je_RaknaForetag(
                categories=[
                    SCBCategory(
                        category=Category.SEAT_MUNICIPALITY,
                        codes=municipality_codes,
                    )
                ]
            )
        )

    def count_companies_county(self, county_codes: list[str]) -> int:
        return int(
            self._post_Je_RaknaForetag(
                categories=[
                    SCBCategory(
                        category=Category.SEAT_COUNTY,
                        codes=county_codes,
                    )
                ]
            )
        )

    def Je_count(
        self,
        reg_status: str = "1",
        co_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> int:
        try:
            result = self._post_Je_RaknaForetag(
                registration_status=reg_status,
                company_status=co_status,
                variables=variables or [],
                categories=categories or [],
            )
            print("|", end="")
            return int(result)
        except Exception as exc:
            raise RuntimeError(
                f"SCB count failed: {reg_status} {co_status} "
                f"{variables or []} {categories or []}"
            ) from exc

    def seed_all_companies(
        self,
        reg_status: str = "1",
        co_status: str = "1",
    ) -> Any:
        from worker.scb.company_importer import SCBCompanyImporter

        return SCBCompanyImporter(self).seed_all_companies(
            reg_status=reg_status,
            co_status=co_status,
        )
