import csv
from collections import Counter
from pathlib import Path

import numpy as np


OUTPUT_DIR = Path("gemini_embeddings/output")
EMBEDDINGS_PATH = OUTPUT_DIR / "company_embeddings_1000.npy"
METADATA_PATH = OUTPUT_DIR / "company_embedding_metadata_1000.csv"

CATEGORY_COLUMN = "section_code"
LABEL_COLUMN = "industry"

PALETTE = [
    "#34d399",
    "#60a5fa",
    "#f59e0b",
    "#f472b6",
    "#a78bfa",
    "#fb7185",
    "#22d3ee",
    "#84cc16",
    "#f97316",
    "#e879f9",
    "#14b8a6",
    "#c084fc",
    "#38bdf8",
    "#facc15",
    "#4ade80",
]


def load_embeddings_and_metadata():
    embeddings = np.load(EMBEDDINGS_PATH)

    with METADATA_PATH.open("r", encoding="utf-8", newline="") as file:
        metadata = list(csv.DictReader(file))

    if len(metadata) != len(embeddings):
        raise ValueError(
            f"Metadata rows ({len(metadata)}) do not match embeddings ({len(embeddings)})."
        )

    return embeddings, metadata


def pca(embeddings: np.ndarray, dimensions: int):
    centered = embeddings - embeddings.mean(axis=0, keepdims=True)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    return centered @ vt[:dimensions].T


def category_value(row: dict):
    value = row.get(CATEGORY_COLUMN) or "Unknown"
    return value.strip() or "Unknown"


def category_label(row: dict):
    category = category_value(row)
    label = row.get(LABEL_COLUMN) or "Unknown"
    label = label.strip() or "Unknown"
    return f"{category} - {label}"


def top_categories(metadata: list[dict], max_categories: int = 12):
    counts = Counter(category_value(row) for row in metadata)
    return [category for category, _ in counts.most_common(max_categories)]


def colors_for(metadata: list[dict], max_categories: int = 12):
    top = top_categories(metadata, max_categories=max_categories)
    color_by_category = {
        category: PALETTE[index % len(PALETTE)]
        for index, category in enumerate(top)
    }
    colors = [
        color_by_category.get(category_value(row), "#64748b")
        for row in metadata
    ]
    return colors, color_by_category


def legend_labels(metadata: list[dict], color_by_category: dict[str, str]):
    first_label = {}
    counts = Counter(category_value(row) for row in metadata)

    for row in metadata:
        category = category_value(row)
        if category in color_by_category and category not in first_label:
            first_label[category] = category_label(row)

    return [
        (category, first_label.get(category, category), counts[category], color)
        for category, color in color_by_category.items()
    ]
