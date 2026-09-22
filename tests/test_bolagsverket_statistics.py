import io
import json
from urllib.error import HTTPError

import pytest

from worker.bolagsverket_statistics import (
    DATASETS,
    DownloadValidationError,
    download_dataset,
)


class FakeResponse(io.BytesIO):
    def __init__(self, payload: bytes, headers: dict[str, str] | None = None):
        super().__init__(payload)
        self.headers = headers or {}

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()


def csv_payload(dataset_key: str, *, data_row: str = "1") -> bytes:
    dataset = DATASETS[dataset_key]
    header = dataset.delimiter.join(dataset.required_headers)
    return f"{header}\n{data_row}\n".encode("utf-8")


def test_download_validates_and_writes_source_and_manifest_atomically(tmp_path):
    dataset = DATASETS["filing_delays"]
    payload = csv_payload(dataset.key)

    result = download_dataset(
        dataset,
        tmp_path,
        opener=lambda _request, timeout: FakeResponse(
            payload,
            {"ETag": '"v1"', "Last-Modified": "Mon, 14 Sep 2026 08:00:00 GMT"},
        ),
    )

    assert result.status == "downloaded"
    assert result.path.read_bytes() == payload
    manifest = json.loads(result.manifest_path.read_text(encoding="utf-8"))
    assert manifest["dataset"] == dataset.key
    assert manifest["delimiter"] == ";"
    assert manifest["headers"] == list(dataset.required_headers)
    assert manifest["license"]["name"] == "CC BY 2.5 SE"
    assert manifest["sha256"] == result.sha256


def test_invalid_response_never_replaces_existing_file(tmp_path):
    dataset = DATASETS["auditor_reservations"]
    existing = tmp_path / dataset.filename
    existing.write_bytes(csv_payload(dataset.key, data_row="old"))

    with pytest.raises(DownloadValidationError, match="HTML"):
        download_dataset(
            dataset,
            tmp_path,
            opener=lambda _request, timeout: FakeResponse(
                b"<!doctype html><html>captcha</html>\n"
            ),
        )

    assert existing.read_bytes() == csv_payload(dataset.key, data_row="old")
    assert not list(tmp_path.glob("*.tmp"))


def test_missing_required_header_is_rejected(tmp_path):
    dataset = DATASETS["companies"]

    with pytest.raises(DownloadValidationError, match="saknar förväntade kolumner"):
        download_dataset(
            dataset,
            tmp_path,
            opener=lambda _request, timeout: FakeResponse(b"ar,manad\n2026,9\n"),
        )


def test_http_304_reuses_the_valid_local_file(tmp_path):
    dataset = DATASETS["representatives"]
    first = download_dataset(
        dataset,
        tmp_path,
        opener=lambda _request, timeout: FakeResponse(
            csv_payload(dataset.key), {"ETag": '"representatives-v1"'}
        ),
    )
    observed_headers = {}

    def not_modified(request, timeout):
        observed_headers.update(dict(request.header_items()))
        raise HTTPError(request.full_url, 304, "Not Modified", {}, None)

    second = download_dataset(dataset, tmp_path, opener=not_modified)

    assert first.status == "downloaded"
    assert second.status == "unchanged"
    assert observed_headers["If-none-match"] == '"representatives-v1"'
