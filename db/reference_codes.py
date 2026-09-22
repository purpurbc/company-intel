"""Seed geography from the checked-in SCB code tables, independently of company coverage."""
import json
from pathlib import Path


def seed_geography(conn):
    directory = Path(__file__).parents[1] / 'worker/scb/data/Je/Kodtabell'
    rows = []
    for domain, filename in (
        ('seat_county_code', 'Je_Kodtabell_SätesLän.json'),
        ('seat_municipality_code', 'Je_Kodtabell_SätesKommun.json'),
    ):
        payload = json.loads((directory / filename).read_text(encoding='utf-8'))
        for entry in payload['VardeLista']:
            code = entry['Varde']
            rows.append(('scb_api', domain, code, entry['Text'], code[:2] if domain == 'seat_municipality_code' else None))
    with conn.cursor() as cur:
        cur.executemany('''INSERT INTO meta.code(source, domain, code, name, parent_code)
            VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING''', rows)
