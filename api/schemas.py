from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


SearchBy = Literal["all", "company_name", "org_nr"]
NameSort = Literal["asc", "desc"]
MetricSort = Literal[
    "none",
    "turnover_asc",
    "turnover_desc",
    "size_asc",
    "size_desc",
]
EntityType = Literal["organization", "person", "other"]


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class HealthResponse(ApiModel):
    ok: bool
    event_contract_version: Literal[2]


class DatabaseHealthResponse(HealthResponse):
    database: Literal["ready"]


class CompanyListItem(ApiModel):
    company_id: int
    entity_type: EntityType
    org_nr: str
    pe_org_nr: str | None = None
    company_name: str | None = None
    registered_name: str | None = None
    matched_name: str | None = None
    care_of_address: str | None = None
    postal_address: str | None = None
    postal_code: str | None = None
    postal_city: str | None = None
    county_code: str | None = None
    county_name: str | None = None
    municipality_code: str | None = None
    municipality_name: str | None = None
    region_code: str | None = None
    region_name: str | None = None
    industry_section_code: str | None = None
    industry_section_name: str | None = None
    primary_industry_code: str | None = None
    primary_industry_name: str | None = None
    employee_size_code: str | None = None
    employee_size: str | None = None
    turnover_size_code: str | None = None
    turnover_size: str | None = None
    turnover_financial_size_code: str | None = None
    turnover_financial_size: str | None = None
    legal_form_code: str | None = None
    legal_form: str | None = None
    organization_form_code: str | None = None
    organization_form: str | None = None
    sector_code: str | None = None
    sector: str | None = None
    activity_status_code: str | None = None
    activity_status: str | None = None
    company_state_code: str | None = None
    company_state: str | None = None
    employer_status_code: str | None = None
    employer_status: str | None = None
    ingested_at: datetime


class CompaniesResponse(ApiModel):
    items: list[CompanyListItem]
    total: int | None = None
    total_kind: Literal["exact", "estimated", "none"] = "none"
    search_mode: Literal["results", "autocomplete"] = "results"
    has_more: bool = False
    limit: int = Field(ge=1, le=500)
    offset: int = Field(ge=0)
    result_window_limit: int = Field(default=10_000, ge=1)


class SearchResultClick(ApiModel):
    search_id: UUID
    company_id: int
    position: int = Field(ge=1)


class SearchTelemetryAccepted(ApiModel):
    ok: Literal[True]


class CompanyIndustry(ApiModel):
    rank: int
    sni_code: str
    sni_version: str
    source: str


class CompanyRegistration(ApiModel):
    company_id: int
    registration_version_id: int
    source_key: str
    source_subkey: str
    registration: dict[str, Any] | None = None
    names: list[dict[str, Any]] | None = None
    procedures: list[dict[str, Any]] | None = None
    valid_from: datetime
    last_ingestion_run_id: int


class CompanyDetail(ApiModel):
    company_id: int
    state_id: int
    entity_type: EntityType
    identity_type: str
    org_nr: str
    pe_org_nr: str | None = None
    company_name: str | None = None
    registered_name: str | None = None
    care_of_address: str | None = None
    postal_address: str | None = None
    postal_code: str | None = None
    postal_city: str | None = None
    municipality_code: str | None = None
    municipality_name: str | None = None
    county_code: str | None = None
    county_name: str | None = None
    region_code: str | None = None
    region_name: str | None = None
    workplace_count: int | None = None
    employee_size_code: str | None = None
    employee_size: str | None = None
    activity_status_code: str | None = None
    activity_status: str | None = None
    legal_entity_status_code: str | None = None
    legal_entity_status: str | None = None
    tax_registry_status_code: str | None = None
    tax_registry_status: str | None = None
    legal_form_code: str | None = None
    legal_form: str | None = None
    organization_form_code: str | None = None
    organization_form: str | None = None
    advertising_status_code: str | None = None
    advertising_status: str | None = None
    bulk_advertising_status_code: str | None = None
    bulk_advertising_status: str | None = None
    mail_status_code: str | None = None
    mail_status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    scb_registration_date: date | None = None
    bolagsverket_registration_date: date | None = None
    bolagsverket_registration_active: bool | None = None
    registered_name_date: date | None = None
    business_description: str | None = None
    primary_industry_code: str | None = None
    primary_industry_name: str | None = None
    primary_industry_code_formatted: str | None = None
    industry_section_code: str | None = None
    industry_section_name: str | None = None
    trade_indicator: str | None = None
    turnover_year: int | None = None
    turnover_size_code: str | None = None
    turnover_size: str | None = None
    turnover_financial_size_code: str | None = None
    turnover_financial_size: str | None = None
    ownership_category_code: str | None = None
    ownership_category: str | None = None
    phone: str | None = None
    email: str | None = None
    private_public_code: str | None = None
    private_public: str | None = None
    employer_status_code: str | None = None
    employer_status: str | None = None
    vat_status_code: str | None = None
    vat_status: str | None = None
    f_tax_status_code: str | None = None
    f_tax_status: str | None = None
    company_state_code: str | None = None
    company_state: str | None = None
    registered_name_count: int | None = None
    sector_code: str | None = None
    sector: str | None = None
    sme_size_code: str | None = None
    sme_size: str | None = None
    female_share: float | None = None
    male_share: float | None = None
    owner_country_code: str | None = None
    owner_country: str | None = None
    owner_name: str | None = None
    foreign_ownership_code: str | None = None
    foreign_ownership: str | None = None
    ingested_at: datetime
    scb_updated_at: datetime | None = None
    provenance: dict[str, Any]
    registrations: list[CompanyRegistration]
    industries: list[CompanyIndustry]


class TurnoverHistoryItem(ApiModel):
    year: int
    turnover_size_code: str | None = None
    turnover_size: str | None = None
    turnover_financial_size_code: str | None = None
    turnover_financial_size: str | None = None
    source: Literal["current", "history"]


class TurnoverHistoryResponse(ApiModel):
    items: list[TurnoverHistoryItem]


class CompanyEvent(ApiModel):
    id: str
    kind: Literal["company_event", "change", "registration", "procedure"]
    title: str
    description: str | None = None
    effective_at: date | datetime | None = None
    detected_at: datetime | None = None
    source: str | None = None
    source_label: str | None = None
    field_name: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    old_label: str | None = None
    new_label: str | None = None
    importance: int


class CompanyEventHistoryResponse(ApiModel):
    items: list[CompanyEvent]


class CountByName(ApiModel):
    code: str | None = None
    name: str | None = None
    count: int = Field(ge=0)


class GeographyCounts(ApiModel):
    counties: list[CountByName]
    municipalities: list[CountByName]


class MetricCoverage(ApiModel):
    covered: int = Field(ge=0)
    total: int = Field(ge=0)
    percent: float | None = Field(default=None, ge=0, le=100)


class OverviewMetadata(ApiModel):
    data_as_of: date | None = None
    source: str
    last_successful_import_at: datetime | None = None
    timezone: Literal["Europe/Stockholm"]
    coverage: dict[str, MetricCoverage]
    technical_geography: dict[str, int]


class SwedenTotals(ApiModel):
    companies: int
    active: int
    inactive: int
    never_active: int
    employers: int
    vat_registered: int
    f_tax_registered: int
    vat_and_f_tax: int
    accepts_marketing: int
    counties: int
    municipalities: int
    industry_groups: int


class SwedenOverview(ApiModel):
    scope: Literal["sweden"]
    totals: SwedenTotals
    metadata: OverviewMetadata
    by_county: list[CountByName]
    by_municipality: list[CountByName]
    by_industry: list[CountByName]
    by_section: list[CountByName]
    by_size: list[CountByName]
    by_turnover: list[CountByName]
    by_activity_status: list[CountByName]
    by_company_state: list[CountByName]
    by_employer_status: list[CountByName]
    by_vat_status: list[CountByName]
    by_f_tax_status: list[CountByName]
    by_marketing: list[CountByName]


class StatisticsCategory(ApiModel):
    code: str
    name: str
    count: int = Field(ge=0)


class CompanyDynamicsPoint(ApiModel):
    period: date
    registered: int | None = Field(default=None, ge=0)
    closed: int | None = Field(default=None, ge=0)
    net_change: int | None = None
    total_registered: int | None = Field(default=None, ge=0)


class RepresentativeHistoryPoint(ApiModel):
    year: int = Field(ge=1900, le=2200)
    chief_executives: int = Field(ge=0)
    board_members: int = Field(ge=0)
    chairpersons: int = Field(ge=0)
    deputies: int = Field(ge=0)


class AuditorReservationPoint(ApiModel):
    year: int = Field(ge=1900, le=2200)
    formation_type_code: str
    formation_type_name: str
    company_count: int = Field(ge=0)
    with_auditor_at_formation_count: int = Field(ge=0)
    with_auditor_reservation_count: int = Field(ge=0)
    without_auditor_with_reservation_count: int = Field(ge=0)
    with_auditor_reservation_share: float = Field(ge=0)
    without_auditor_with_reservation_share: float = Field(ge=0)


class FilingDelayPoint(ApiModel):
    year: int = Field(ge=1900, le=2200)
    expected_to_file_count: int = Field(ge=0)
    filed_annual_report_count: int = Field(ge=0)
    late_fee_count: int = Field(ge=0)
    filed_annual_report_share: float = Field(ge=0)
    late_fee_share: float = Field(ge=0)


class BolagsverketStatisticsOverview(ApiModel):
    source: Literal["Bolagsverket"]
    license: Literal["CC BY 2.5 SE"]
    last_successful_import_at: datetime | None = None
    company_dynamics: list[CompanyDynamicsPoint]
    company_forms: list[StatisticsCategory]
    representative_history: list[RepresentativeHistoryPoint]
    representative_roles: list[StatisticsCategory]
    auditor_reservations: list[AuditorReservationPoint]
    filing_delays: list[FilingDelayPoint]


class CountyTotals(ApiModel):
    companies: int
    active: int
    employers: int
    municipalities: int
    aregions: int


class CountyOverview(ApiModel):
    county_code: str
    county_name: str
    totals: CountyTotals
    metadata: OverviewMetadata
    by_municipality: list[CountByName]
    by_aregion: list[CountByName]
    by_industry: list[CountByName]
    by_size: list[CountByName]
    by_turnover: list[CountByName]
    by_activity_status: list[CountByName]
    by_company_state: list[CountByName]


class MunicipalityTotals(ApiModel):
    companies: int
    active: int
    employers: int
    aregions: int
    industries: int


class MunicipalityOverview(ApiModel):
    municipality_code: str
    municipality_name: str
    county_code: str
    county_name: str
    totals: MunicipalityTotals
    metadata: OverviewMetadata
    by_industry: list[CountByName]
    by_size: list[CountByName]
    by_turnover: list[CountByName]
    by_aregion: list[CountByName]
    by_activity_status: list[CountByName]
    by_company_state: list[CountByName]


IngestionStatus = Literal["running", "done", "failed", "interrupted"]


class AdminSummary(ApiModel):
    runs_total: int = Field(ge=0)
    done: int = Field(ge=0)
    failed: int = Field(ge=0)
    running: int = Field(ge=0)
    interrupted: int = Field(ge=0)
    quality_issues_total: int = Field(ge=0)
    database_size_bytes: int = Field(ge=0)
    latest_successful_import_at: datetime | None = None


class AdminSourceSummary(ApiModel):
    source: str
    source_name: str
    runs: int = Field(ge=0)
    done: int = Field(ge=0)
    failed: int = Field(ge=0)
    records_seen: int = Field(ge=0)
    records_new: int = Field(ge=0)
    records_changed: int = Field(ge=0)
    records_skipped: int = Field(ge=0)
    latest_started_at: datetime | None = None
    latest_successful_import_at: datetime | None = None


class AdminIngestionRun(ApiModel):
    id: int
    source: str
    source_name: str
    dataset: str
    started_at: datetime
    finished_at: datetime | None = None
    duration_seconds: float = Field(ge=0)
    source_as_of_date: date | None = None
    filename: str | None = None
    file_checksum: str | None = None
    schema_version: str
    metadata: dict[str, Any]
    records_seen: int = Field(ge=0)
    records_new: int = Field(ge=0)
    records_changed: int = Field(ge=0)
    records_skipped: int = Field(ge=0)
    last_row_number: int = Field(ge=0)
    status: IngestionStatus
    error: str | None = None
    quality_issue_count: int = Field(ge=0)


class AdminQualityIssueCount(ApiModel):
    issue_code: str
    count: int = Field(ge=0)


class AdminQualityIssue(ApiModel):
    id: int
    ingestion_run_id: int
    source: str
    row_number: int | None = None
    issue_code: str
    detail: str
    observed_at: datetime


class AdminTableStat(ApiModel):
    schema_name: str
    table_name: str
    estimated_rows: int = Field(ge=0)
    dead_rows: int = Field(ge=0)
    total_bytes: int = Field(ge=0)
    last_analyze: datetime | None = None
    last_autoanalyze: datetime | None = None


class AdminCacheEntry(ApiModel):
    scope: str
    generated_at: datetime
    expires_at: datetime


class AdminSearchMetrics(ApiModel):
    window_hours: int = Field(ge=1)
    data_requests: int = Field(ge=0)
    autocomplete_requests: int = Field(ge=0)
    p50_ms: float | None = Field(default=None, ge=0)
    p95_ms: float | None = Field(default=None, ge=0)
    timeout_percent: float = Field(ge=0, le=100)
    zero_result_percent: float = Field(ge=0, le=100)
    reformulation_percent: float = Field(ge=0, le=100)
    fuzzy_percent: float = Field(ge=0, le=100)
    average_filter_count: float = Field(ge=0)
    clicks: int = Field(ge=0)
    average_click_position: float | None = Field(default=None, ge=1)


class AdminSearchFilterUsage(ApiModel):
    filter_key: str
    searches: int = Field(ge=0)


class AdminDataOverview(ApiModel):
    generated_at: datetime
    summary: AdminSummary
    source_summaries: list[AdminSourceSummary]
    ingestion_runs: list[AdminIngestionRun]
    quality_issues_by_code: list[AdminQualityIssueCount]
    recent_quality_issues: list[AdminQualityIssue]
    table_stats: list[AdminTableStat]
    cache_entries: list[AdminCacheEntry]
    overview_metadata: OverviewMetadata | None = None
    overview_totals: dict[str, int]
    search_metrics: AdminSearchMetrics
    search_filter_usage: list[AdminSearchFilterUsage]


class CountyOption(ApiModel):
    code: str
    name: str


class MunicipalityOption(CountyOption):
    county_code: str


class DeleteResponse(ApiModel):
    ok: Literal[True]
    id: UUID


class SavedSegment(ApiModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None = None
    filters: dict[str, Any]
    sort: dict[str, Any]
    visibility: str
    match_profile_id: UUID | None = None
    source: str
    result_count: int | None = None
    last_result_count_at: datetime | None = None
    last_used_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class SavedSegmentsResponse(ApiModel):
    items: list[SavedSegment]


class AppUserProfile(ApiModel):
    id: UUID
    company_id: int | None = None
    company_pe_org_nr: str | None = None
    auth_provider: str | None = None
    auth_subject: str | None = None
    email: str | None = None
    display_name: str | None = None
    role: str
    company_org_nr: str | None = None
    company_entity_type: EntityType | None = None
    company_name: str | None = None
    company_registered_name: str | None = None
    postal_city: str | None = None
    county_code: str | None = None
    county_name: str | None = None
    municipality_code: str | None = None
    municipality_name: str | None = None
    company_description: str | None = None
    ideal_customer_description: str | None = None
    settings: dict[str, Any]
    created_at: datetime | None = None
    updated_at: datetime | None = None
