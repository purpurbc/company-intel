"""CLI for downloading Bolagsverket's monthly aggregate statistics."""

from __future__ import annotations

import argparse
from pathlib import Path

from worker.bolagsverket_statistics import (
    DATASETS,
    download_dataset,
    select_dataset_keys,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download and validate Bolagsverket's public CSV statistics.",
    )
    parser.add_argument(
        "--dataset",
        action="append",
        choices=("all", *DATASETS),
        help="Dataset to download. Repeat the option or omit it for all datasets.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/bolagsverket_statistics"),
        help="Destination directory. Defaults to data/bolagsverket_statistics.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip HTTP cache validators and check the complete source again.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=120,
        help="Timeout per HTTP request. Defaults to 120 seconds.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.timeout_seconds < 1:
        raise SystemExit("--timeout-seconds must be at least 1.")

    for key in select_dataset_keys(args.dataset):
        result = download_dataset(
            DATASETS[key],
            args.output_dir,
            force=args.force,
            timeout_seconds=args.timeout_seconds,
        )
        size_mb = result.size_bytes / 1024 / 1024
        print(f"{key}: {result.status}, {size_mb:.1f} MiB, {result.path}")


if __name__ == "__main__":
    main()
