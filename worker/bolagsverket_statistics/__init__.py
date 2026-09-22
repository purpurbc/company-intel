"""Download contracts for Bolagsverket's public aggregate statistics."""

from .catalog import DATASETS, DatasetDefinition, select_dataset_keys
from .downloader import (
    DownloadResult,
    DownloadValidationError,
    download_dataset,
)

__all__ = [
    "DATASETS",
    "DatasetDefinition",
    "DownloadResult",
    "DownloadValidationError",
    "download_dataset",
    "select_dataset_keys",
]
