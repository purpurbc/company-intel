import csv
import html
import json
import os
from company_client import CompanyClient
from gemini_client import GeminiClient
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

import numpy as np


OUTPUT_DIR = Path("gemini_embeddings/output")
SAMPLE_SIZE = int(os.getenv("EMBED_SAMPLE_SIZE", "50"))
BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "10"))
DIMENSIONALITY = int(os.getenv("EMBED_DIMENSIONALITY", "128"))


def display(value):
    return str(value).strip() if value not in (None, "") else "-"


def company_dict_to_text(company: dict) -> str:
    return (
        f"Company: {display(company.get('company_name'))}. "
        f"Org nr: {display(company.get('org_nr'))}. "
        f"Industry: {display(company.get('bransch_1_name_dim') or company.get('bransch_1'))}. "
        f"Industry code: {display(company.get('bransch_1_code'))}. "
        f"Section: {display(company.get('avdelning_1_name_dim') or company.get('avdelning_1'))}. "
        f"Location: {display(company.get('seat_municipality_name') or company.get('seat_municipality'))}, "
        f"{display(company.get('seat_county_name') or company.get('seat_county'))}. "
        f"Size: {display(company.get('size_class_name_dim') or company.get('size_class'))}. "
        f"Turnover: {display(company.get('turnover_gross_name_dim') or company.get('turnover_size'))}. "
        f"Legal form: {display(company.get('legal_form_name_dim') or company.get('legal_form'))}. "
        f"Status: {display(company.get('company_status_name_dim') or company.get('company_status'))}."
    )


def pca_2d(embeddings: np.ndarray) -> np.ndarray:
    centered = embeddings - embeddings.mean(axis=0, keepdims=True)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    return centered @ vt[:2].T


def color_for(value: str) -> str:
    palette = [
        "#34d399", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa",
        "#fb7185", "#22d3ee", "#84cc16", "#f97316", "#e879f9",
        "#14b8a6", "#c084fc", "#38bdf8", "#facc15", "#4ade80",
    ]
    return palette[abs(hash(value)) % len(palette)]


def write_svg_plot(companies: list[dict], points: np.ndarray, path: Path):
    width = 1200
    height = 900
    padding = 50

    x = points[:, 0]
    y = points[:, 1]
    x_span = max(float(x.max() - x.min()), 1e-9)
    y_span = max(float(y.max() - y.min()), 1e-9)
    x_scaled = padding + ((x - x.min()) / x_span) * (width - padding * 2)
    y_scaled = height - padding - ((y - y.min()) / y_span) * (height - padding * 2)

    circles = []
    for company, px, py in zip(companies, x_scaled, y_scaled):
        section = display(company.get("avdelning_1_code"))
        title = html.escape(
            f"{display(company.get('company_name'))} | "
            f"{display(company.get('bransch_1_name_dim') or company.get('bransch_1'))} | "
            f"{display(company.get('seat_county_name') or company.get('seat_county'))}"
        )
        circles.append(
            f'<circle cx="{px:.2f}" cy="{py:.2f}" r="4" '
            f'fill="{color_for(section)}" fill-opacity="0.68">'
            f"<title>{title}</title></circle>"
        )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="#020617"/>
  <text x="{padding}" y="32" fill="#f8fafc" font-family="Arial" font-size="18" font-weight="700">
    Company embeddings PCA plot ({len(companies)} companies)
  </text>
  <text x="{padding}" y="54" fill="#94a3b8" font-family="Arial" font-size="12">
    Color is based on avdelning_1_code. Hover points for company details.
  </text>
  <g>
    {''.join(circles)}
  </g>
</svg>
"""
    path.write_text(svg, encoding="utf-8")


def save_outputs(companies: list[dict], texts: list[str], embeddings: np.ndarray):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    np.save(OUTPUT_DIR / "company_embeddings_1000.npy", embeddings)

    metadata_path = OUTPUT_DIR / "company_embedding_metadata_1000.csv"
    with metadata_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["org_nr", "company_name", "section_code", "industry", "county", "embedding_text"])
        for company, text in zip(companies, texts):
            writer.writerow([
                company.get("org_nr"),
                company.get("company_name"),
                company.get("avdelning_1_code"),
                company.get("bransch_1_name_dim") or company.get("bransch_1"),
                company.get("seat_county_name") or company.get("seat_county"),
                text,
            ])


def main():
    api_key = os.getenv("GEMINI_DEV_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_DEV_API_KEY is missing.")

    if not os.getenv("EMBEDDINGS_MODEL"):
        raise RuntimeError("EMBEDDINGS_MODEL is missing.")

    company_client = CompanyClient()
    companies = company_client.get_companies(limit=SAMPLE_SIZE)
    texts = [company_dict_to_text(company) for company in companies]

    client = GeminiClient(api_key, dimensionality=DIMENSIONALITY)
    vectors = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start:start + BATCH_SIZE]
        print(f"Embedding {start + 1}-{start + len(batch)} of {len(texts)}")
        vectors.extend(client.embed_texts(batch))

    embeddings = np.asarray(vectors, dtype=np.float32)
    points = pca_2d(embeddings)

    save_outputs(companies, texts, embeddings)
    write_svg_plot(companies, points, OUTPUT_DIR / "company_embeddings_1000_pca.svg")

    print(json.dumps({
        "companies": len(companies),
        "dimensions": int(embeddings.shape[1]),
        "embedding_file": str(OUTPUT_DIR / "company_embeddings_1000.npy"),
        "metadata_file": str(OUTPUT_DIR / "company_embedding_metadata_1000.csv"),
        "plot_file": str(OUTPUT_DIR / "company_embeddings_1000_pca.svg"),
    }, indent=2))


if __name__ == "__main__":
    main()
