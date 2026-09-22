"""Safe, repeatable downloads of Bolagsverket's aggregate CSV statistics."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from .catalog import DatasetDefinition


USER_AGENT = "company-intel/1.0 (Bolagsverket open-data importer)"
READ_BLOCK_SIZE = 1024 * 1024
HEADER_READ_LIMIT = 256 * 1024


class DownloadValidationError(ValueError):
    """The response is not a valid instance of the expected CSV contract."""


@dataclass(frozen=True, slots=True)
class DownloadResult:
    dataset_key: str
    path: Path
    manifest_path: Path
    status: str
    size_bytes: int
    sha256: str


def _load_manifest(path: Path) -> dict:
    if not path.is_file():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def _atomic_write_json(path: Path, value: dict) -> None:
    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as stream:
            json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
            stream.write("\n")
        os.replace(temporary_path, path)
    finally:
        temporary_path.unlink(missing_ok=True)


def _looks_like_html(prefix: bytes) -> bool:
    sample = prefix.lstrip(b"\xef\xbb\xbf\x00\t\r\n ").lower()
    return any(
        marker in sample
        for marker in (
            b"<!doctype html",
            b"<html",
            b"please enable javascript",
            b"what code is in the image",
        )
    )


def _decode_header(raw_header: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return raw_header.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise DownloadValidationError("CSV-rubriken använder en okänd teckenkodning.")


def _validate_csv(path: Path, dataset: DatasetDefinition) -> list[str]:
    with path.open("rb") as stream:
        prefix = stream.read(HEADER_READ_LIMIT)

    if not prefix:
        raise DownloadValidationError(f"{dataset.filename} är tom.")
    if _looks_like_html(prefix):
        raise DownloadValidationError(
            f"{dataset.filename} innehåller HTML i stället för CSV."
        )

    lines = prefix.splitlines()
    if len(lines) < 2:
        raise DownloadValidationError(
            f"{dataset.filename} saknar datarader eller har en för lång rubrikrad."
        )

    header_text = _decode_header(lines[0])
    try:
        observed = next(csv.reader(io.StringIO(header_text), delimiter=dataset.delimiter))
    except (csv.Error, StopIteration) as error:
        raise DownloadValidationError(
            f"Rubriken i {dataset.filename} kunde inte läsas."
        ) from error

    observed = [value.strip() for value in observed]
    missing = [value for value in dataset.required_headers if value not in observed]
    if missing:
        raise DownloadValidationError(
            f"{dataset.filename} saknar förväntade kolumner: {', '.join(missing)}."
        )
    return observed


def _request_headers(manifest: dict, *, force: bool) -> dict[str, str]:
    headers = {
        "Accept": "text/csv,text/x-comma-separated-values,*/*;q=0.1",
        "User-Agent": USER_AGENT,
    }
    if force:
        return headers
    if etag := manifest.get("etag"):
        headers["If-None-Match"] = str(etag)
    if modified := manifest.get("last_modified"):
        headers["If-Modified-Since"] = str(modified)
    return headers


def _not_modified_result(
    dataset: DatasetDefinition, target: Path, manifest_path: Path, manifest: dict
) -> DownloadResult:
    if not target.is_file():
        raise DownloadValidationError(
            "Servern svarade 304 men den lokala statistikfilen saknas."
        )
    return DownloadResult(
        dataset_key=dataset.key,
        path=target,
        manifest_path=manifest_path,
        status="unchanged",
        size_bytes=target.stat().st_size,
        sha256=str(manifest.get("sha256") or ""),
    )


def download_dataset(
    dataset: DatasetDefinition,
    output_dir: str | Path,
    *,
    force: bool = False,
    timeout_seconds: int = 120,
    opener: Callable = urlopen,
) -> DownloadResult:
    """Download, validate and atomically publish one statistics file.

    A manifest stores validators and provenance beside the source file. Existing
    files remain untouched when the server response is invalid or interrupted.
    """

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / dataset.filename
    manifest_path = destination / f"{dataset.filename}.metadata.json"
    previous_manifest = _load_manifest(manifest_path) if target.is_file() else {}
    request = Request(
        dataset.url,
        headers=_request_headers(previous_manifest, force=force),
        method="GET",
    )

    try:
        response = opener(request, timeout=timeout_seconds)
    except HTTPError as error:
        if error.code == 304:
            return _not_modified_result(
                dataset, target, manifest_path, previous_manifest
            )
        raise

    handle, temporary_name = tempfile.mkstemp(
        prefix=f".{dataset.filename}.", suffix=".tmp", dir=destination
    )
    os.close(handle)
    temporary_path = Path(temporary_name)
    digest = hashlib.sha256()
    size_bytes = 0

    try:
        with response, temporary_path.open("wb") as output:
            while block := response.read(READ_BLOCK_SIZE):
                output.write(block)
                digest.update(block)
                size_bytes += len(block)

        observed_headers = _validate_csv(temporary_path, dataset)
        checksum = digest.hexdigest()
        previous_checksum = str(previous_manifest.get("sha256") or "")
        changed = not target.is_file() or checksum != previous_checksum
        if changed:
            os.replace(temporary_path, target)
        else:
            temporary_path.unlink()

        response_headers = response.headers
        manifest = {
            "dataset": dataset.key,
            "description": dataset.description,
            "delimiter": dataset.delimiter,
            "downloaded_at_utc": datetime.now(timezone.utc).isoformat(),
            "etag": response_headers.get("ETag"),
            "filename": dataset.filename,
            "headers": observed_headers,
            "last_modified": response_headers.get("Last-Modified"),
            "license": {
                "name": dataset.license_name,
                "url": dataset.license_url,
            },
            "sha256": checksum,
            "size_bytes": size_bytes,
            "source_url": dataset.url,
            "update_frequency": dataset.update_frequency,
        }
        _atomic_write_json(manifest_path, manifest)
        return DownloadResult(
            dataset_key=dataset.key,
            path=target,
            manifest_path=manifest_path,
            status="downloaded" if changed else "unchanged",
            size_bytes=size_bytes,
            sha256=checksum,
        )
    finally:
        temporary_path.unlink(missing_ok=True)
