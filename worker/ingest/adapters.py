from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation

from worker.bulk_files.parser import (
    BolagsverketCompany, ScbBulkCompany, clean_text, primary_bolagsverket_name,
)
from worker.ingest.fields import API_KEYS, FIELD_ALIASES, LABEL_ALIASES
from worker.scb.models.company import CompanyJE


def json_text(value) -> str:
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(',', ':'), default=str)


def digest(value) -> str:
    return hashlib.sha256(json_text(value).encode('utf-8')).hexdigest()


def clean_json(value):
    if isinstance(value, str):
        return value.replace('\x00', '')
    if isinstance(value, dict):
        return {str(k).replace('\x00', ''): clean_json(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean_json(v) for v in value]
    return value


def scb_identity(value: str) -> tuple[str, str, str]:
    value = re.sub(r'[\s-]', '', value)
    if not re.fullmatch(r'[0-9]{12}', value):
        raise ValueError('SCB PeOrgNr must contain exactly 12 digits')
    if value.startswith('16'):
        return 'ORGNR', value[2:], 'organization'
    if value.startswith(('18', '19', '20')):
        return 'PERSON', value, 'person'
    raise ValueError('Unrecognized SCB PeOrgNr prefix; identity must not be guessed')


@dataclass(frozen=True)
class CompanyRecord:
    row_number: int
    source_file: str
    source_key: str
    source_subkey: str
    identity_type: str
    identity_value: str
    entity_type: str
    payload: dict
    data: dict

    def copy_row(self):
        return (
            self.row_number, self.source_file, self.source_key, self.source_subkey,
            self.identity_type, self.identity_value, self.entity_type,
            json_text(self.payload), digest(self.payload), json_text(clean_json(self.data)),
        )


def _percentage(value):
    if value in (None, '', '*'):
        return None
    try:
        result = Decimal(str(value).replace(',', '.').rstrip('%').strip())
    except InvalidOperation as exc:
        raise ValueError('Invalid percentage in source record') from exc
    if not result.is_finite() or not 0 <= result <= 100:
        raise ValueError('Percentage must be between 0 and 100')
    return float(result.quantize(Decimal('0.01')))


def scb_api_attributes(row: dict) -> dict:
    data = {field: row[old] for field, old in FIELD_ALIASES.items() if old in row}
    for field, value in data.items():
        if field.endswith('_code') and value is not None:
            data[field] = str(value)
    for field in ('female_share', 'male_share'):
        if field in data:
            data[field] = _percentage(data[field])
    if data.get('postal_code'):
        data['postal_code'] = re.sub(r'\s', '', data['postal_code'])
    data['_labels'] = {
        field: {'code': data[field], 'name': row[label]}
        for field, label in LABEL_ALIASES.items()
        if data.get(field) is not None and row.get(label)
    }
    if 'primary_industry_code' in data:
        code = data['primary_industry_code']
        data['_industries'] = ([{'rank': 1, 'sni_code': code, 'sni_version': 'unknown'}] if code else [])
    return data


def api_record(payload: dict, row_number: int, *, sni_version: str = 'unknown') -> CompanyRecord:
    identity = scb_identity(str(payload.get('PeOrgNr', '')))
    row = asdict(CompanyJE.from_scb(clean_json(payload)))
    data = scb_api_attributes(row)
    for field, old in FIELD_ALIASES.items():
        if API_KEYS.get(old) not in payload:
            data.pop(field, None)
    data['_labels'] = {k: v for k, v in data['_labels'].items() if k in data}
    if 'primary_industry_code' not in data:
        data.pop('_industries', None)
    else:
        for item in data['_industries']:
            item['sni_version'] = sni_version
    source_key = '16' + identity[1] if identity[0] == 'ORGNR' else identity[1]
    return CompanyRecord(row_number, 'SCB API', source_key, '', *identity, payload, data)


def scb_bulk_record(company: ScbBulkCompany, *, sni_version: str = '2025') -> CompanyRecord:
    c = company
    identity = scb_identity(str(c.payload.get('PeOrgNr', '')))
    data = {
        'company_name': clean_text(c.payload.get('Namn')),
        'registered_name': c.registered_company_name,
        'activity_status_code': c.company_status_code,
        'legal_entity_status_code': c.legal_unit_status_code,
        'legal_form_code': c.legal_form_code,
        'postal_address': c.postal_address, 'co_address': c.co_address,
        'postal_code': c.postal_code, 'postal_city': c.postal_city,
        'scb_registration_date': c.registration_date,
        # Bulk advertising and API advertising/phone restrictions are different domains.
        'bulk_advertising_status_code': c.advertising_status_code,
        'primary_industry_code': c.industry_code_1,
        '_industries': [
            {'rank': rank, 'sni_code': code, 'sni_version': sni_version}
            for rank in range(1, 6) if (code := getattr(c, f'industry_code_{rank}'))
        ],
        '_labels': {},
    }
    for field, label in (
        ('activity_status_code', c.company_status_name),
        ('legal_entity_status_code', c.legal_unit_status_name),
        ('legal_form_code', c.legal_form_name),
        ('bulk_advertising_status_code', c.advertising_status_name),
    ):
        if label:
            data['_labels'][field] = {'code': data[field], 'name': label}
    return CompanyRecord(c.source_row_number, c.source_file, c.pe_org_nr, '', *identity, c.payload, data)


def bolagsverket_record(company: BolagsverketCompany) -> CompanyRecord:
    c = company
    value = re.sub(r'[\s-]', '', c.identity_value)
    if c.identity_type_code == 'PERSON-IDORG':
        if re.fullmatch(r'[0-9]{12}', value):
            identity = ('PERSON', value, 'person')
        elif re.fullmatch(r'[0-9]{10}', value):
            identity = ('PERSON_SHORT', value, 'person')
        else:
            raise ValueError('PERSON-IDORG must contain 10 or 12 digits')
    elif c.identity_type_code == 'ORGNR-IDORG':
        if not re.fullmatch(r'[0-9]{10}', value):
            raise ValueError('ORGNR-IDORG requires a 10-digit identity')
        identity = ('ORGNR', value, 'organization')
    else:
        identity = (c.identity_type_code, c.identity_value, 'other')
    data = {
        'company_name': primary_bolagsverket_name(c.names),
        'organization_form_code': c.organization_form_code,
        'postal_address': c.postal_address, 'co_address': c.postal_co_address,
        'postal_code': c.postal_code, 'postal_city': c.postal_city,
        '_registration': {
            'identity_type': c.identity_type_code, 'identity_value': c.identity_value,
            'name_protection_sequence': c.name_protection_sequence,
            'country_code': c.registration_country_code,
            'organization_form_code': c.organization_form_code,
            'registered_on': c.registered_on, 'deregistered_on': c.deregistered_on,
            'deregistration_reason_code': c.deregistration_reason_code,
            'business_description': c.business_description,
            'postal_address': c.postal_address, 'co_address': c.postal_co_address,
            'postal_code': c.postal_code, 'postal_city': c.postal_city,
            'postal_country_code': c.postal_country_code,
        },
        '_names': [asdict(n) for n in c.names],
        '_procedures': [asdict(p) for p in c.restructuring_procedures],
        '_labels': {},
    }
    if c.organization_form_code and c.organization_form_name:
        data['_labels']['organization_form_code'] = {
            'code': c.organization_form_code,
            'name': c.organization_form_name,
        }
    return CompanyRecord(c.source_row_number, c.source_file, f'{c.identity_type_code}:{value}', c.name_protection_sequence, *identity, c.payload, data)
