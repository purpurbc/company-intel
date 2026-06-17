"use client";

import { useState } from "react";
import {
  deleteSavedSegment,
  refreshSavedSegmentCount,
  touchSavedSegment,
  updateSavedSegment,
} from "@/src/lib/api";
import type {
  CompanyMetricSort,
  CompanyNameSort,
  CompanySearchBy,
  SavedSegment,
  SavedSegmentPayload,
} from "@/src/lib/types";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { SavedSegmentDialog } from "@/src/components/profile/SavedSegmentDialog";
import { Button } from "@/src/components/ui/Button";
import { List, ListItem } from "@/src/components/ui/List";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ToggleButton } from "@/src/components/ui/ToggleButton";
import {
  FILTER_LABELS,
  filterValueLabel,
} from "@/src/lib/companyFilterLabels";

const DASHBOARD_SESSION_KEY = "company-intel-dashboard-search";

const UTILITY_ICONS = {
  edit: "/icons/utility/edit.svg",
  update: "/icons/utility/update.svg",
  delete: "/icons/utility/trashcan_delete.svg",
};

type SavedSegmentsListProps = {
  segments: SavedSegment[];
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  }).format(new Date(value));
}

function filledEntries(record: Record<string, unknown>) {
  return Object.entries(record).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asLimit(value: unknown) {
  const numberValue = asNumber(value);
  return numberValue && numberValue > 0 ? numberValue : 100;
}

function asSearchBy(value: unknown): CompanySearchBy {
  return value === "company_name" || value === "org_nr" || value === "all"
    ? value
    : "all";
}

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

function applySegmentFilters(segment: SavedSegment) {
  const filters = segment.filters ?? {};
  const sort = segment.sort ?? {};
  const ageMin = asNumber(filters.age_min);
  const ageMax = asNumber(filters.age_max);

  sessionStorage.setItem(
    DASHBOARD_SESSION_KEY,
    JSON.stringify({
      q: asString(filters.q),
      searchBy: asSearchBy(filters.search_by),
      limit: asLimit(sort.limit),
      compactList: false,
      countyCodes: asStringArray(filters.county_codes),
      municipalityCodes: asStringArray(filters.municipality_codes),
      companyStatusCodes: asStringArray(filters.company_status_codes),
      companyStateCodes: asStringArray(filters.company_state_codes),
      employerStatusCodes: asStringArray(filters.employer_status_codes),
      vatStatusCodes: asStringArray(filters.vat_status_codes),
      fTaxStatusCodes: asStringArray(filters.f_tax_status_codes),
      marketingStatusCodes: asStringArray(filters.marketing_status_codes),
      sizeClassCodes: asStringArray(filters.size_class_codes),
      companyAgeRange: [ageMin ?? 0, ageMax ?? 100],
      postOrt: asString(filters.post_ort),
      postNr: asString(filters.post_nr),
      ownerCategoryCodes: asStringArray(filters.owner_category_codes),
      smeSizeCodes: asStringArray(filters.sme_size_codes),
      exportImportMarks: asStringArray(filters.export_import_marks),
      sectionCodes: asStringArray(filters.section_codes),
      industryCodes: asStringArray(filters.industry_codes),
      industryDetailCodes: asStringArray(filters.industry_detail_codes),
      turnoverSizeCodes: asStringArray(filters.turnover_size_codes),
      nameSort: asNameSort(sort.name_sort),
      metricSort: asMetricSort(sort.metric_sort),
      offset: 0,
      resultCount: segment.result_count,
      activeSegment: {
        id: segment.id,
        name: segment.name,
        filters: segment.filters ?? {},
        sort: segment.sort ?? {},
      },
    }),
  );

  void touchSavedSegment(segment.id).catch(() => undefined);
  window.location.href = "/";
}

function clearActiveSegmentIfMatches(segmentId: string) {
  let parsed: Record<string, unknown>;

  try {
    const raw = sessionStorage.getItem(DASHBOARD_SESSION_KEY);
    if (!raw) return;
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  const activeSegment = parsed.activeSegment;
  if (
    typeof activeSegment === "object" &&
    activeSegment !== null &&
    "id" in activeSegment &&
    (activeSegment as { id?: unknown }).id === segmentId
  ) {
    sessionStorage.setItem(
      DASHBOARD_SESSION_KEY,
      JSON.stringify({ ...parsed, activeSegment: null }),
    );
  }
}

function syncActiveSegmentIfMatches(segment: SavedSegment) {
  let parsed: Record<string, unknown>;

  try {
    const raw = sessionStorage.getItem(DASHBOARD_SESSION_KEY);
    if (!raw) return;
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  const activeSegment = parsed.activeSegment;
  if (
    typeof activeSegment === "object" &&
    activeSegment !== null &&
    "id" in activeSegment &&
    (activeSegment as { id?: unknown }).id === segment.id
  ) {
    sessionStorage.setItem(
      DASHBOARD_SESSION_KEY,
      JSON.stringify({
        ...parsed,
        activeSegment: {
          id: segment.id,
          name: segment.name,
          filters: segment.filters ?? {},
          sort: segment.sort ?? {},
        },
      }),
    );
  }
}

function SegmentDetails({ segment }: { segment: SavedSegment }) {
  const filters = filledEntries(segment.filters);
  const sort = filledEntries(segment.sort);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
          Filter
        </div>
        {filters.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.map(([key, value]) => (
              <span
                key={key}
                className="rounded-md border border-app-border bg-app-panel-soft px-2.5 py-1.5 text-xs text-app-text-muted"
              >
                <span className="font-medium text-app-text">
                  {FILTER_LABELS[key] ?? key}
                </span>
                : {filterValueLabel(key, value)}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-app-text-subtle">
            Inga filter sparade ännu.
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
          Sortering
        </div>
        {sort.length > 0 ? (
          <div className="mt-2 space-y-2">
            {sort.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-panel-soft px-3 py-2 text-sm"
              >
                <span className="text-app-text-muted">{key}</span>
                <span className="font-medium text-app-text">
                  {filterValueLabel(key, value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-app-text-subtle">
            Standard sortering.
          </div>
        )}
      </div>
    </div>
  );
}

export function SavedSegmentsList({ segments }: SavedSegmentsListProps) {
  const [compact, setCompact] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState(segments);
  const [editing, setEditing] = useState<SavedSegment | null>(null);
  const [deleting, setDeleting] = useState<SavedSegment | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function saveEditedSegment(payload: SavedSegmentPayload) {
    if (!editing) return;

    setSaving(true);
    setActionError(null);

    try {
      const updated = await updateSavedSegment(editing.id, payload);
      setItems((current) =>
        current.map((segment) => segment.id === updated.id ? updated : segment),
      );
      setEditing(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte spara segmentet.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateSegmentFromDashboard(segment: SavedSegment) {
    setSaving(true);
    setActionError(null);

    try {
      const updated = await refreshSavedSegmentCount(segment.id);
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      syncActiveSegmentIfMatches(updated);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Kunde inte uppdatera segmentet.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;

    try {
      await deleteSavedSegment(deleting.id);
      setItems((current) =>
        current.filter((segment) => segment.id !== deleting.id),
      );
      clearActiveSegmentIfMatches(deleting.id);
      setDeleting(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte ta bort segmentet.",
      );
      setDeleting(null);
    }
  }

  return (
    <>
      <List
        eyebrow="Segment"
        title="Mina sparade segment"
        collapsed={collapsed}
        empty={
          items.length === 0
            ? "Inga sparade segment ännu. Senare kan dashboardens aktiva filter sparas hit."
            : null
        }
        actions={
          <>
            <Button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              variant="secondary"
              size="sm"
            >
              {collapsed ? "Visa" : "Minimera"}
            </Button>
            <ToggleButton
              value={compact ? "compact" : "card"}
              options={[
                { value: "card", label: "Kort" },
                { value: "compact", label: "Kompakt" },
              ]}
              onChange={(value) => setCompact(value === "compact")}
              ariaLabel="Visningsläge för segment"
            />
          </>
        }
      >
        {!collapsed && actionError ? (
          <div className="border-b border-app-border px-5 py-3 text-sm text-app-danger-text">
            {actionError}
          </div>
        ) : null}

        {items.map((segment, index) => {
          if (compact) {
            return (
              <ListItem key={segment.id} compact numbered index={index + 1}>
                <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
                    <h3 className="truncate text-sm font-semibold text-app-text">
                      {segment.name}
                    </h3>
                    <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-app-text-subtle">
                      <span>
                        {segment.result_count?.toLocaleString("sv-SE") ?? "-"} företag
                      </span>
                      <span>Uppdaterad {formatDate(segment.updated_at)}</span>
                      <span>{segment.visibility}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      onClick={() => applySegmentFilters(segment)}
                      variant="primary"
                      size="xs"
                    >
                      Applicera
                    </Button>
                    <Button
                      type="button"
                      onClick={() => updateSegmentFromDashboard(segment)}
                      disabled={saving}
                      variant="secondary"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Uppdatera segment ${segment.name}`}
                      title="Uppdatera segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.update} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setEditing(segment);
                      }}
                      variant="secondary"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Redigera segment ${segment.name}`}
                      title="Redigera segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.edit} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setDeleting(segment)}
                      variant="delete"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Ta bort segment ${segment.name}`}
                      title="Ta bort segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.delete} />
                    </Button>
                  </div>
                </div>
              </ListItem>
            );
          }

          return (
            <ListItem key={segment.id} numbered index={index + 1}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-app-text">
                    {segment.name}
                  </h3>
                  {segment.description ? (
                    <p className="mt-1 text-sm text-app-text-muted">
                      {segment.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <div className="flex flex-wrap gap-2 text-xs text-app-text-subtle md:justify-end">
                    <span>
                      {segment.result_count?.toLocaleString("sv-SE") ?? "-"} företag
                    </span>
                    <span>Uppdaterad {formatDate(segment.updated_at)}</span>
                    <span>{segment.visibility}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => applySegmentFilters(segment)}
                      variant="primary"
                      size="xs"
                    >
                      Applicera
                    </Button>
                    <Button
                      type="button"
                      onClick={() => updateSegmentFromDashboard(segment)}
                      disabled={saving}
                      variant="secondary"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Uppdatera segment ${segment.name}`}
                      title="Uppdatera segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.update} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setEditing(segment);
                      }}
                      variant="secondary"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Redigera segment ${segment.name}`}
                      title="Redigera segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.edit} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setDeleting(segment)}
                      variant="delete"
                      size="icon"
                      className="h-8 min-w-8 px-2 py-0"
                      aria-label={`Ta bort segment ${segment.name}`}
                      title="Ta bort segment"
                    >
                      <MaskedIcon src={UTILITY_ICONS.delete} />
                    </Button>
                  </div>
                </div>
              </div>

              <SegmentDetails segment={segment} />
            </ListItem>
          );
        })}
      </List>
      <SavedSegmentDialog
        open={Boolean(editing)}
        mode="edit"
        initialSegment={editing}
        saving={saving}
        error={actionError}
        onCancel={() => setEditing(null)}
        onSave={saveEditedSegment}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort segment?"
        description={
          deleting
            ? `Segmentet "${deleting.name}" tas bort permanent.`
            : undefined
        }
        confirmLabel="Ta bort"
        cancelLabel="Avbryt"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
