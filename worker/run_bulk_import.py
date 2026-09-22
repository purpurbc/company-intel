from __future__ import annotations

import argparse
from datetime import date

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None

if load_dotenv:
    load_dotenv()


SCB_BULK_URL = "https://vardefulla-datamangder.bolagsverket.se/scb/scb_bulkfil.zip"
BOLAGSVERKET_BULK_URL = (
    "https://vardefulla-datamangder.bolagsverket.se/bolagsverket/"
    "bolagsverket_bulkfil.zip"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import weekly SCB/Bolagsverket bulk company files into the database.",
    )
    parser.add_argument(
        "--scb",
        default=None,
        help="Path to scb_bulkfil.zip or its unpacked .txt file.",
    )
    parser.add_argument(
        "--bolagsverket",
        default=None,
        help="Path to bolagsverket_bulkfil.zip or its unpacked .txt file.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20000,
        help="Rows to commit per batch. Defaults to 20000.",
    )
    parser.add_argument(
        "--progress-every",
        type=int,
        default=1000,
        help="Print progress every N parsed rows. Defaults to 1000.",
    )
    parser.add_argument(
        "--download-official",
        action="store_true",
        help="Use Bolagsverket's official weekly bulk-file URLs for missing paths.",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume a matching file checksum and filter from its committed checkpoint.",
    )
    parser.add_argument(
        "--include-non-orgnr",
        action="store_true",
        help=(
            "Also import Bolagsverket identity rows beyond ORGNR-IDORG and "
            "PERSON-IDORG. By default organization and person identities are imported."
        ),
    )
    parser.add_argument(
        "--bolagsverket-identity-type",
        action="append",
        default=None,
        help=(
            "Import only a specific Bolagsverket identity type. Can be passed "
            "multiple times, for example PERSON-IDORG."
        ),
    )
    parser.add_argument('--sni-version', default='2025', help='SCB bulk SNI edition; defaults to 2025.')
    parser.add_argument('--source-as-of-date', type=date.fromisoformat, help='Known file reference date, YYYY-MM-DD; never inferred from download time.')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.download_official:
        args.scb = args.scb or SCB_BULK_URL
        args.bolagsverket = args.bolagsverket or BOLAGSVERKET_BULK_URL

    if not args.scb and not args.bolagsverket:
        raise SystemExit("Pass --scb and/or --bolagsverket.")

    from worker.bulk_files.importer import BulkCompanyFileImporter

    importer = BulkCompanyFileImporter(
        batch_size=args.batch_size,
        progress_every=args.progress_every,
        sni_version=args.sni_version,
        source_as_of_date=args.source_as_of_date,
    )

    if args.scb:
        result = importer.import_scb_bulk_file(args.scb, resume=args.resume)
        print(
            "SCB bulk import done: "
            f"records_seen={result['records_seen']} "
            f"records_new={result['records_new']}"
        )

    if args.bolagsverket:
        result = importer.import_bolagsverket_bulk_file(
            args.bolagsverket,
            resume=args.resume,
            include_non_orgnr=args.include_non_orgnr,
            identity_types=(
                set(args.bolagsverket_identity_type)
                if args.bolagsverket_identity_type
                else None
            ),
        )
        print(
            "Bolagsverket bulk import done: "
            f"records_parsed={result['records_parsed']} "
            f"records_seen={result['records_seen']} "
            f"records_new={result['records_new']} "
            f"records_skipped={result['records_skipped']}"
        )


if __name__ == "__main__":
    main()
