"use client";

import { useState } from "react";
import type {
  CompanyMetricSort,
  CompanyNameSort,
  SavedSegment,
  SavedSegmentPayload,
} from "@/src/lib/types";
import {
  FILTER_LABELS,
  filterValueLabel,
} from "@/src/lib/companyFilterLabels";
import { LIMIT_OPTIONS } from "@/src/components/ui/SearchBar";
import { SelectMenu } from "@/src/components/ui/SelectMenu";

type SavedSegmentDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialSegment?: SavedSegment | null;
  initialPayload?: SavedSegmentPayload;
  saving?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (payload: SavedSegmentPayload) => void;
};

const NAME_SORT_OPTIONS: { value: CompanyNameSort; label: string }[] = [
  { value: "asc", label: "A-Ö" },
  { value: "desc", label: "Ö-A" },
];

const METRIC_SORT_OPTIONS: { value: CompanyMetricSort; label: string }[] = [
  { value: "none", label: "Ingen" },
  { value: "turnover_asc", label: "Omsättning stigande" },
  { value: "turnover_desc", label: "Omsättning fallande" },
  { value: "size_asc", label: "Storlek stigande" },
  { value: "size_desc", label: "Storlek fallande" },
];

const LIMIT_MENU_OPTIONS = LIMIT_OPTIONS.map((option) => ({
  value: String(option),
  label: String(option),
}));

function asNameSort(value: unknown): CompanyNameSort {
  return value === "desc" ? "desc" : "asc";
}

function asMetricSort(value: unknown): CompanyMetricSort {
  return value === "turnover_asc" ||
    value === "turnover_desc" ||
    value === "size_asc" ||
    value === "size_desc"
    ? value
    : "none";
}

function asLimit(value: unknown) {
  return typeof value === "number" && value > 0 ? value : 100;
}

function filledEntries(record: Record<string, unknown> | undefined) {
  return Object.entries(record ?? {}).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
}

function SegmentFilterPreview({
  filters,
}: {
  filters: Record<string, unknown> | undefined;
}) {
  const entries = filledEntries(filters);

  return (
    <div className="rounded-md border border-app-border bg-app-panel-soft p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-app-text">Filter i urvalet</span>
        <span className="text-xs text-app-text-subtle">
          {entries.length} aktiva
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="mt-3 max-h-56 overflow-y-auto overscroll-contain pr-1">
          <div className="flex flex-wrap gap-2">
            {entries.map(([key, value]) => (
              <span
                key={key}
                className="rounded-md border border-app-border bg-app-panel px-2.5 py-1.5 text-xs text-app-text-muted"
              >
                <span className="font-medium text-app-text">
                  {FILTER_LABELS[key] ?? key}
                </span>
                : {filterValueLabel(key, value)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-app-text-subtle">
          Inga filter är aktiva. Segmentet sparar då grundsökningen.
        </p>
      )}
    </div>
  );
}

export function SavedSegmentDialog({
  open,
  mode,
  initialSegment,
  initialPayload,
  saving = false,
  error,
  onCancel,
  onSave,
}: SavedSegmentDialogProps) {
  if (!open) return null;

  return (
    <SavedSegmentDialogForm
      key={initialSegment?.id ?? "new-segment"}
      mode={mode}
      initialSegment={initialSegment}
      initialPayload={initialPayload}
      saving={saving}
      error={error}
      onCancel={onCancel}
      onSave={onSave}
    />
  );
}

function SavedSegmentDialogForm({
  mode,
  initialSegment,
  initialPayload,
  saving = false,
  error,
  onCancel,
  onSave,
}: Omit<SavedSegmentDialogProps, "open">) {
  const [name, setName] = useState(
    initialSegment?.name ?? initialPayload?.name ?? "",
  );
  const [description, setDescription] = useState(
    initialSegment?.description ?? initialPayload?.description ?? "",
  );
  const [intent, setIntent] = useState(
    initialSegment?.intent ?? initialPayload?.intent ?? "",
  );
  const [notes, setNotes] = useState(
    initialSegment?.notes ?? initialPayload?.notes ?? "",
  );

  const basePayload: SavedSegmentPayload = {
    name: initialSegment?.name ?? initialPayload?.name ?? "",
    ...(initialPayload ?? {}),
    ...(initialSegment
      ? {
          filters: initialSegment.filters,
          sort: initialSegment.sort,
          visibility: initialSegment.visibility,
          source: initialSegment.source,
          result_count: initialSegment.result_count,
          match_profile_id: initialSegment.match_profile_id,
        }
      : {}),
  };
  const initialSort = basePayload.sort ?? {};
  const [nameSort, setNameSort] = useState<CompanyNameSort>(
    asNameSort(initialSort.name_sort),
  );
  const [metricSort, setMetricSort] = useState<CompanyMetricSort>(
    asMetricSort(initialSort.metric_sort),
  );
  const [limit, setLimit] = useState(String(asLimit(initialSort.limit)));

  function submit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSave({
      ...basePayload,
      name: trimmedName,
      description: description.trim() || null,
      intent: intent.trim() || null,
      notes: notes.trim() || null,
      visibility: basePayload.visibility ?? "private",
      source: basePayload.source ?? "manual",
      sort: {
        ...(basePayload.sort ?? {}),
        name_sort: nameSort,
        metric_sort: metricSort,
        limit: Number(limit),
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-dialog-title"
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg border border-app-border bg-app-panel p-5 shadow-xl"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
            Saved segment
          </p>
          <h2
            id="segment-dialog-title"
            className="mt-1 text-lg font-semibold text-app-text"
          >
            {mode === "edit" ? "Redigera segment" : "Skapa segment"}
          </h2>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Namn
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Ex. IT-bolag i Stockholm"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Beskrivning
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Kort om varför segmentet finns."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-app-text-muted">
                Intent
              </span>
              <input
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="prospecting"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-app-text-muted">
                Anteckning
              </span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="Valfritt"
              />
            </label>
          </div>

          <div className="rounded-md border border-app-border bg-app-panel-soft p-3">
            <div className="text-sm font-medium text-app-text">Sortering</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <SelectMenu
                label="Namn"
                options={NAME_SORT_OPTIONS}
                value={nameSort}
                onChange={setNameSort}
                align="left"
              />
              <SelectMenu
                label="Sortera"
                options={METRIC_SORT_OPTIONS}
                value={metricSort}
                onChange={setMetricSort}
                align="left"
              />
              <SelectMenu
                label="Rader"
                options={LIMIT_MENU_OPTIONS}
                value={limit}
                onChange={setLimit}
                align="left"
              />
            </div>
          </div>

          <SegmentFilterPreview filters={basePayload.filters} />

          {error ? (
            <div className="rounded-md border border-app-danger-border bg-app-danger-bg px-3 py-2 text-sm text-app-danger-text">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-app-border-strong bg-app-panel px-4 py-2.5 text-sm font-medium text-app-text transition hover:bg-app-panel-hover"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !name.trim()}
            className="rounded-md bg-app-control-bg px-4 py-2.5 text-sm font-medium text-app-control-text transition hover:bg-app-control-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Sparar..." : "Spara segment"}
          </button>
        </div>
      </div>
    </div>
  );
}
