const sourceLabels: Record<string, string> = {
  scb_api: "SCB",
  scb_bulk: "SCB",
  bolagsverket: "Bolagsverket",
  // Legacy rows originate from the earlier SCB ingestion path. Keep that
  // implementation detail in admin; product views should name the authority.
  legacy: "SCB",
};

export function formatDataSources(
  sources: Array<string | null | undefined>,
  fallback = "SCB · Bolagsverket",
) {
  const labels = Array.from(
    new Set(
      sources
        .filter((source): source is string => Boolean(source))
        .map((source) => sourceLabels[source] ?? source),
    ),
  );
  return labels.length ? labels.join(" · ") : fallback;
}
