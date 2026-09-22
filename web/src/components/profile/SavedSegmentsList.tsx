"use client";

import { useMemo, useState } from "react";
import {
  createSavedSegment,
  deleteSavedSegment,
  refreshSavedSegmentCount,
  touchSavedSegment,
  updateSavedSegment,
} from "@/src/lib/api";
import type {
  SavedSegment,
  SavedSegmentPayload,
} from "@/src/lib/types";
import { companyFilterStateFromRecord } from "@/src/lib/companyFilterState";
import {
  companyMetricSortValue,
  companyNameSortValue,
} from "@/src/lib/companySearchOptions";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { SavedSegmentDialog } from "@/src/components/profile/SavedSegmentDialog";
import { Button } from "@/src/components/ui/Button";
import { List, ListItem } from "@/src/components/ui/List";
import { ListViewToggle } from "@/src/components/ui/ListViewToggle";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { Feedback } from "@/src/components/ui/Feedback";
import { SummaryGrid, SummaryItem } from "@/src/components/ui/SummaryGrid";
import { WorkspaceItemActions } from "@/src/components/workspace/WorkspaceItemActions";
import {
  sortWorkspaceItems,
  WorkspaceListSort,
  type WorkspaceListSortValue,
} from "@/src/components/workspace/WorkspaceListSort";

const COMPANY_SEARCH_SESSION_KEY = "company-intel-company-search";

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

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asLimit(value: unknown) {
  const numberValue = asNumber(value);
  return numberValue && numberValue > 0 ? numberValue : 100;
}

function applySegmentFilters(segment: SavedSegment) {
  const filters = segment.filters ?? {};
  const sort = segment.sort ?? {};

  sessionStorage.setItem(
    COMPANY_SEARCH_SESSION_KEY,
    JSON.stringify({
      ...companyFilterStateFromRecord(filters),
      limit: asLimit(sort.limit),
      compactList: false,
      nameSort: companyNameSortValue(sort.name_sort),
      metricSort: companyMetricSortValue(sort.metric_sort),
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
  window.location.href = "/companies";
}

function clearActiveSegmentIfMatches(segmentId: string) {
  let parsed: Record<string, unknown>;

  try {
    const raw = sessionStorage.getItem(COMPANY_SEARCH_SESSION_KEY);
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
      COMPANY_SEARCH_SESSION_KEY,
      JSON.stringify({ ...parsed, activeSegment: null }),
    );
  }
}

function syncActiveSegmentIfMatches(segment: SavedSegment) {
  let parsed: Record<string, unknown>;

  try {
    const raw = sessionStorage.getItem(COMPANY_SEARCH_SESSION_KEY);
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
      COMPANY_SEARCH_SESSION_KEY,
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
  return (
    <div className="mt-2 space-y-2">
      <SummaryGrid columns={2}>
        <SummaryItem label="Antal träffar">
          {typeof segment.result_count === "number"
            ? segment.result_count.toLocaleString("sv-SE")
            : "Inte beräknat"}
        </SummaryItem>
        <SummaryItem label="Senast uppdaterat">
          {formatDate(segment.updated_at)}
        </SummaryItem>
      </SummaryGrid>
      <SummaryGrid columns={2}>
        <SummaryItem
          label="Beskrivning"
          className="col-span-2"
          valueClassName="font-normal text-app-text-muted"
        >
          {segment.description || "Ingen beskrivning angiven."}
        </SummaryItem>
      </SummaryGrid>
    </div>
  );
}

export function SavedSegmentsList({ segments }: SavedSegmentsListProps) {
  const [compact, setCompact] = useState(false);
  const [sort, setSort] = useState<WorkspaceListSortValue>("name_asc");
  const [items, setItems] = useState(segments);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SavedSegment | null>(null);
  const [deleting, setDeleting] = useState<SavedSegment | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshingSegmentIds, setRefreshingSegmentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const sortedItems = useMemo(
    () =>
      sortWorkspaceItems(
        items,
        sort,
        (segment) => segment.name,
        (segment) => segment.created_at,
      ),
    [items, sort],
  );

  async function saveNewSegment(payload: SavedSegmentPayload) {
    setSaving(true);
    setActionError(null);
    try {
      const created = await createSavedSegment(payload);
      setItems((current) => [created, ...current]);
      setCreating(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte skapa segmentet.",
      );
    } finally {
      setSaving(false);
    }
  }

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
    setRefreshingSegmentIds((current) => new Set(current).add(segment.id));
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
      setRefreshingSegmentIds((current) => {
        const next = new Set(current);
        next.delete(segment.id);
        return next;
      });
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
        title="Mina sparade segment"
        empty={
          items.length === 0
            ? "Inga sparade segment ännu. Filter från företagssökningen kan sparas hit."
            : null
        }
        actions={
          <>
            <WorkspaceListSort value={sort} onChange={setSort} />
            <ListViewToggle
              value={compact ? "compact" : "card"}
              onChange={(value) => setCompact(value === "compact")}
              ariaLabel="Visningsläge för segment"
            />
            <Button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreating(true);
              }}
              variant="primary"
              size="icon"
              className="!h-7 !w-7 !min-w-7 !p-0"
              aria-label="Skapa nytt segment"
              title="Skapa nytt segment"
            >
              <MaskedIcon src="/icons/utility/add.svg" />
            </Button>
          </>
        }
      >
        {actionError ? (
          <div className="border-b border-app-border p-4">
            <Feedback tone="danger">{actionError}</Feedback>
          </div>
        ) : null}

        {sortedItems.map((segment) => {
          const refreshing = refreshingSegmentIds.has(segment.id);
          const actions = [
            {
              key: "apply",
              label: "Applicera",
              menuLabel: "Applicera",
              buttonText: "Applicera",
              variant: "secondary" as const,
              onSelect: () => applySegmentFilters(segment),
            },
            {
              key: "refresh",
              label: "Uppdatera",
              menuLabel: "Uppdatera",
              onSelect: () => updateSegmentFromDashboard(segment),
              disabled: refreshing,
              busy: refreshing,
              iconSrc: UTILITY_ICONS.update,
            },
            {
              key: "edit",
              label: "Redigera",
              menuLabel: "Redigera",
              onSelect: () => {
                setActionError(null);
                setEditing(segment);
              },
              iconSrc: UTILITY_ICONS.edit,
            },
            {
              key: "delete",
              label: "Ta bort",
              menuLabel: "Ta bort",
              onSelect: () => setDeleting(segment),
              iconSrc: UTILITY_ICONS.delete,
              variant: "delete" as const,
              separatorBefore: true,
            },
          ];

          if (compact) {
            return (
              <ListItem key={segment.id} compact>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
                    <h3 className="truncate text-sm font-semibold text-app-text">
                      {segment.name}
                    </h3>
                    <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-app-text-subtle">
                      <span>
                        {segment.result_count?.toLocaleString("sv-SE") ?? "-"} företag
                      </span>
                      <span>Uppdaterad {formatDate(segment.updated_at)}</span>
                    </div>
                  </div>
                  <WorkspaceItemActions
                    menuLabel={`Åtgärder för ${segment.name}`}
                    actions={actions}
                  />
                </div>
              </ListItem>
            );
          }

          return (
            <ListItem key={segment.id}>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-app-text">
                    {segment.name}
                  </h3>
                  <SegmentDetails segment={segment} />
                </div>
                <WorkspaceItemActions
                  menuLabel={`Åtgärder för ${segment.name}`}
                  actions={actions}
                />
              </div>

            </ListItem>
          );
        })}
      </List>
      <SavedSegmentDialog
        open={creating}
        mode="create"
        saving={saving}
        error={actionError}
        onCancel={() => setCreating(false)}
        onSave={saveNewSegment}
      />
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
