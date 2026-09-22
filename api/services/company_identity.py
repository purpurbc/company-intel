import re

from fastapi import HTTPException


def resolve_company_id(cur, identity: str | None = None, *, company_id: int | None = None):
    if company_id is None and identity and re.fullmatch(r'id:[1-9][0-9]*', identity):
        company_id = int(identity[3:])
    if company_id is not None:
        cur.execute('SELECT company_id FROM core.company WHERE company_id = %s', (company_id,))
    else:
        value = re.sub(r'[\s-]', '', identity or '')
        if len(value) == 12 and value.isascii() and value.isdigit():
            kind, value = ('ORGNR', value[2:]) if value.startswith('16') else ('PERSON', value)
            cur.execute('SELECT company_id FROM core.company_identifier WHERE identity_type = %s AND identity_value = %s', (kind, value))
        elif len(value) == 10 and value.isascii() and value.isdigit():
            cur.execute('''
                SELECT company_id FROM core.company_identifier
                WHERE (identity_type = 'ORGNR' AND identity_value = %s)
                   OR (identity_type = 'PERSON' AND right(identity_value, 10) = %s)
                   OR (identity_type = 'PERSON_SHORT' AND identity_value = %s)
                LIMIT 2
            ''', (value, value, value))
        else:
            raise HTTPException(status_code=422, detail='Use company_id or a full company/person identity')
    rows = cur.fetchall()
    if not rows:
        raise HTTPException(status_code=404, detail='company_not_found')
    if len(rows) > 1:
        raise HTTPException(status_code=409, detail='ambiguous_identity_use_company_id_or_12_digits')
    return rows[0]['company_id']
