"""Canonical column -> existing API field. Source-specific names stay at the API boundary."""

FIELD_ALIASES = {
    'company_name': 'company_name', 'registered_name': 'firma',
    'co_address': 'co_address', 'postal_address': 'post_address',
    'postal_code': 'post_nr', 'postal_city': 'post_ort',
    'seat_municipality_code': 'seat_municipality_code',
    'seat_county_code': 'seat_county_code', 'region_code': 'aregion_code',
    'workplace_count': 'num_workplaces', 'employee_size_code': 'size_class_code',
    'activity_status_code': 'company_status_code',
    'legal_entity_status_code': 'legal_unit_status_code',
    'tax_registry_status_code': 'skv_registered_code',
    'legal_form_code': 'legal_form_code', 'advertising_status_code': 'reklam_code',
    'organization_form_code': 'organization_form_code',
    'bulk_advertising_status_code': 'bulk_advertising_status_code',
    'mail_status_code': 'utskick_code', 'start_date': 'start_date', 'end_date': 'end_date',
    'scb_registration_date': 'registration_date',
    'primary_industry_code': 'bransch_1_code', 'industry_section_code': 'avdelning_1_code',
    'trade_indicator': 'export_import_mark', 'turnover_year': 'turnover_year',
    'turnover_class_code': 'turnover_size_code',
    'turnover_detail_class_code': 'turnover_fin_size_code',
    'ownership_category_code': 'owner_category_code', 'phone': 'phone', 'email': 'email',
    'private_public_code': 'private_public_code', 'employer_status_code': 'employer_status_code',
    'vat_status_code': 'vat_status_code', 'f_tax_status_code': 'f_tax_status_code',
    'company_state_code': 'company_state_code', 'registered_name_count': 'num_firms',
    'sector_code': 'sector_code', 'sme_size_code': 'sme_size_code',
    'female_share': 'female_share', 'male_share': 'male_share',
    'owner_country_code': 'owner_country_code', 'owner_name': 'owner_name',
    'foreign_ownership_code': 'foreign_ownership_code',
}

LABEL_ALIASES = {
    key: value.removesuffix('_code') for key, value in FIELD_ALIASES.items()
    if key.endswith('_code') and key != 'postal_code'
}

# Presence matters: omitted API variables keep the last observation; explicit nulls clear it.
API_KEYS = {
    'company_name': 'Företagsnamn', 'firma': 'Firma', 'co_address': 'COAdress',
    'post_address': 'PostAdress', 'post_nr': 'PostNr', 'post_ort': 'PostOrt',
    'seat_municipality_code': 'Säteskommun, kod', 'seat_county_code': 'Säteslän, kod',
    'aregion_code': 'Aregion, kod', 'num_workplaces': 'Antal arbetsställen',
    'size_class_code': 'Stkl, kod', 'company_status_code': 'Företagsstatus, kod',
    'skv_registered_code': 'Registrerad hos SKV, kod', 'legal_form_code': 'Juridisk form, kod',
    'reklam_code': 'Reklam, kod', 'utskick_code': 'Utskick, kod', 'start_date': 'Startdatum',
    'end_date': 'Slutdatum', 'registration_date': 'Registreringsdatum',
    'bransch_1_code': 'Bransch_1, kod', 'avdelning_1_code': 'Avdelning_1, kod',
    'organization_form_code': 'Organisationsform, kod',
    'export_import_mark': 'Export/Importmarkering', 'turnover_year': 'Omsättning, år',
    'turnover_size_code': 'Stkl, oms, kod', 'turnover_fin_size_code': 'Stkl Fin, oms, kod',
    'owner_category_code': 'Ägarkategori, kod', 'phone': 'Telefon', 'email': 'E-post',
    'private_public_code': 'Privat/Publikt, kod', 'employer_status_code': 'Arbetsgivarstatus, kod',
    'vat_status_code': 'Momsstatus, kod', 'f_tax_status_code': 'Fskattstatus, kod',
    'company_state_code': 'Bolagsstatus, kod', 'num_firms': 'Antal firmor',
    'sector_code': 'Sektor, kod', 'sme_size_code': 'Stkl SME, kod',
    'female_share': 'Andel kvinna', 'male_share': 'Andel man',
    'owner_country_code': 'Ägarland, kod', 'owner_name': 'Ägarnamn',
    'foreign_ownership_code': 'Utländskt ägande, kod',
}
