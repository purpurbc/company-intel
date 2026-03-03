from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any, Dict, Optional


def strip_str(v: Any) -> Any:
    if isinstance(v, str):
        return v.strip()
    return v


def none_if(v: Any, none_values : dict | list = (None, "", "*")) -> Optional[str]:
    v = strip_str(v)
    if v in none_values:
        return None
    return v


def to_int(v: Any, none_values : dict | list = (None, "", "*")) -> Optional[int]:
    v = strip_str(v)
    if v in none_values:
        return None
    try:
        return int(v)
    except ValueError:
        return None


def to_date(v: Any, none_values : dict | list = (None, "", "*")) -> Optional[date]:
    v = strip_str(v)
    if v in none_values:
        return None
    try:
        y, m, d = v.split("-")
        return date(int(y), int(m), int(d))
    except Exception:
        return None


@dataclass(frozen=True)
class CompanyJE:
    # Identifiers
    pe_org_nr: str                          # SCB: "PeOrgNr"
    org_nr: str                             # SCB: "OrgNr"

    # Name & address
    company_name: str                       # SCB: "Företagsnamn"
    co_address: Optional[str]               # SCB: "COAdress"
    post_address: Optional[str]             # SCB: "PostAdress"
    post_nr: Optional[str]                  # SCB: "PostNr"
    post_ort: Optional[str]                 # SCB: "PostOrt"

    # Seat / region
    seat_municipality_code: Optional[str]   # SCB: "Säteskommun, kod"
    seat_municipality: Optional[str]        # SCB: "Säteskommun"
    seat_county_code: Optional[str]         # SCB: "Säteslän, kod"
    seat_county: Optional[str]              # SCB: "Säteslän"
    aregion_code: Optional[str]             # SCB: "Aregion, kod"
    aregion: Optional[str]                  # SCB: "ARegion"

    # Size / status
    num_workplaces: Optional[int]           # SCB: "Antal arbetsställen"
    size_class_code: Optional[str]          # SCB: "Stkl, kod"
    size_class: Optional[str]               # SCB: "Storleksklass"
    company_status_code: Optional[str]      # SCB: "Företagsstatus, kod"
    company_status: Optional[str]           # SCB: "Företagsstatus"
    skv_registered_code: Optional[str]      # SCB: "Registrerad hos SKV, kod"
    skv_registered: Optional[str]           # SCB: "Registrerad hos SKV"

    # Legal
    legal_form_code: Optional[str]          # SCB: "Juridisk form, kod"
    legal_form: Optional[str]               # SCB: "Juridisk form"

    # Marketing / mailability
    reklam_code: Optional[str]             # SCB: "Reklam, kod"
    reklam: Optional[str]                  # SCB: "Reklam"
    utskick_code: Optional[str]             # SCB: "Utskick, kod"
    utskick: Optional[str]                  # SCB: "Utskick"

    # Dates
    start_date: Optional[date]              # SCB: "Startdatum"
    end_date: Optional[date]                # SCB: "Slutdatum"
    registration_date: Optional[date]       # SCB: "Registreringsdatum"

    # Industry (SNI)
    bransch_1_code: Optional[str]           # SCB: "Bransch_1, kod"
    bransch_1p_code: Optional[str]          # SCB: "Bransch_1P, kod"
    bransch_1: Optional[str]                # SCB: "Bransch_1"
    avdelning_1_code: Optional[str]         # SCB: "Avdelning_1, kod"
    avdelning_1: Optional[str]              # SCB: "Avdelning_1"

    # Trade marker
    export_import_mark: Optional[str]       # SCB: "Export/Importmarkering"

    # Turnover classes
    turnover_year: Optional[int]            # SCB: "Omsättning, år"
    turnover_size_code: Optional[str]       # SCB: "Stkl, oms, kod"
    turnover_size: Optional[str]            # SCB: "Storleksklass, oms"
    turnover_fin_size_code: Optional[str]   # SCB: "Stkl Fin, oms, kod"
    turnover_fin_size: Optional[str]        # SCB: "Storleksklass Fin, oms"

    # Ownership
    owner_category_code: Optional[str]      # SCB: "Ägarkategori, kod"
    owner_category: Optional[str]           # SCB: "Ägarkategori"

    # Contact
    phone: Optional[str]                    # SCB: "Telefon"
    email: Optional[str]                    # SCB: "E-post"

    # Private/Public
    private_public_code: Optional[str]      # SCB: "Privat/Publikt, kod"
    private_public: Optional[str]           # SCB: "Privat/Publikt"

    # Tax statuses
    employer_status_code: Optional[str]     # SCB: "Arbetsgivarstatus, kod"
    employer_status: Optional[str]          # SCB: "Arbetsgivarstatus"
    vat_status_code: Optional[str]          # SCB: "Momsstatus, kod"
    vat_status: Optional[str]               # SCB: "Momsstatus"
    f_tax_status_code: Optional[str]        # SCB: "Fskattstatus, kod"
    f_tax_status: Optional[str]             # SCB: "Fskattstatus"

    # Company state (Bolagsstatus)
    company_state_code: Optional[str]       # SCB: "Bolagsstatus, kod"
    company_state: Optional[str]            # SCB: "Bolagsstatus"

    # Firms / sector / SME
    num_firms: Optional[int]                # SCB: "Antal firmor"
    firma: Optional[str]                    # SCB: "Firma"
    sector_code: Optional[str]              # SCB: "Sektor, kod"
    sector: Optional[str]                   # SCB: "Sektor"
    sme_size_code: Optional[str]            # SCB: "Stkl SME, kod"
    sme_size: Optional[str]                 # SCB: "Storleksklass SME"

    # Gender / foreign ownership
    female_share: Optional[str]             # SCB: "Andel kvinna"
    male_share: Optional[str]               # SCB: "Andel man"
    owner_country_code: Optional[str]       # SCB: "Ägarland, kod"
    owner_country: Optional[str]            # SCB: "Ägarland"
    owner_name: Optional[str]               # SCB: "Ägarnamn"
    foreign_ownership_code: Optional[str]   # SCB: "Utländskt ägande, kod"
    foreign_ownership: Optional[str]        # SCB: "Utländskt ägande"

    @staticmethod
    def from_scb(d: Dict[str, Any]) -> "CompanyJE":
        return CompanyJE(
            pe_org_nr=strip_str(d.get("PeOrgNr", "")),
            org_nr=strip_str(d.get("OrgNr", "")),

            company_name=strip_str(d.get("Företagsnamn", "")),
            co_address=none_if(d.get("COAdress")),
            post_address=none_if(d.get("PostAdress")),
            post_nr=none_if(d.get("PostNr")),
            post_ort=none_if(d.get("PostOrt")),

            seat_municipality_code=none_if(d.get("Säteskommun, kod")),
            seat_municipality=none_if(d.get("Säteskommun")),
            seat_county_code=none_if(d.get("Säteslän, kod")),
            seat_county=none_if(d.get("Säteslän")),
            aregion_code=none_if(d.get("Aregion, kod")),
            aregion=none_if(d.get("ARegion")),

            num_workplaces=to_int(d.get("Antal arbetsställen")),
            size_class_code=none_if(d.get("Stkl, kod")),
            size_class=none_if(d.get("Storleksklass")),
            company_status_code=none_if(d.get("Företagsstatus, kod")),
            company_status=none_if(d.get("Företagsstatus")),
            skv_registered_code=none_if(d.get("Registrerad hos SKV, kod")),
            skv_registered=none_if(d.get("Registrerad hos SKV")),

            legal_form_code=none_if(d.get("Juridisk form, kod")),
            legal_form=none_if(d.get("Juridisk form")),

            reklam_code=none_if(d.get("Reklam, kod")),
            reklam=none_if(d.get("Reklam")),
            utskick_code=none_if(d.get("Utskick, kod")),
            utskick=none_if(d.get("Utskick")),

            start_date=to_date(d.get("Startdatum")),
            end_date=to_date(d.get("Slutdatum")),
            registration_date=to_date(d.get("Registreringsdatum")),

            bransch_1_code=none_if(d.get("Bransch_1, kod")),
            bransch_1p_code=none_if(d.get("Bransch_1P, kod")),
            bransch_1=none_if(d.get("Bransch_1")),
            avdelning_1_code=none_if(d.get("Avdelning_1, kod")),
            avdelning_1=none_if(d.get("Avdelning_1")),

            export_import_mark=none_if(d.get("Export/Importmarkering")),

            turnover_year=to_int(d.get("Omsättning, år")),
            turnover_size_code=none_if(d.get("Stkl, oms, kod")),
            turnover_size=none_if(d.get("Storleksklass, oms")),
            turnover_fin_size_code=none_if(d.get("Stkl Fin, oms, kod")),
            turnover_fin_size=none_if(d.get("Storleksklass Fin, oms")),

            owner_category_code=none_if(d.get("Ägarkategori, kod")),
            owner_category=none_if(d.get("Ägarkategori")),

            phone=none_if(d.get("Telefon")),
            email=none_if(d.get("E-post")),

            private_public_code=none_if(d.get("Privat/Publikt, kod")),
            private_public=none_if(d.get("Privat/Publikt")),

            employer_status_code=none_if(d.get("Arbetsgivarstatus, kod")),
            employer_status=none_if(d.get("Arbetsgivarstatus")),
            vat_status_code=none_if(d.get("Momsstatus, kod")),
            vat_status=none_if(d.get("Momsstatus")),
            f_tax_status_code=none_if(d.get("Fskattstatus, kod")),
            f_tax_status=none_if(d.get("Fskattstatus")),

            company_state_code=none_if(d.get("Bolagsstatus, kod")),
            company_state=none_if(d.get("Bolagsstatus")),

            num_firms=to_int(d.get("Antal firmor")),
            firma=none_if(d.get("Firma")),
            sector_code=none_if(d.get("Sektor, kod")),
            sector=none_if(d.get("Sektor")),
            sme_size_code=none_if(d.get("Stkl SME, kod")),
            sme_size=none_if(d.get("Storleksklass SME")),

            female_share=none_if(d.get("Andel kvinna")),
            male_share=none_if(d.get("Andel man")),
            owner_country_code=none_if(d.get("Ägarland, kod")),
            owner_country=none_if(d.get("Ägarland")),
            owner_name=none_if(d.get("Ägarnamn")),
            foreign_ownership_code=none_if(d.get("Utländskt ägande, kod")),
            foreign_ownership=none_if(d.get("Utländskt ägande")),
        )
