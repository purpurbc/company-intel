"use client";

import { useState } from "react";
import type {
  CompanyMetricSort,
  CompanyNameSort,
  SavedSegment,
  SavedSegmentPayload,
} from "@/src/lib/types";
import {
  CompanyFilterEditor,
} from "@/src/components/company/CompanyFilterEditor";
import {
  companyFilterRecordFromState,
  companyFilterStateFromRecord,
} from "@/src/lib/companyFilterState";
import {
  COMPANY_METRIC_SORT_OPTIONS,
  COMPANY_NAME_SORT_OPTIONS,
  companyMetricSortValue,
  companyNameSortValue,
} from "@/src/lib/companySearchOptions";
import { COMPANY_PAGE_SIZE_OPTIONS } from "@/src/lib/pagination";
import { Button } from "@/src/components/ui/Button";
import { Dialog } from "@/src/components/ui/Dialog";
import { Feedback } from "@/src/components/ui/Feedback";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { Inset } from "@/src/components/ui/Surface";
import { ui } from "@/src/lib/uiStyles";

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

const LIMIT_MENU_OPTIONS = COMPANY_PAGE_SIZE_OPTIONS.map((option) => ({
  value: String(option),
  label: String(option),
}));

function asLimit(value: unknown) {
  return typeof value === "number" && value > 0 ? value : 100;
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
  const [filterDraft, setFilterDraft] = useState(() =>
    companyFilterStateFromRecord(basePayload.filters),
  );
  const [nameSort, setNameSort] = useState<CompanyNameSort>(
    companyNameSortValue(initialSort.name_sort),
  );
  const [metricSort, setMetricSort] = useState<CompanyMetricSort>(
    companyMetricSortValue(initialSort.metric_sort),
  );
  const [limit, setLimit] = useState(String(asLimit(initialSort.limit)));

  function submit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onSave({
      ...basePayload,
      name: trimmedName,
      description: description.trim() || null,
      visibility: basePayload.visibility ?? "private",
      source: basePayload.source ?? "manual",
      filters: companyFilterRecordFromState(
        filterDraft,
        basePayload.filters,
      ),
      sort: {
        ...(basePayload.sort ?? {}),
        name_sort: nameSort,
        metric_sort: metricSort,
        limit: Number(limit),
      },
    });
  }

  return (
    <Dialog
      labelledBy="segment-dialog-title"
      title={mode === "edit" ? "Redigera segment" : "Skapa nytt segment"}
      width="lg"
      onClose={onCancel}
      footer={
        <>
          <Button type="button" onClick={onCancel} variant="secondary">
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={submit}
            variant="accent"
            disabled={saving || !name.trim()}
          >
            {saving ? "Sparar..." : "Spara segment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className={ui.label}>Namn</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={[ui.input, "mt-2"].join(" ")}
            placeholder="Ex. IT-bolag i Stockholm"
          />
        </label>

        <label className="block">
          <span className={ui.label}>Beskrivning</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={[ui.textarea, "mt-2 min-h-24"].join(" ")}
            placeholder="Kort om varför segmentet finns."
          />
        </label>

        <Inset>
          <div className="text-sm font-medium text-app-text">Sortering</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <SelectMenu
              label="Namn"
              options={COMPANY_NAME_SORT_OPTIONS}
              value={nameSort}
              onChange={setNameSort}
              align="left"
            />
            <SelectMenu
              label="Sortera"
              options={COMPANY_METRIC_SORT_OPTIONS}
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
        </Inset>

        <CompanyFilterEditor
          value={filterDraft}
          onChange={setFilterDraft}
        />

        {error ? (
          <Feedback tone="danger">{error}</Feedback>
        ) : null}
      </div>
    </Dialog>
  );
}
