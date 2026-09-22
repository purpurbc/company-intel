"""Download and/or import Bolagsverket's aggregate statistics snapshots."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None

from worker.bolagsverket_statistics import (
    DATASETS,
    download_dataset,
    select_dataset_keys,
)


if load_dotenv:
    load_dotenv()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dataset",
        action="append",
        choices=("all", *DATASETS),
        help="Dataset to import. Repeat the option or omit it for all datasets.",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path("data/bolagsverket_statistics"),
        help="Directory containing the CSV files.",
    )
    parser.add_argument(
        "--download-official",
        action="store_true",
        help="Download and validate the selected official files before import.",
    )
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Ignore HTTP validators when downloading official files.",
    )
    parser.add_argument(
        "--resume",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Resume or reuse an import with the same file checksum (default: true).",
    )
    parser.add_argument(
        "--allow-large-removal",
        action="store_true",
        help="Publish a verified snapshot even when many current keys disappear.",
    )
    parser.add_argument("--batch-size", type=int, default=20_000)
    parser.add_argument("--progress-every", type=int, default=10_000)
    parser.add_argument("--timeout-seconds", type=int, default=120)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.timeout_seconds < 1:
        raise SystemExit("--timeout-seconds must be at least 1.")

    selected = select_dataset_keys(args.dataset)
    paths: dict[str, Path] = {}
    for key in selected:
        dataset = DATASETS[key]
        if args.download_official:
            result = download_dataset(
                dataset,
                args.input_dir,
                force=args.force_download,
                timeout_seconds=args.timeout_seconds,
            )
            print(f"{key}: download {result.status}, {result.path}")
            paths[key] = result.path
        else:
            paths[key] = args.input_dir / dataset.filename

    from worker.bolagsverket_statistics.importer import (
        BolagsverketStatisticsImporter,
    )

    importer = BolagsverketStatisticsImporter(
        batch_size=args.batch_size,
        progress_every=args.progress_every,
    )
    for key in selected:
        result = importer.import_file(
            key,
            paths[key],
            resume=args.resume,
            allow_large_removal=args.allow_large_removal,
        )
        print(
            f"{key}: rows={result['snapshot_rows']:,}, "
            f"new={result['records_new']:,}, "
            f"changed={result['records_changed']:,}, "
            f"removed={result['records_removed']:,}"
        )


if __name__ == "__main__":
    main()
