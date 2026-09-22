from __future__ import annotations

import time
from typing import Any, Optional

from worker.scb.constants import SCB_AE_API, SCB_JE_API, SCB_MAX_ROWS_RETURNED
from worker.scb.models.category import Category, SCBCategory
from worker.scb.models.variable import Variable
from worker.scb.utils.client_config import SCBClientConfig


class SCBRequestError(RuntimeError):
    """Raised when SCB cannot be reached or returns an unusable response."""


def _pkcs12_get(*args, **kwargs):
    try:
        from requests_pkcs12 import get
    except ModuleNotFoundError as exc:
        raise SCBRequestError(
            "requests_pkcs12 is required for the legacy certificate SCB client."
        ) from exc

    return get(*args, **kwargs)


def _pkcs12_post(*args, **kwargs):
    try:
        from requests_pkcs12 import post
    except ModuleNotFoundError as exc:
        raise SCBRequestError(
            "requests_pkcs12 is required for the legacy certificate SCB client."
        ) from exc

    return post(*args, **kwargs)


class SCBClient:
    """Transport-independent SokPaVar client.

    Endpoint methods live here so the importer can stay stable when SCB moves
    from certificate auth to API-key auth.
    """

    def __init__(self, cfg: SCBClientConfig | None = None):
        self.cfg = cfg or SCBClientConfig.default()

    @property
    def base_url(self) -> str:
        return self.cfg.base_url

    @property
    def api_id(self) -> str:
        return self.cfg.api_id

    @property
    def api_key(self) -> str:
        return self.cfg.api_key

    @property
    def pfx_path(self) -> str:
        return self.cfg.pfx_path

    @property
    def pfx_password(self) -> str:
        return self.cfg.pfx_password

    @property
    def timeout_s(self) -> int:
        return self.cfg.timeout_s

    def _url(self, path: str) -> str:
        return self.cfg.base_url.rstrip("/") + "/" + path.lstrip("/")

    def get(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        raise NotImplementedError

    def post(
        self,
        path: str,
        json_body: dict[str, Any],
        max_failures: int = 15,
        fail_sleep: float = 2.0,
    ) -> Any:
        raise NotImplementedError

    def within_limits_Ae(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> bool:
        n = self._post_Ae_RaknaArbetsstallen(status, variables, categories)

        if n > SCB_MAX_ROWS_RETURNED:
            raise ValueError(
                f"Query would return {n} rows (> {SCB_MAX_ROWS_RETURNED}). "
                "Add more filters (kommun/lan/bransch/anstallda/omsattning) or partition."
            )
        return True

    def _get_Ae_KategorierMedKodtabeller(self) -> Any:
        return self.get(f"{SCB_AE_API}KategorierMedKodtabeller")

    def _get_Ae_KoptaKategorier(self) -> Any:
        return self.get(f"{SCB_AE_API}KoptaKategorier")

    def _get_Ae_Variabler(self) -> Any:
        return self.get(f"{SCB_AE_API}Variabler")

    def _get_Ae_KoptaVariabler(self) -> Any:
        return self.get(f"{SCB_AE_API}KoptaVariabler")

    def _post_Ae_Kodtabell(self, category: str) -> Any:
        payload = {"Kategori": f"{category}"}
        return self.post(f"{SCB_AE_API}Kodtabell", payload)

    def _generic_post_Ae(
        self,
        name: str,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
        check_limits: bool = True,
    ) -> Any:
        variables = variables or []
        categories = categories or []

        if check_limits and not self.within_limits_Ae(status, variables, categories):
            return None

        payload = {
            "Arbetsställestatus": status,
            "Variabler": [v.dict for v in variables],
            "Kategorier": [c.dict for c in categories],
        }

        return self.post(f"{SCB_AE_API}{name}", payload)

    def _post_Ae_RaknaArbetsstallen(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Ae(
            "RaknaArbetsstallen",
            status,
            variables,
            categories,
            check_limits=False,
        )

    def _post_Ae_HamtaArbetsstallen(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Ae("HamtaArbetsstallen", status, variables, categories)

    def _post_Ae_HamtaArbetsstallenXML(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Ae("HamtaArbetsstallenXML", status, variables, categories)

    def _post_Ae_HamtaFirmor(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Ae("HamtaFirmor", status, variables, categories)

    def _post_Ae_HamtaFirmorXML(
        self,
        status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Ae("HamtaFirmorXML", status, variables, categories)

    def within_limits_Je(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> bool:
        n = self._post_Je_RaknaForetag(
            registration_status,
            company_status,
            variables,
            categories,
        )
        if n > SCB_MAX_ROWS_RETURNED:
            raise ValueError(
                f"Query would return {n} rows (> {SCB_MAX_ROWS_RETURNED}). "
                "Add more filters (kommun/lan/bransch/anstallda/omsattning) or partition."
            )
        return True

    def _get_Je_KategorierMedKodtabeller(self) -> Any:
        return self.get(f"{SCB_JE_API}KategorierMedKodtabeller")

    def _get_Je_KoptaKategorier(self) -> Any:
        return self.get(f"{SCB_JE_API}KoptaKategorier")

    def _get_Je_Variabler(self) -> Any:
        return self.get(f"{SCB_JE_API}Variabler")

    def _get_Je_KoptaVariabler(self) -> Any:
        return self.get(f"{SCB_JE_API}KoptaVariabler")

    def _get_Je_SektorFil(self) -> Any:
        raise NotImplementedError

    def _post_Je_Kodtabell(self, category: str) -> Any:
        payload = {"Kategori": f"{category}"}
        return self.post(f"{SCB_JE_API}Kodtabell", payload)

    def _generic_post_Je(
        self,
        name: str,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
        check_limits: bool = True,
    ) -> Any:
        variables = variables or []
        categories = categories or []

        if check_limits and not self.within_limits_Je(
            registration_status,
            company_status,
            variables,
            categories,
        ):
            return None

        payload = {
            "Registreringsstatus": registration_status,
            "Företagsstatus": company_status,
            "Variabler": [v.dict for v in variables],
            "Kategorier": [c.dict for c in categories],
        }

        return self.post(f"{SCB_JE_API}{name}", payload)

    def _post_Je_RaknaForetag(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Je(
            "RaknaForetag",
            registration_status,
            company_status,
            variables,
            categories,
            check_limits=False,
        )

    def _post_Je_HamtaForetag(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Je(
            "HamtaForetag",
            registration_status,
            company_status,
            variables,
            categories,
        )

    def _post_Je_HamtaForetagXML(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Je(
            "HamtaForetagXML",
            registration_status,
            company_status,
            variables,
            categories,
        )

    def _post_Je_HamtaFirmor(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Je(
            "HamtaFirmor",
            registration_status,
            company_status,
            variables,
            categories,
        )

    def _post_Je_HamtaFirmorXML(
        self,
        registration_status: str = "1",
        company_status: str = "1",
        variables: list[Variable] | None = None,
        categories: list[SCBCategory] | None = None,
    ) -> Any:
        return self._generic_post_Je(
            "HamtaFirmorXML",
            registration_status,
            company_status,
            variables,
            categories,
        )

    def get_category_codes(self, cat: Category | str, cat_tables: Any = None):
        if cat_tables is None:
            cat_tables = self._get_Je_KategorierMedKodtabeller()

        category_id = cat.value if isinstance(cat, Category) else str(cat)
        cat_dict = next(
            (ct for ct in cat_tables if ct.get("Id_Kategori_JE") == category_id),
            None,
        )

        if cat_dict is None:
            raise NameError(f"Category {category_id} does not exist.")

        value_list = cat_dict.get("VardeLista", [])
        labels = [v.get("Text") for v in value_list]
        values = [v.get("Varde") for v in value_list]

        return values, labels


class LegacyCertScbClient(SCBClient):
    """Current SCB client using the certificate based SokPaVar API."""

    def get(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        url = self._url(path)
        resp = _pkcs12_get(
            url,
            pkcs12_filename=self.cfg.pfx_path,
            pkcs12_password=self.cfg.pfx_password,
            params=params,
            timeout=self.cfg.timeout_s,
        )
        resp.raise_for_status()
        return resp.json()

    def post(
        self,
        path: str,
        json_body: dict[str, Any],
        max_failures: int = 15,
        fail_sleep: float = 2.0,
    ) -> Any:
        url = self._url(path)
        sleep = fail_sleep
        last_exception: Exception | None = None
        last_response = None

        for attempt in range(1, max_failures + 1):
            try:
                resp = _pkcs12_post(
                    url,
                    pkcs12_filename=self.cfg.pfx_path,
                    pkcs12_password=self.cfg.pfx_password,
                    json=json_body,
                    timeout=self.cfg.timeout_s,
                )
                last_response = resp
                if resp.ok:
                    return resp.json()

                print(
                    "SCB POST failed "
                    f"status={resp.status_code} attempt={attempt}/{max_failures}"
                )
            except Exception as exc:
                last_exception = exc
                print(
                    "SCB POST raised "
                    f"{exc.__class__.__name__} attempt={attempt}/{max_failures}: {exc}"
                )

            if attempt < max_failures:
                time.sleep(sleep)
                sleep += fail_sleep

        if last_response is not None:
            body = getattr(last_response, "text", "")
            status_code = getattr(last_response, "status_code", "unknown")
            raise SCBRequestError(
                f"SCB POST failed after {max_failures} attempts: "
                f"status={status_code}, response={body[:500]}"
            )

        raise SCBRequestError(
            f"SCB POST failed after {max_failures} attempts without a response."
        ) from last_exception


class ApiKeyScbClient(SCBClient):
    """Placeholder for the new SCB API-key based API announced for September 2026."""

    def get(self, path: str, params: Optional[dict[str, Any]] = None) -> Any:
        raise NotImplementedError(
            "SCB API-key client is not implemented yet. Await SCB's new endpoint, "
            "header, pagination, and post description details."
        )

    def post(
        self,
        path: str,
        json_body: dict[str, Any],
        max_failures: int = 15,
        fail_sleep: float = 2.0,
    ) -> Any:
        raise NotImplementedError(
            "SCB API-key client is not implemented yet. Await SCB's new endpoint, "
            "header, pagination, and post description details."
        )
