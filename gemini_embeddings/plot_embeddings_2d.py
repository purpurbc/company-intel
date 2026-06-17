from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

from plot_utils import (
    OUTPUT_DIR,
    colors_for,
    legend_labels,
    load_embeddings_and_metadata,
    pca,
)


PLOT_PATH = OUTPUT_DIR / "company_embeddings_1000_matplotlib_2d.png"


def main():
    embeddings, metadata = load_embeddings_and_metadata()
    points = pca(embeddings, dimensions=2)
    colors, color_by_category = colors_for(metadata)

    fig, ax = plt.subplots(figsize=(13, 9), facecolor="#020617")
    ax.set_facecolor("#020617")
    ax.scatter(
        points[:, 0],
        points[:, 1],
        c=colors,
        s=18,
        alpha=0.72,
        linewidths=0,
    )

    ax.set_title(
        f"Company embeddings PCA 2D ({len(metadata)} companies)",
        color="#f8fafc",
        fontsize=16,
        fontweight="bold",
    )
    ax.set_xlabel("PCA 1", color="#94a3b8")
    ax.set_ylabel("PCA 2", color="#94a3b8")
    ax.tick_params(colors="#64748b")
    ax.grid(True, color="#1e293b", alpha=0.7, linewidth=0.8)

    handles = [
        Line2D(
            [0],
            [0],
            marker="o",
            color="none",
            label=f"{label} ({count})",
            markerfacecolor=color,
            markersize=8,
        )
        for _, label, count, color in legend_labels(metadata, color_by_category)
    ]
    if handles:
        legend = ax.legend(
            handles=handles,
            title="Top section / industry categories",
            loc="center left",
            bbox_to_anchor=(1.02, 0.5),
            frameon=True,
            fontsize=8,
            title_fontsize=9,
        )
        legend.get_frame().set_facecolor("#0f172a")
        legend.get_frame().set_edgecolor("#334155")
        legend.get_title().set_color("#f8fafc")
        for text in legend.get_texts():
            text.set_color("#cbd5e1")

    fig.tight_layout()
    fig.savefig(PLOT_PATH, dpi=180, bbox_inches="tight")
    print(f"Wrote {Path(PLOT_PATH).resolve()}")


if __name__ == "__main__":
    main()
