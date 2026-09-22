from __future__ import annotations

from psycopg import ClientCursor, sql

from worker.ingest.adapters import CompanyRecord
from worker.ingest.fields import FIELD_ALIASES


SOURCE_TABLES = {
    'scb_api': 'src_scb.company_history',
    'scb_bulk': 'src_scb.company_history',
    'bolagsverket': 'src_bolagsverket.organization_history',
}


def load_batch(conn, source: str, run_id: int, records: list[CompanyRecord], *, emit_events=True) -> dict:
    """One bounded COPY and set-based merge. Caller commits data and checkpoint together."""
    if not records:
        return {'records_seen': 0, 'records_new': 0, 'records_changed': 0}
    history = SOURCE_TABLES[source]
    params = {'source': source, 'run_id': run_id}
    with ClientCursor(conn) as cur:
        # Sources may overlap. Serialize the short merge transaction, not file parsing/downloads.
        cur.execute('SELECT pg_advisory_xact_lock(704192601)')
        cur.execute(
            'SELECT source, status, started_at FROM meta.ingestion_run WHERE id = %s FOR UPDATE',
            (run_id,),
        )
        run = cur.fetchone()
        if not run or run['source'] != source or run['status'] != 'running':
            raise ValueError('Import run is missing, finished, or belongs to another source')
        params['observed_at'] = run['started_at']
        cur.execute('''
            CREATE TEMP TABLE incoming_company (
                row_number bigint PRIMARY KEY, source_file text, source_key text, source_subkey text,
                identity_type text, identity_value text, entity_type text,
                payload json, raw_hash text, data jsonb
            ) ON COMMIT DROP
        ''')
        with cur.copy('COPY incoming_company FROM STDIN') as copy:
            for record in records:
                copy.write_row(record.copy_row())
        cur.execute('ANALYZE incoming_company')
        cur.execute('''
            SELECT count(*) AS n FROM (
                SELECT source_key, source_subkey FROM incoming_company
                GROUP BY source_key, source_subkey HAVING count(DISTINCT data) > 1
            ) conflicts
        ''')
        if cur.fetchone()['n']:
            raise ValueError('Conflicting duplicate source keys in batch; checkpoint was not advanced')
        if source == 'scb_api':
            cur.execute('''SELECT count(*) AS n FROM (
                SELECT source_key FROM incoming_company GROUP BY source_key HAVING count(*) > 1
            ) duplicates''')
            if cur.fetchone()['n']:
                raise ValueError('SCB API returned duplicate identities; population coverage cannot be confirmed')
            cur.execute('''SELECT count(*) AS n FROM incoming_company i
                JOIN src_scb.company_history h ON h.source = 'scb_api' AND h.source_key = i.source_key
                WHERE h.last_ingestion_run_id = %(run_id)s AND h.valid_to IS NULL
                  AND h.last_row_number <> i.row_number''', params)
            if cur.fetchone()['n']:
                raise ValueError('SCB API partitions overlap; population coverage cannot be confirmed')
        cur.execute('''
            SELECT count(*) AS n FROM incoming_company i JOIN raw.company_record r
            ON r.source = %(source)s AND r.ingestion_run_id = %(run_id)s AND r.row_number = i.row_number
            WHERE r.raw_hash <> i.raw_hash
        ''', params)
        if cur.fetchone()['n']:
            raise ValueError('A previously imported raw row has changed; start a new ingestion run')
        cur.execute('''
            INSERT INTO raw.company_record(
                source, ingestion_run_id, row_number, source_file, payload,
                raw_hash, observed_at
            )
            SELECT %(source)s, %(run_id)s, row_number, source_file, payload,
                   raw_hash, %(observed_at)s
            FROM incoming_company
            ON CONFLICT DO NOTHING
        ''', params)
        cur.execute('''
            INSERT INTO meta.data_quality_issue(
                ingestion_run_id, row_number, issue_code, detail, observed_at
            )
            SELECT %(run_id)s, row_number, 'nul_removed',
                   'NUL retained in raw JSON; removed from normalized text',
                   %(observed_at)s
            FROM incoming_company WHERE position(chr(92) || 'u0000' IN payload::text) > 0
        ''', params)
        cur.execute('''
            INSERT INTO meta.data_quality_issue(
                ingestion_run_id, row_number, issue_code, detail, observed_at
            )
            SELECT %(run_id)s, row_number, 'short_person_identity',
                '10-digit PERSON-IDORG retained separately; century is unknown. Use company_id for lookup.',
                %(observed_at)s
            FROM incoming_company WHERE identity_type = 'PERSON_SHORT'
        ''', params)
        cur.execute('''
            CREATE TEMP TABLE incoming_identity ON COMMIT DROP AS
            SELECT i.identity_type, i.identity_value, i.entity_type,
                   coalesce(k.company_id, nextval(pg_get_serial_sequence('core.company', 'company_id'))) AS company_id,
                   k.company_id IS NULL AS is_new
            FROM (SELECT DISTINCT identity_type, identity_value, entity_type FROM incoming_company) i
            LEFT JOIN core.company_identifier k USING (identity_type, identity_value);
            INSERT INTO core.company(company_id, entity_type)
            SELECT company_id, entity_type FROM incoming_identity WHERE is_new;
            INSERT INTO core.company_identifier(company_id, identity_type, identity_value)
            SELECT company_id, identity_type, identity_value FROM incoming_identity WHERE is_new;
            CREATE UNIQUE INDEX ON incoming_identity(identity_type, identity_value);
            ANALYZE incoming_identity;
        ''')
        cur.execute('SELECT count(*) AS n FROM incoming_identity WHERE is_new')
        new_count = cur.fetchone()['n']
        cur.execute('''
            INSERT INTO core.company_source_key(source, source_key, source_subkey, company_id)
            SELECT DISTINCT %(source)s, i.source_key, i.source_subkey, k.company_id
            FROM incoming_company i JOIN incoming_identity k USING (identity_type, identity_value)
            ON CONFLICT DO NOTHING
        ''', params)
        cur.execute('''
            SELECT count(*) AS n FROM incoming_company i
            JOIN incoming_identity k USING (identity_type, identity_value)
            JOIN core.company_source_key s ON s.source = %(source)s
              AND s.source_key = i.source_key AND s.source_subkey = i.source_subkey
            WHERE s.company_id <> k.company_id
        ''', params)
        if cur.fetchone()['n']:
            raise ValueError('Source key is already linked to a different company')
        cur.execute(f'''
            CREATE TEMP TABLE incoming_version ON COMMIT DROP AS
            SELECT DISTINCT ON (i.source_key, i.source_subkey)
                i.source_key, i.source_subkey, i.row_number,
                k.company_id, h.id AS previous_id, h.row_hash AS previous_hash,
                CASE WHEN %(source)s = 'scb_api' THEN
                    coalesce(h.data, '{{}}'::jsonb) || i.data || jsonb_build_object('_labels',
                        coalesce(h.data->'_labels', '{{}}'::jsonb) || coalesce(i.data->'_labels', '{{}}'::jsonb))
                ELSE i.data END AS merged_data
            FROM incoming_company i
            JOIN incoming_identity k USING (identity_type, identity_value)
            LEFT JOIN {history} h ON h.source = %(source)s AND h.source_key = i.source_key
                AND h.source_subkey = i.source_subkey AND h.valid_to IS NULL
            ORDER BY i.source_key, i.source_subkey, i.row_number DESC;
            ALTER TABLE incoming_version ADD COLUMN row_hash text;
            UPDATE incoming_version SET row_hash = encode(sha256(convert_to(merged_data::text, 'UTF8')), 'hex');
            ANALYZE incoming_version;
        ''', params)
        cur.execute(f'''
            UPDATE {history} h SET valid_to = %(observed_at)s
            FROM incoming_version v WHERE h.id = v.previous_id AND v.row_hash <> v.previous_hash;
            INSERT INTO {history}(source, source_key, source_subkey, company_id, data, row_hash,
                valid_from, first_ingestion_run_id, last_ingestion_run_id, first_row_number, last_row_number)
            SELECT %(source)s, source_key, source_subkey, company_id, merged_data, row_hash,
                %(observed_at)s, %(run_id)s, %(run_id)s, row_number, row_number
            FROM incoming_version WHERE row_hash IS DISTINCT FROM previous_hash;
            UPDATE {history} h SET last_ingestion_run_id = %(run_id)s, last_row_number = v.row_number
            FROM incoming_version v WHERE h.id = v.previous_id AND v.row_hash = v.previous_hash;
        ''', params)
        if source == 'bolagsverket':
            cur.execute('''
                INSERT INTO src_bolagsverket.organization_name
                    (organization_history_id, ordinal, name, name_type_code, registered_on, business_description)
                SELECT h.id, n.ordinal, n.name, n.name_type_code, n.registered_on, n.business_description
                FROM src_bolagsverket.organization_history h
                JOIN incoming_version v USING (source_key, source_subkey)
                CROSS JOIN LATERAL jsonb_to_recordset(h.data->'_names') AS n(
                    ordinal smallint, name text, name_type_code text, registered_on date, business_description text)
                WHERE h.valid_to IS NULL AND v.row_hash IS DISTINCT FROM v.previous_hash;
                INSERT INTO src_bolagsverket.organization_procedure
                    (organization_history_id, ordinal, procedure_code, procedure_text, started_on)
                SELECT h.id, p.ordinal, p.procedure_code, p.procedure_text, p.started_on
                FROM src_bolagsverket.organization_history h
                JOIN incoming_version v USING (source_key, source_subkey)
                CROSS JOIN LATERAL jsonb_to_recordset(h.data->'_procedures') AS p(
                    ordinal smallint, procedure_code text, procedure_text text, started_on date)
                WHERE h.valid_to IS NULL AND v.row_hash IS DISTINCT FROM v.previous_hash;
            ''')
        cur.execute('''
            INSERT INTO meta.code(source, domain, code, name, parent_code)
            SELECT DISTINCT ON (label.key, label.value->>'code')
                %(source)s, label.key, label.value->>'code', label.value->>'name',
                CASE WHEN label.key = 'seat_municipality_code' THEN v.merged_data->>'seat_county_code' END
            FROM incoming_version v CROSS JOIN LATERAL jsonb_each(v.merged_data->'_labels') label
            WHERE label.value->>'code' IS NOT NULL AND label.value->>'name' IS NOT NULL
            ORDER BY label.key, label.value->>'code', v.row_number DESC
            ON CONFLICT (source, domain, code) DO UPDATE
            SET name = excluded.name, parent_code = coalesce(excluded.parent_code, meta.code.parent_code)
        ''', params)
        cur.execute('''CREATE TEMP TABLE affected_company ON COMMIT DROP AS
            SELECT DISTINCT company_id FROM incoming_version WHERE row_hash IS DISTINCT FROM previous_hash;
            CREATE UNIQUE INDEX ON affected_company(company_id);
            ANALYZE affected_company;''')
        cur.execute('SELECT count(*) AS n FROM affected_company')
        changed = _resolve_companies(cur, params, emit_events=emit_events) if cur.fetchone()['n'] else 0
    return {'records_seen': len(records), 'records_new': new_count, 'records_changed': changed}


def _resolve_companies(cur, params, *, emit_events):
    cur.execute('''
        CREATE TEMP TABLE source_candidates ON COMMIT DROP AS
        SELECT h.company_id, h.source, h.id, h.data,
               CASE h.source WHEN 'scb_api' THEN 40 ELSE 30 END AS priority
        FROM src_scb.company_history h JOIN affected_company i USING (company_id)
        WHERE h.valid_to IS NULL AND h.source IN ('scb_api', 'scb_bulk')
        UNION ALL
        SELECT h.company_id, h.source, h.id, h.data, 20
        FROM src_bolagsverket.organization_history h JOIN affected_company i USING (company_id)
        WHERE h.valid_to IS NULL;
        CREATE INDEX ON source_candidates(company_id);
        ANALYZE source_candidates;

        CREATE TEMP TABLE resolved_field ON COMMIT DROP AS
        SELECT DISTINCT ON (company_id, field.key)
            company_id, field.key, field.value, source, id,
            CASE WHEN data->'_labels'->field.key->>'code' = field.value #>> '{}'
                 THEN data->'_labels'->field.key->>'name' END AS label
        FROM source_candidates c CROSS JOIN LATERAL jsonb_each(c.data) field
        WHERE left(field.key, 1) <> '_'
          AND (c.source = 'scb_api' OR field.value <> 'null'::jsonb)
          AND (source <> 'bolagsverket' OR
            (SELECT count(*) FROM source_candidates b WHERE b.company_id = c.company_id AND b.source = 'bolagsverket') = 1)
        ORDER BY company_id, field.key, priority DESC;

        CREATE TEMP TABLE resolved_company ON COMMIT DROP AS
        SELECT i.company_id,
               coalesce(jsonb_object_agg(f.key, f.value) FILTER (WHERE f.key IS NOT NULL), '{}') AS data,
               coalesce(jsonb_object_agg(f.key, jsonb_build_object('source', f.source, 'version_id', f.id))
                   FILTER (WHERE f.key IS NOT NULL), '{}') AS provenance,
               coalesce(jsonb_object_agg(f.key, f.label) FILTER (WHERE f.label IS NOT NULL), '{}') AS labels
        FROM affected_company i LEFT JOIN resolved_field f USING (company_id) GROUP BY i.company_id;

        UPDATE resolved_company r
        SET
          data = jsonb_strip_nulls(jsonb_build_object(
              'company_name', h.company_name,
              'registered_name', h.registered_name,
              'co_address', h.co_address,
              'postal_address', h.postal_address,
              'postal_code', h.postal_code,
              'postal_city', h.postal_city,
              'seat_municipality_code', h.seat_municipality_code,
              'seat_county_code', h.seat_county_code,
              'region_code', h.region_code,
              'workplace_count', h.workplace_count,
              'employee_size_code', h.employee_size_code,
              'activity_status_code', h.activity_status_code,
              'legal_entity_status_code', h.legal_entity_status_code,
              'tax_registry_status_code', h.tax_registry_status_code,
              'legal_form_code', h.legal_form_code,
              'organization_form_code', h.organization_form_code,
              'advertising_status_code', h.advertising_status_code,
              'bulk_advertising_status_code', h.bulk_advertising_status_code,
              'mail_status_code', h.mail_status_code,
              'start_date', h.start_date,
              'end_date', h.end_date,
              'scb_registration_date', h.scb_registration_date,
              'primary_industry_code', h.primary_industry_code,
              'industry_section_code', h.industry_section_code,
              'trade_indicator', h.trade_indicator,
              'turnover_year', h.turnover_year,
              'turnover_class_code', h.turnover_class_code,
              'turnover_detail_class_code', h.turnover_detail_class_code,
              'ownership_category_code', h.ownership_category_code,
              'phone', h.phone,
              'email', h.email,
              'private_public_code', h.private_public_code,
              'employer_status_code', h.employer_status_code,
              'vat_status_code', h.vat_status_code,
              'f_tax_status_code', h.f_tax_status_code,
              'company_state_code', h.company_state_code,
              'registered_name_count', h.registered_name_count,
              'sector_code', h.sector_code,
              'sme_size_code', h.sme_size_code,
              'female_share', h.female_share,
              'male_share', h.male_share,
              'owner_country_code', h.owner_country_code,
              'owner_name', h.owner_name,
              'foreign_ownership_code', h.foreign_ownership_code
            )) || r.data,
          labels = h.labels || r.labels,
          provenance = h.provenance || r.provenance
        FROM core.company_current h
        WHERE h.company_id = r.company_id;

        ALTER TABLE resolved_company ADD COLUMN industries jsonb NOT NULL DEFAULT '[]';
        UPDATE resolved_company r SET industries = coalesce((
            SELECT c.data->'_industries' FROM source_candidates c
            WHERE c.company_id = r.company_id AND c.data ? '_industries'
            ORDER BY priority DESC LIMIT 1
        ), '[]');
    ''')
    # Supplemental bulk ranks are valid only when both primary code AND SNI edition agree.
    cur.execute('''
        UPDATE resolved_company r SET industries = b.data->'_industries'
        FROM source_candidates a JOIN source_candidates b USING (company_id)
        WHERE r.company_id = a.company_id AND a.source = 'scb_api' AND b.source = 'scb_bulk'
          AND jsonb_array_length(a.data->'_industries') = 1
          AND a.data->'_industries'->0->>'sni_code' = b.data->'_industries'->0->>'sni_code'
          AND a.data->'_industries'->0->>'sni_version' = b.data->'_industries'->0->>'sni_version';
        ALTER TABLE resolved_company ADD COLUMN state_hash text;
        UPDATE resolved_company SET state_hash = encode(sha256(convert_to(
            (data || jsonb_build_object('labels', labels, 'industries', industries, 'sources',
                (SELECT coalesce(jsonb_object_agg(key, value->>'source'), '{}')
                 FROM jsonb_each(provenance))))::text, 'UTF8')), 'hex');
        CREATE TEMP TABLE changed_company ON COMMIT DROP AS
        SELECT r.*, h.state_id AS previous_state_id,
               to_jsonb(h) AS previous_data
        FROM resolved_company r LEFT JOIN core.company_current h USING (company_id)
        WHERE r.state_hash IS DISTINCT FROM h.state_hash;
        UPDATE core.company_state_history h SET valid_to = %(observed_at)s
        FROM changed_company c WHERE h.state_id = c.previous_state_id;
    ''', params)
    columns = list(FIELD_ALIASES)
    column_list = sql.SQL(', ').join(map(sql.Identifier, columns))
    typed_list = sql.SQL(', ').join(sql.SQL('v.{}').format(sql.Identifier(c)) for c in columns)
    cur.execute(sql.SQL('''
        INSERT INTO core.company_state_history(company_id, {}, labels, provenance, state_hash, valid_from, created_by_run_id)
        SELECT r.company_id, {}, r.labels, r.provenance, r.state_hash, %(observed_at)s, %(run_id)s
        FROM changed_company r
        CROSS JOIN LATERAL jsonb_populate_record(NULL::core.company_state_history, r.data) v
    ''').format(column_list, typed_list), params)
    cur.execute('''
        INSERT INTO core.company_industry(state_id, rank, sni_code, sni_version, source)
        SELECT h.state_id, i.rank, i.sni_code, i.sni_version,
               CASE WHEN i.rank > 1 THEN 'scb_bulk'
                    ELSE coalesce(r.provenance->'primary_industry_code'->>'source', %(source)s) END
        FROM changed_company r JOIN core.company_current h USING (company_id)
        CROSS JOIN LATERAL jsonb_to_recordset(r.industries) i(rank smallint, sni_code text, sni_version text)
    ''', params)
    if emit_events:
        _insert_changes(cur, params)
    cur.execute('SELECT count(*) AS n FROM changed_company WHERE previous_state_id IS NOT NULL')
    return cur.fetchone()['n']


def _insert_changes(cur, params):
    cur.execute('''
        INSERT INTO core.company_change(company_id, state_id, field_name, old_value, new_value,
            old_label, new_label, detected_at, ingestion_run_id, importance)
        SELECT r.company_id, h.state_id, f.key, r.previous_data->>f.key, f.value #>> '{}',
            r.previous_data->'labels'->>f.key, r.labels->>f.key, %(observed_at)s, %(run_id)s,
            CASE WHEN f.key IN ('activity_status_code', 'employee_size_code', 'turnover_class_code', 'employer_status_code')
                THEN 5 ELSE 1 END
        FROM changed_company r JOIN core.company_current h USING (company_id)
        CROSS JOIN LATERAL jsonb_each(to_jsonb(h)) f
        WHERE r.previous_state_id IS NOT NULL
          AND f.key = ANY(%(fields)s::text[])
          AND f.value IS DISTINCT FROM coalesce(r.previous_data->f.key, 'null'::jsonb);

        INSERT INTO core.company_event(company_id, event_type, title, description, detected_at,
            ingestion_run_id, company_change_ids, importance)
        SELECT r.company_id,
            CASE WHEN r.previous_state_id IS NULL THEN 'new_company' ELSE 'company_updated' END,
            CASE WHEN r.previous_state_id IS NULL THEN 'Nytt företag i databasen' ELSE 'Företagsdata ändrades' END,
            r.data->>'company_name', %(observed_at)s, %(run_id)s,
            array_agg(c.id ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL),
            coalesce(max(c.importance), 1)
        FROM changed_company r LEFT JOIN core.company_change c ON c.company_id = r.company_id
            AND c.ingestion_run_id = %(run_id)s AND c.detected_at = %(observed_at)s
        GROUP BY r.company_id, r.previous_state_id, r.data;
    ''', params | {'fields': list(FIELD_ALIASES)})
    cur.execute('''
        INSERT INTO core.company_event(company_id, event_type, title, detected_at,
            ingestion_run_id, company_change_ids, importance)
        SELECT company_id,
            CASE field_name
                WHEN 'employer_status_code' THEN 'became_employer'
                WHEN 'vat_status_code' THEN 'vat_registered'
                WHEN 'f_tax_status_code' THEN 'f_tax_registered'
                WHEN 'activity_status_code' THEN CASE WHEN new_value = '1' THEN 'company_active' ELSE 'company_inactive' END
                WHEN 'primary_industry_code' THEN 'changed_industry'
                WHEN 'seat_municipality_code' THEN 'changed_municipality'
            END,
            CASE field_name
                WHEN 'employer_status_code' THEN 'Registrerades som arbetsgivare'
                WHEN 'vat_status_code' THEN 'Registrerades för moms'
                WHEN 'f_tax_status_code' THEN 'Registrerades för F-skatt'
                WHEN 'activity_status_code' THEN 'Verksamhetsstatus ändrades'
                WHEN 'primary_industry_code' THEN 'Huvudbransch ändrades'
                WHEN 'seat_municipality_code' THEN 'Kommun ändrades'
            END,
            detected_at, ingestion_run_id, ARRAY[id], importance
        FROM core.company_change
        WHERE ingestion_run_id = %(run_id)s AND detected_at = %(observed_at)s
          AND ((field_name IN ('employer_status_code', 'vat_status_code', 'f_tax_status_code') AND new_value = '1')
            OR field_name IN ('activity_status_code', 'primary_industry_code', 'seat_municipality_code'))
    ''', params)
