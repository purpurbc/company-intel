"""Read and normalize the local bulk files without touching any database."""
import time

from worker.bulk_files.parser import iter_delimited_rows, parse_bolagsverket_bulk_row, parse_scb_bulk_row
from worker.ingest.adapters import bolagsverket_record, scb_bulk_record


def main():
    for path, delimiter, parse, adapt in (
        ('data/scb_bulkfil.zip', '\t', parse_scb_bulk_row, scb_bulk_record),
        ('data/bolagsverket_bulkfil.zip', ';', parse_bolagsverket_bulk_row, bolagsverket_record),
    ):
        tick = time.monotonic()
        count = 0
        for row in iter_delimited_rows(path, delimiter):
            try:
                record = adapt(parse(row))
                industries = record.data.get('_industries', [])
                if len({i['sni_code'] for i in industries}) != len(industries):
                    raise ValueError('Repeated SNI codes in the same source record')
            except Exception as exc:
                raise ValueError(f'{path}: source record {row.source_row_number}: {exc}') from exc
            count += 1
            if count % 100000 == 0:
                print(f'{path}: {count:,} valid records, {time.monotonic() - tick:.1f}s', flush=True)
        print(f'{path}: complete, {count:,} records, {time.monotonic() - tick:.1f}s', flush=True)


if __name__ == '__main__':
    main()
