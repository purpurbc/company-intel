"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  createCustomerAccount,
  createSalesOffer,
  deleteCustomerAccount,
  deleteSalesOffer,
  listCompanies,
  updateUserProfile,
  updateCustomerAccount,
  updateSalesOffer,
} from "@/src/lib/api";
import type {
  AppUserProfile,
  AppUserProfilePayload,
  CompanyListItem,
  CustomerAccount,
  CustomerAccountPayload,
  SalesOffer,
  SalesOfferPayload,
  SavedSegment,
} from "@/src/lib/types";
import { SavedSegmentsList } from "@/src/components/profile/SavedSegmentsList";
import { Button } from "@/src/components/ui/Button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { List, ListItem } from "@/src/components/ui/List";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ToggleButton } from "@/src/components/ui/ToggleButton";
import { ui } from "@/src/lib/uiStyles";

type ProfileState = {
  displayName: string;
  email: string;
  company: CompanyListItem | null;
  companyDescription: string;
  idealCustomer: string;
};

type ProfileWorkspaceProps = {
  segments: SavedSegment[];
  offers: SalesOffer[];
  customers: CustomerAccount[];
  userProfile: AppUserProfile;
};

const CUSTOMER_LABELS = [
  {
    value: "ideal_customer",
    label: "Idealkund",
  },
  {
    value: "bad_match",
    label: "Dålig match",
  },
  {
    value: "good_customer",
    label: "Bra kund",
  },
  {
    value: "strategic",
    label: "Strategisk",
  },
  {
    value: "partnership",
    label: "Partnerskap",
  },
  {
    value: "reference",
    label: "Referenskund",
  },
  {
    value: "very_bad_customer",
    label: "Extremt dålig kund",
  },
] as const;

type ProfileTabKey = "profile" | "map" | "offers" | "customers" | "segments";
type EditableProfileSection =
  | "identity"
  | "company"
  | "companyDescription"
  | "idealCustomer";

const PROFILE_TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "profile", label: "Profil & ICP" },
  { key: "map", label: "Kundkarta" },
  { key: "offers", label: "Erbjudanden" },
  { key: "customers", label: "Kunder" },
  { key: "segments", label: "Segment" },
];

const EDIT_SECTION_COPY: Record<
  EditableProfileSection,
  { title: string; description: string }
> = {
  identity: {
    title: "Redigera användare?",
    description:
      "Du går in i redigeringsläge för displaynamn och email. Ändringarna sparas först när du klickar Spara.",
  },
  company: {
    title: "Redigera valt företag?",
    description:
      "Du kan välja ett annat företag. Ändringen sparas först när du klickar Spara.",
  },
  companyDescription: {
    title: "Redigera företagsbeskrivning?",
    description:
      "Du går in i redigeringsläge för företagets beskrivning. Ändringen sparas först när du klickar Spara.",
  },
  idealCustomer: {
    title: "Redigera idealkund?",
    description:
      "Du går in i redigeringsläge för idealkundsprofilen. Ändringen sparas först när du klickar Spara.",
  },
};

const UTILITY_ICONS = {
  addOffer: "/icons/utility/add_offer.svg",
  addCustomer: "/icons/utility/add_customer.svg",
  edit: "/icons/utility/edit.svg",
  delete: "/icons/utility/trashcan_delete.svg",
};

function companyLocation(company: {
  post_ort?: string | null;
  seat_municipality_name?: string | null;
  seat_county_name?: string | null;
}) {
  return [
    company.seat_municipality_name ?? company.post_ort,
    company.seat_county_name,
  ]
    .filter(Boolean)
    .join(" · ");
}

function companyFromUserProfile(
  userProfile: AppUserProfile,
): CompanyListItem | null {
  if (!userProfile.company_org_nr || !userProfile.company_name) return null;

  return {
    org_nr: userProfile.company_org_nr,
    company_name: userProfile.company_name,
    post_ort: userProfile.post_ort,
    seat_county_code: userProfile.seat_county_code,
    seat_county_name: userProfile.seat_county_name,
    seat_municipality_code: userProfile.seat_municipality_code,
    seat_municipality_name: userProfile.seat_municipality_name,
    industry_5_name: null,
  };
}

function profileFromUserProfile(userProfile: AppUserProfile): ProfileState {
  return {
    displayName: userProfile.display_name ?? "",
    email: userProfile.email ?? "",
    company: companyFromUserProfile(userProfile),
    companyDescription: userProfile.company_description ?? "",
    idealCustomer: userProfile.ideal_customer_description ?? "",
  };
}

function newOfferDraft(): SalesOfferPayload {
  return {
    name: "",
    description: "",
    target: "",
    saved_segment_id: null,
    customer_ids: [],
  };
}

function offerToPayload(offer: SalesOffer): SalesOfferPayload {
  return {
    name: offer.name,
    description: offer.description ?? "",
    target: offer.target ?? "",
    saved_segment_id: offer.saved_segment_id,
    customer_ids: offer.customer_ids,
  };
}

function newCustomerDraft(): CustomerAccountPayload {
  return {
    org_nr: "",
    customer_labels: [],
    offer_ids: [],
    connection_text: "",
    why_fit: "",
    pain_points: "",
    buying_trigger: "",
    outcome: "",
    tags: [],
    fit_score: 5,
  };
}

function customerToPayload(customer: CustomerAccount): CustomerAccountPayload {
  return {
    org_nr: customer.org_nr,
    customer_labels: customer.customer_labels ?? [],
    offer_ids: customer.offer_ids ?? [],
    connection_text: customer.connection_text ?? "",
    why_fit: customer.why_fit ?? "",
    pain_points: customer.pain_points ?? "",
    buying_trigger: customer.buying_trigger ?? "",
    outcome: customer.outcome ?? "",
    tags: customer.tags ?? [],
    fit_score: customer.fit_score,
  };
}

function cleanTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function customerLabelMeta(value: string) {
  return CUSTOMER_LABELS.find((label) => label.value === value);
}

function CustomerLabelChip({ value }: { value: string }) {
  const meta = customerLabelMeta(value);

  return (
    <span
      className={[
        ui.badge,
        meta ? "border-app-border-strong" : "",
      ].join(" ")}
    >
      {meta?.label ?? value}
    </span>
  );
}

function EditIconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="secondary"
      size="icon"
      className="h-8 min-w-8 px-2 py-0"
      aria-label={label}
      title={label}
    >
      <MaskedIcon src={UTILITY_ICONS.edit} />
    </Button>
  );
}

function CompanySearchBox({
  onSelect,
  placeholder = "Sök namn eller org.nr",
}: {
  onSelect: (company: CompanyListItem) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function searchCompany() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await listCompanies({
        q: query,
        search_by: "all",
        limit: 8,
        offset: 0,
      });
      setResults(result.items);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") searchCompany();
          }}
          className="min-w-0 flex-1 rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={searchCompany}
          disabled={loading}
          className="rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm font-medium text-app-text transition hover:bg-app-panel-hover disabled:opacity-50"
        >
          Sök
        </button>
      </div>

      {results.length > 0 ? (
        <div className="mt-3 max-h-64 overflow-auto rounded-md border border-app-border">
          {results.map((company) => (
            <button
              key={company.org_nr}
              type="button"
              onClick={() => {
                onSelect(company);
                setResults([]);
                setQuery("");
              }}
              className="block w-full border-b border-app-border px-3 py-2 text-left text-sm text-app-text-muted transition last:border-b-0 hover:bg-app-panel-hover hover:text-app-text"
            >
              <span className="font-medium text-app-text">
                {company.company_name}
              </span>
              <span className="mt-0.5 block text-xs text-app-text-subtle">
                {company.org_nr} · {companyLocation(company) || "-"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OfferDialog({
  open,
  offer,
  segments,
  customers,
  saving,
  error,
  onCancel,
  onSave,
}: {
  open: boolean;
  offer: SalesOffer | null;
  segments: SavedSegment[];
  customers: CustomerAccount[];
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (payload: SalesOfferPayload) => void;
}) {
  const [draft, setDraft] = useState<SalesOfferPayload>(
    offer ? offerToPayload(offer) : newOfferDraft(),
  );

  if (!open) return null;

  const selectedCustomerIds = new Set(draft.customer_ids ?? []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-app-border bg-app-panel p-5 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
          Erbjudande
        </p>
        <h2 className="mt-1 text-lg font-semibold text-app-text">
          {offer ? "Redigera erbjudande" : "Skapa erbjudande"}
        </h2>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">Namn</span>
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Ex. CRM-implementation"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Beskrivning
            </span>
            <textarea
              value={draft.description ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Vad erbjuder ni och vilket problem löser det?"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Passar bäst för
            </span>
            <input
              value={draft.target ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, target: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Ex. växande B2B-bolag med 10-50 anställda"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Kopplat segment
            </span>
            <select
              value={draft.saved_segment_id ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  saved_segment_id: event.target.value || null,
                })
              }
              className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition focus:border-app-focus"
            >
              <option value="">Inget segment valt</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="text-sm font-medium text-app-text-muted">
              Kunder som har köpt erbjudandet
            </div>
            {customers.length === 0 ? (
              <p className="mt-2 text-sm text-app-text-subtle">
                Lägg till kunder först för att kunna koppla dem hit.
              </p>
            ) : (
              <div className="mt-2 max-h-44 overflow-auto rounded-md border border-app-border">
                {customers.map((customer) => {
                  const checked = selectedCustomerIds.has(customer.id);
                  return (
                    <label
                      key={customer.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-app-border px-3 py-2 text-sm last:border-b-0 hover:bg-app-panel-hover"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = new Set(selectedCustomerIds);
                          if (event.target.checked) next.add(customer.id);
                          else next.delete(customer.id);
                          setDraft({ ...draft, customer_ids: [...next] });
                        }}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-app-text">
                          {customer.company_name}
                        </span>
                        <span className="block text-xs text-app-text-subtle">
                          Score {customer.fit_score}/10 · {customer.org_nr}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-app-danger-border bg-app-danger-bg px-3 py-2 text-sm text-app-danger-text">
            {error}
          </div>
        ) : null}

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
            disabled={!draft.name.trim() || saving}
            onClick={() =>
              onSave({
                name: draft.name.trim(),
                description: draft.description?.trim() || null,
                target: draft.target?.trim() || null,
                saved_segment_id: draft.saved_segment_id || null,
                customer_ids: draft.customer_ids ?? [],
              })
            }
            className="rounded-md bg-app-control-bg px-4 py-2.5 text-sm font-medium text-app-control-text transition hover:bg-app-control-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spara erbjudande
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDialog({
  open,
  customer,
  offers,
  saving,
  error,
  onCancel,
  onSave,
}: {
  open: boolean;
  customer: CustomerAccount | null;
  offers: SalesOffer[];
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: (payload: CustomerAccountPayload) => void;
}) {
  const [draft, setDraft] = useState<CustomerAccountPayload>(
    customer ? customerToPayload(customer) : newCustomerDraft(),
  );
  const [tagDraft, setTagDraft] = useState(
    (customer?.tags ?? []).join(", "),
  );
  const [selectedCompany, setSelectedCompany] = useState<CompanyListItem | null>(
    null,
  );
  const [confirmCompanyChangeOpen, setConfirmCompanyChangeOpen] =
    useState(false);

  if (!open) return null;

  const displayedCompany = selectedCompany ?? (draft.org_nr ? customer : null);
  const showCompanySearch = !draft.org_nr;
  const selectedLabels = new Set(draft.customer_labels ?? []);
  const selectedOfferIds = new Set(draft.offer_ids ?? []);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-app-border bg-app-panel p-5 shadow-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
          Befintlig kund
        </p>
        <h2 className="mt-1 text-lg font-semibold text-app-text">
          {customer ? "Redigera kund" : "Lägg till kund"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-app-text-muted">
              Företag
            </div>
            {displayedCompany ? (
              <div className="mt-2 flex items-start justify-between gap-3 rounded-md border border-app-border bg-app-panel-soft px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-app-text">
                    {displayedCompany.company_name}
                  </div>
                  <div className="text-xs text-app-text-subtle">
                    {displayedCompany.org_nr} ·{" "}
                    {companyLocation(displayedCompany) || "-"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmCompanyChangeOpen(true)}
                  className="shrink-0 rounded-md border border-app-border bg-app-panel px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                >
                  Ändra
                </button>
              </div>
            ) : null}
            {showCompanySearch ? (
              <div className="mt-3">
                <CompanySearchBox
                  placeholder="Sök kundföretag"
                  onSelect={(company) => {
                    setSelectedCompany(company);
                    setDraft({ ...draft, org_nr: company.org_nr });
                  }}
                />
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm font-medium text-app-text-muted">
              Kundtyp
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {CUSTOMER_LABELS.map((label) => {
                const active = selectedLabels.has(label.value);
                return (
                  <button
                    key={label.value}
                    type="button"
                    onClick={() => {
                      const next = new Set(selectedLabels);
                      if (active) next.delete(label.value);
                      else next.add(label.value);
                      setDraft({
                        ...draft,
                        customer_labels: [...next],
                      });
                    }}
                    className={[
                      "transition",
                      active
                        ? ui.badgeSelected
                        : `${ui.badge} hover:bg-app-panel-hover hover:text-app-text`,
                    ].join(" ")}
                  >
                    {label.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-app-text-muted">
              Köpta erbjudanden
            </div>
            {offers.length === 0 ? (
              <p className="mt-2 text-sm text-app-text-subtle">
                Lägg till erbjudanden först för att kunna koppla dem hit.
              </p>
            ) : (
              <div className="mt-2 max-h-44 overflow-auto rounded-md border border-app-border">
                {offers.map((offer) => {
                  const checked = selectedOfferIds.has(offer.id);
                  return (
                    <label
                      key={offer.id}
                      className="flex cursor-pointer items-start gap-3 border-b border-app-border px-3 py-2 text-sm last:border-b-0 hover:bg-app-panel-hover"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = new Set(selectedOfferIds);
                          if (event.target.checked) next.add(offer.id);
                          else next.delete(offer.id);
                          setDraft({ ...draft, offer_ids: [...next] });
                        }}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-app-text">
                          {offer.name}
                        </span>
                        {offer.target ? (
                          <span className="block text-xs text-app-text-subtle">
                            {offer.target}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Kort koppling / relation
            </span>
            <textarea
              value={draft.connection_text ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, connection_text: event.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Beskriv er relation, vad kunden köpt eller varför kunden är relevant."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Varför de passar
            </span>
            <textarea
              value={draft.why_fit ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, why_fit: event.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Ex. rätt storlek, snabb beslutsprocess, tydligt operativt behov."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Problem / behov
            </span>
            <textarea
              value={draft.pain_points ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, pain_points: event.target.value })
              }
              className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Vad gjorde att kunden behövde er lösning?"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-app-text-muted">
                Köptrigger
              </span>
              <textarea
                value={draft.buying_trigger ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, buying_trigger: event.target.value })
                }
                className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="Varför köpte de just då?"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-app-text-muted">
                Outcome / resultat
              </span>
              <textarea
                value={draft.outcome ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, outcome: event.target.value })
                }
                className="mt-2 min-h-24 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="Vad blev resultatet eller värdet?"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Taggar
            </span>
            <input
              value={tagDraft}
              onChange={(event) => {
                setTagDraft(event.target.value);
                setDraft({ ...draft, tags: cleanTags(event.target.value) });
              }}
              className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
              placeholder="Ex. expansion, komplex drift, snabb beslutsprocess"
            />
            <p className="mt-1 text-xs text-app-text-subtle">
              Separera taggar med kommatecken.
            </p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-app-text-muted">
              Kundscore: {draft.fit_score}/10
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={draft.fit_score}
              onChange={(event) =>
                setDraft({ ...draft, fit_score: Number(event.target.value) })
              }
              className="mt-3 w-full accent-[var(--color-accent)]"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-app-danger-border bg-app-danger-bg px-3 py-2 text-sm text-app-danger-text">
            {error}
          </div>
        ) : null}

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
            disabled={!draft.org_nr || saving}
            onClick={() =>
              onSave({
                org_nr: draft.org_nr,
                customer_labels: draft.customer_labels ?? [],
                offer_ids: draft.offer_ids ?? [],
                connection_text: draft.connection_text?.trim() || null,
                why_fit: draft.why_fit?.trim() || null,
                pain_points: draft.pain_points?.trim() || null,
                buying_trigger: draft.buying_trigger?.trim() || null,
                outcome: draft.outcome?.trim() || null,
                tags: draft.tags ?? [],
                fit_score: draft.fit_score,
              })
            }
            className="rounded-md bg-app-control-bg px-4 py-2.5 text-sm font-medium text-app-control-text transition hover:bg-app-control-bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Spara kund
          </button>
        </div>
      </div>
    </div>
    <ConfirmDialog
      open={confirmCompanyChangeOpen}
      title="Ändra valt kundföretag?"
      description={
        displayedCompany
          ? `Valet "${displayedCompany.company_name}" tas bort och du kan söka fram ett nytt kundföretag.`
          : undefined
      }
      confirmLabel="Ta bort val"
      cancelLabel="Avbryt"
      onConfirm={() => {
        setSelectedCompany(null);
        setDraft({ ...draft, org_nr: "" });
        setConfirmCompanyChangeOpen(false);
      }}
      onCancel={() => setConfirmCompanyChangeOpen(false)}
    />
    </>
  );
}

function CustomerMapView({
  company,
  customers,
}: {
  company: CompanyListItem | null;
  customers: CustomerAccount[];
}) {
  const nodes = useMemo<Node[]>(() => {
    const customerCount = Math.max(customers.length, 1);
    const radius = customers.length <= 4 ? 260 : 340;
    const customerNodes = customers.map((customer, index) => {
      const angle = (index / customerCount) * Math.PI * 2 - Math.PI / 2;

      return {
        id: customer.id,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        },
        data: {
          label: (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {customer.company_name}
              </div>
              <div className="mt-1 truncate text-xs opacity-70">
                {customer.org_nr}
              </div>
            </div>
          ),
        },
        style: {
          width: 220,
          border: "1px solid var(--app-border)",
          borderRadius: "var(--app-radius-sm)",
          background: "var(--app-panel)",
          color: "var(--app-text)",
          padding: 10,
          boxShadow: "none",
        },
      };
    });

    return [
      {
        id: "origin",
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {company?.company_name ?? "Vårt företag"}
              </div>
              <div className="mt-1 truncate text-xs opacity-70">
                {company?.org_nr ?? "Org.nr saknas"}
              </div>
            </div>
          ),
        },
        style: {
          width: 240,
          border: "1px solid var(--app-border-strong)",
          borderRadius: "var(--app-radius-sm)",
          background: "var(--app-panel)",
          color: "var(--app-text)",
          padding: 12,
          boxShadow: "none",
        },
      },
      ...customerNodes,
    ];
  }, [company, customers]);

  const edges = useMemo<Edge[]>(
    () =>
      customers.map((customer) => ({
        id: `origin-${customer.id}`,
        source: "origin",
        target: customer.id,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: {
          stroke: "var(--app-border-strong)",
          strokeWidth: 1.4,
        },
      })),
    [customers],
  );

  return (
    <section className="rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3">
      <h2 className="text-base font-bold text-app-text">Kundkarta</h2>
      <div className="mt-3 h-[32rem] overflow-hidden border border-app-border bg-app-bg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.28 }}
          minZoom={0.25}
          maxZoom={1.3}
          nodesDraggable
          nodesConnectable={true}
          elementsSelectable={true}
          proOptions={{ hideAttribution: false }}
        >
          <Background color="var(--app-border)" gap={24} size={1} />
          <Controls showInteractive={true} />
        </ReactFlow>
      </div>
      {customers.length === 0 ? (
        <p className="mt-3 text-sm text-app-text-muted">
          Lägg till kunder för att visa kopplingar från ert företag.
        </p>
      ) : null}
    </section>
  );
}

function OffersList({
  offers,
  customersById,
  onCreate,
  onEdit,
  onDelete,
}: {
  offers: SalesOffer[];
  customersById: Map<string, CustomerAccount>;
  onCreate: () => void;
  onEdit: (offer: SalesOffer) => void;
  onDelete: (offer: SalesOffer) => void;
}) {
  const [compact, setCompact] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <List
      eyebrow="Erbjudanden"
      title="Mina erbjudanden"
      collapsed={collapsed}
      empty={
        offers.length === 0
          ? "Lägg in era vanligaste erbjudanden och koppla dem till segment och kunder när det finns data."
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
            ariaLabel="Visningsläge för erbjudanden"
          />
          <Button
            type="button"
            onClick={onCreate}
            variant="primary"
            size="icon"
            aria-label="Skapa nytt erbjudande"
            title="Skapa nytt erbjudande"
          >
            <MaskedIcon src={UTILITY_ICONS.addOffer} />
          </Button>
        </>
      }
    >
      {offers.map((offer, index) => {
        const linkedCustomers = offer.customer_ids
          .map((id) => customersById.get(id))
          .filter((customer): customer is CustomerAccount => Boolean(customer));

        if (compact) {
          return (
            <ListItem key={offer.id} compact numbered index={index + 1}>
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-3">
                  <h3 className="truncate text-sm font-semibold text-app-text">
                    {offer.name}
                  </h3>
                  <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-app-text-subtle">
                    {offer.saved_segment_name ? (
                      <span className="truncate">
                        Segment: {offer.saved_segment_name}
                      </span>
                    ) : null}
                    <span>
                      {linkedCustomers.length} kund
                      {linkedCustomers.length === 1 ? "" : "er"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    onClick={() => onEdit(offer)}
                    variant="secondary"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Redigera erbjudande ${offer.name}`}
                    title="Redigera erbjudande"
                  >
                    <MaskedIcon src={UTILITY_ICONS.edit} />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onDelete(offer)}
                    variant="delete"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Ta bort erbjudande ${offer.name}`}
                    title="Ta bort erbjudande"
                  >
                    <MaskedIcon src={UTILITY_ICONS.delete} />
                  </Button>
                </div>
              </div>
            </ListItem>
          );
        }

        return (
          <ListItem key={offer.id} numbered index={index + 1}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-app-text">
                  {offer.name}
                </h3>
                {offer.description ? (
                  <p className="mt-1 text-sm text-app-text-muted">
                    {offer.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {offer.saved_segment_name ? (
                    <span className="rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-app-text-muted">
                      Segment: {offer.saved_segment_name}
                    </span>
                  ) : null}
                  {offer.target ? (
                    <span className="rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-app-text-muted">
                      Passar: {offer.target}
                    </span>
                  ) : null}
                  <span className="rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-app-text-muted">
                    {linkedCustomers.length} kund
                    {linkedCustomers.length === 1 ? "" : "er"}
                  </span>
                </div>
                {linkedCustomers.length > 0 ? (
                  <div className="mt-2 text-xs text-app-text-subtle">
                    Sålt till:{" "}
                    {linkedCustomers
                      .map((customer) => customer.company_name)
                      .join(", ")}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  onClick={() => onEdit(offer)}
                  variant="secondary"
                  size="icon"
                  className="h-8 min-w-8 px-2 py-0"
                  aria-label={`Redigera erbjudande ${offer.name}`}
                  title="Redigera erbjudande"
                >
                  <MaskedIcon src={UTILITY_ICONS.edit} />
                </Button>
                <Button
                  type="button"
                  onClick={() => onDelete(offer)}
                  variant="delete"
                  size="icon"
                  className="h-8 min-w-8 px-2 py-0"
                  aria-label={`Ta bort erbjudande ${offer.name}`}
                  title="Ta bort erbjudande"
                >
                  <MaskedIcon src={UTILITY_ICONS.delete} />
                </Button>
              </div>
            </div>
          </ListItem>
        );
      })}
    </List>
  );
}

function CustomersList({
  customers,
  onCreate,
  onEdit,
  onDelete,
}: {
  customers: CustomerAccount[];
  onCreate: () => void;
  onEdit: (customer: CustomerAccount) => void;
  onDelete: (customer: CustomerAccount) => void;
}) {
  const [compact, setCompact] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <List
      eyebrow="Kunder"
      title="Befintliga kunder"
      collapsed={collapsed}
      empty={
        customers.length === 0
          ? "Lägg till kunder ni redan har. De kan sedan kopplas till erbjudanden och användas för att förstå vilka prospects som liknar era bästa case."
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
            ariaLabel="Visningsläge för kunder"
          />
          <Button
            type="button"
            onClick={onCreate}
            variant="primary"
            size="icon"
            aria-label="Lägg till kund"
            title="Lägg till kund"
          >
            <MaskedIcon src={UTILITY_ICONS.addCustomer} />
          </Button>
        </>
      }
    >
      {customers.map((customer, index) => {
        if (compact) {
          const visibleLabels = customer.customer_labels.slice(0, 2);
          const hiddenLabelCount =
            customer.customer_labels.length - visibleLabels.length;

          return (
            <ListItem key={customer.id} compact numbered index={index + 1}>
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-1 lg:flex-row lg:items-center lg:gap-3">
                  <h3 className="truncate text-sm font-semibold text-app-text">
                    {customer.company_name}
                  </h3>
                  <p className="truncate text-xs text-app-text-subtle">
                    {customer.org_nr} · {companyLocation(customer) || "-"}
                  </p>
                  {visibleLabels.length > 0 ? (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {visibleLabels.map((label) => (
                        <CustomerLabelChip key={label} value={label} />
                      ))}
                      {hiddenLabelCount > 0 ? (
                        <span className="rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-xs font-medium text-app-text-subtle">
                          +{hiddenLabelCount}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-xs font-medium text-app-text-muted sm:inline-flex">
                    Score {customer.fit_score}/10
                  </span>
                  <Button
                    type="button"
                    onClick={() => onEdit(customer)}
                    variant="secondary"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Redigera kund ${customer.company_name}`}
                    title="Redigera kund"
                  >
                    <MaskedIcon src={UTILITY_ICONS.edit} />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onDelete(customer)}
                    variant="delete"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Ta bort kund ${customer.company_name}`}
                    title="Ta bort kund"
                  >
                    <MaskedIcon src={UTILITY_ICONS.delete} />
                  </Button>
                </div>
              </div>
            </ListItem>
          );
        }

        return (
          <ListItem key={customer.id} numbered index={index + 1}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-app-text">
                  {customer.company_name}
                </h3>
                <p className="mt-1 text-xs text-app-text-subtle">
                  {customer.org_nr} · {companyLocation(customer) || "-"}
                </p>
                {customer.customer_labels.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customer.customer_labels.map((label) => (
                      <CustomerLabelChip key={label} value={label} />
                    ))}
                  </div>
                ) : null}
                {customer.offer_names.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customer.offer_names.map((offerName) => (
                      <span
                        key={offerName}
                        className="rounded-md border border-app-border bg-app-panel-soft px-2 py-1 text-xs text-app-text-muted"
                      >
                        Köpt: {offerName}
                      </span>
                    ))}
                  </div>
                ) : null}
                {customer.connection_text ? (
                  <p className="mt-2 text-sm text-app-text-muted">
                    {customer.connection_text}
                  </p>
                ) : null}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {customer.why_fit ? (
                    <div className="rounded-md border border-app-border bg-app-panel-soft px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                        Varför de passar
                      </div>
                      <p className="mt-1 text-sm text-app-text-muted">
                        {customer.why_fit}
                      </p>
                    </div>
                  ) : null}
                  {customer.pain_points ? (
                    <div className="rounded-md border border-app-border bg-app-panel-soft px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                        Problem / behov
                      </div>
                      <p className="mt-1 text-sm text-app-text-muted">
                        {customer.pain_points}
                      </p>
                    </div>
                  ) : null}
                  {customer.buying_trigger ? (
                    <div className="rounded-md border border-app-border bg-app-panel-soft px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                        Köptrigger
                      </div>
                      <p className="mt-1 text-sm text-app-text-muted">
                        {customer.buying_trigger}
                      </p>
                    </div>
                  ) : null}
                  {customer.outcome ? (
                    <div className="rounded-md border border-app-border bg-app-panel-soft px-3 py-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                        Outcome
                      </div>
                      <p className="mt-1 text-sm text-app-text-muted">
                        {customer.outcome}
                      </p>
                    </div>
                  ) : null}
                </div>
                {customer.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-app-border bg-app-panel px-2 py-1 text-xs text-app-text-subtle"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2 md:items-end">
                <span className="rounded-md border border-app-border bg-app-panel-soft px-2.5 py-1.5 text-xs font-medium text-app-text-muted">
                  Score {customer.fit_score}/10
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => onEdit(customer)}
                    variant="secondary"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Redigera kund ${customer.company_name}`}
                    title="Redigera kund"
                  >
                    <MaskedIcon src={UTILITY_ICONS.edit} />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onDelete(customer)}
                    variant="delete"
                    size="icon"
                    className="h-8 min-w-8 px-2 py-0"
                    aria-label={`Ta bort kund ${customer.company_name}`}
                    title="Ta bort kund"
                  >
                    <MaskedIcon src={UTILITY_ICONS.delete} />
                  </Button>
                </div>
              </div>
            </div>
          </ListItem>
        );
      })}
    </List>
  );
}

function removeOfferFromCustomer(
  customer: CustomerAccount,
  offerId: string,
): CustomerAccount {
  const index = customer.offer_ids.indexOf(offerId);
  if (index === -1) return customer;

  return {
    ...customer,
    offer_ids: customer.offer_ids.filter((id) => id !== offerId),
    offer_names: customer.offer_names.filter((_, nameIndex) => nameIndex !== index),
  };
}

function syncCustomersForOffer(
  customers: CustomerAccount[],
  offer: SalesOffer,
) {
  const selectedCustomerIds = new Set(offer.customer_ids);

  return customers.map((customer) => {
    const shouldInclude = selectedCustomerIds.has(customer.id);
    const existingIndex = customer.offer_ids.indexOf(offer.id);

    if (shouldInclude) {
      if (existingIndex === -1) {
        return {
          ...customer,
          offer_ids: [offer.id, ...customer.offer_ids],
          offer_names: [offer.name, ...customer.offer_names],
        };
      }

      return {
        ...customer,
        offer_names: customer.offer_names.map((name, index) =>
          index === existingIndex ? offer.name : name,
        ),
      };
    }

    return removeOfferFromCustomer(customer, offer.id);
  });
}

function syncOffersForCustomer(
  offers: SalesOffer[],
  customer: CustomerAccount,
) {
  const selectedOfferIds = new Set(customer.offer_ids);

  return offers.map((offer) => {
    const shouldInclude = selectedOfferIds.has(offer.id);
    const hasCustomer = offer.customer_ids.includes(customer.id);

    if (shouldInclude && !hasCustomer) {
      return {
        ...offer,
        customer_ids: [customer.id, ...offer.customer_ids],
      };
    }

    if (!shouldInclude && hasCustomer) {
      return {
        ...offer,
        customer_ids: offer.customer_ids.filter((id) => id !== customer.id),
      };
    }

    return offer;
  });
}

export function ProfileWorkspace({
  segments,
  offers,
  customers,
  userProfile,
}: ProfileWorkspaceProps) {
  const [profile, setProfile] = useState<ProfileState>(() =>
    profileFromUserProfile(userProfile),
  );
  const [savedProfile, setSavedProfile] = useState<ProfileState>(() =>
    profileFromUserProfile(userProfile),
  );
  const [offerItems, setOfferItems] = useState(offers);
  const [customerItems, setCustomerItems] = useState(customers);
  const [editingOffer, setEditingOffer] = useState<SalesOffer | null>(null);
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState<SalesOffer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerAccount | null>(
    null,
  );
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [deletingCustomer, setDeletingCustomer] =
    useState<CustomerAccount | null>(null);
  const [companyChangeMode, setCompanyChangeMode] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [editingCompanyDescription, setEditingCompanyDescription] =
    useState(false);
  const [editingIdealCustomer, setEditingIdealCustomer] = useState(false);
  const [pendingEditSection, setPendingEditSection] =
    useState<EditableProfileSection | null>(null);
  const [activeProfileTab, setActiveProfileTab] =
    useState<ProfileTabKey>("profile");
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const customersById = useMemo(
    () => new Map(customerItems.map((customer) => [customer.id, customer])),
    [customerItems],
  );

  const selectedCompanyHref = profile.company
    ? `/company/${encodeURIComponent(profile.company.org_nr)}`
    : null;

  const companyMeta = profile.company
    ? [profile.company.org_nr, companyLocation(profile.company)]
        .filter(Boolean)
        .join(" · ")
    : "Inget företag valt";

  const showCompanySearch = editingCompany && companyChangeMode;
  const identityDirty =
    profile.displayName !== savedProfile.displayName ||
    profile.email !== savedProfile.email;
  const companyDirty =
    (profile.company?.org_nr ?? "") !== (savedProfile.company?.org_nr ?? "");
  const companyDescriptionDirty =
    profile.companyDescription !== savedProfile.companyDescription;
  const idealCustomerDirty =
    profile.idealCustomer !== savedProfile.idealCustomer;
  const hasUnsavedProfileChanges =
    identityDirty ||
    companyDirty ||
    companyDescriptionDirty ||
    idealCustomerDirty;

  function discardProfileDraft() {
    setProfile(savedProfile);
    setEditingIdentity(false);
    setEditingCompany(false);
    setEditingCompanyDescription(false);
    setEditingIdealCustomer(false);
    setCompanyChangeMode(false);
  }

  useEffect(() => {
    if (!hasUnsavedProfileChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.href === window.location.href) return;

      const shouldLeave = window.confirm(
        "Du har osparade ändringar. Vill du lämna sidan utan att spara?",
      );

      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        discardProfileDraft();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedProfileChanges, savedProfile]);

  function userPayloadFromProfile(nextProfile: ProfileState): AppUserProfilePayload {
    return {
      auth_provider: userProfile.auth_provider,
      auth_subject: userProfile.auth_subject,
      email: nextProfile.email.trim() || null,
      display_name: nextProfile.displayName.trim() || "MVP User",
      role: userProfile.role || "user",
      company_org_nr: nextProfile.company?.org_nr ?? null,
      company_description: nextProfile.companyDescription.trim() || null,
      ideal_customer_description: nextProfile.idealCustomer.trim() || null,
      settings: userProfile.settings ?? {},
    };
  }

  async function saveUserProfile(nextProfile: ProfileState = profile) {
    setProfileSaving(true);
    setActionError(null);
    try {
      const saved = await updateUserProfile(userPayloadFromProfile(nextProfile));
      const nextSavedProfile = profileFromUserProfile(saved);
      setProfile(nextSavedProfile);
      setSavedProfile(nextSavedProfile);
      return true;
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte spara profilen.",
      );
      return false;
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveProfileSection(section: EditableProfileSection) {
    const saved = await saveUserProfile();
    if (!saved) return;

    if (section === "identity") setEditingIdentity(false);
    if (section === "company") {
      setEditingCompany(false);
      setCompanyChangeMode(false);
    }
    if (section === "companyDescription") setEditingCompanyDescription(false);
    if (section === "idealCustomer") setEditingIdealCustomer(false);
  }

  function cancelProfileSection(section: EditableProfileSection) {
    setProfile((current) => {
      if (section === "identity") {
        return {
          ...current,
          displayName: savedProfile.displayName,
          email: savedProfile.email,
        };
      }

      if (section === "company") {
        return {
          ...current,
          company: savedProfile.company,
        };
      }

      if (section === "companyDescription") {
        return {
          ...current,
          companyDescription: savedProfile.companyDescription,
        };
      }

      return {
        ...current,
        idealCustomer: savedProfile.idealCustomer,
      };
    });

    if (section === "identity") setEditingIdentity(false);
    if (section === "company") {
      setEditingCompany(false);
      setCompanyChangeMode(false);
    }
    if (section === "companyDescription") setEditingCompanyDescription(false);
    if (section === "idealCustomer") setEditingIdealCustomer(false);
  }

  function confirmProfileEdit() {
    if (!pendingEditSection) return;

    if (pendingEditSection === "identity") setEditingIdentity(true);
    if (pendingEditSection === "company") {
      setEditingCompany(true);
      setCompanyChangeMode(false);
    }
    if (pendingEditSection === "companyDescription") {
      setEditingCompanyDescription(true);
    }
    if (pendingEditSection === "idealCustomer") setEditingIdealCustomer(true);
    setPendingEditSection(null);
  }

  function setProfileTab(nextTab: ProfileTabKey) {
    if (nextTab === activeProfileTab) return;

    if (hasUnsavedProfileChanges) {
      const shouldLeave = window.confirm(
        "Du har osparade ändringar. Vill du lämna utan att spara?",
      );
      if (!shouldLeave) return;
      discardProfileDraft();
    }

    setActiveProfileTab(nextTab);
  }

  async function saveOffer(payload: SalesOfferPayload) {
    setSaving(true);
    setActionError(null);
    try {
      const saved = editingOffer
        ? await updateSalesOffer(editingOffer.id, payload)
        : await createSalesOffer(payload);
      setOfferItems((current) =>
        editingOffer
          ? current.map((offer) => (offer.id === saved.id ? saved : offer))
          : [saved, ...current],
      );
      setCustomerItems((current) => syncCustomersForOffer(current, saved));
      setEditingOffer(null);
      setCreatingOffer(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte spara erbjudandet.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCustomer(payload: CustomerAccountPayload) {
    setSaving(true);
    setActionError(null);
    try {
      const saved = editingCustomer
        ? await updateCustomerAccount(editingCustomer.id, payload)
        : await createCustomerAccount(payload);
      setCustomerItems((current) =>
        editingCustomer
          ? current.map((customer) =>
              customer.id === saved.id ? saved : customer,
            )
          : [saved, ...current],
      );
      setOfferItems((current) => syncOffersForCustomer(current, saved));
      setEditingCustomer(null);
      setCreatingCustomer(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte spara kunden.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteOffer() {
    if (!deletingOffer) return;
    try {
      await deleteSalesOffer(deletingOffer.id);
      setOfferItems((current) =>
        current.filter((offer) => offer.id !== deletingOffer.id),
      );
      setCustomerItems((current) =>
        current.map((customer) => removeOfferFromCustomer(customer, deletingOffer.id)),
      );
      setDeletingOffer(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte ta bort erbjudandet.",
      );
    }
  }

  async function confirmDeleteCustomer() {
    if (!deletingCustomer) return;
    try {
      await deleteCustomerAccount(deletingCustomer.id);
      setCustomerItems((current) =>
        current.filter((customer) => customer.id !== deletingCustomer.id),
      );
      setOfferItems((current) =>
        current.map((offer) => ({
          ...offer,
          customer_ids: offer.customer_ids.filter(
            (id) => id !== deletingCustomer.id,
          ),
        })),
      );
      setDeletingCustomer(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte ta bort kunden.",
      );
    }
  }

  const offerDialogOpen = creatingOffer || Boolean(editingOffer);
  const customerDialogOpen = creatingCustomer || Boolean(editingCustomer);

  return (
    <main className="min-h-screen bg-app-bg px-5 py-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-app-border pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-app-text">
                Profil & ICP
              </h1>
              <div className="mt-2 text-sm leading-5 text-app-text-muted">
                <span className="font-medium text-app-text-subtle">
                  User ID:
                </span>{" "}
                {userProfile.id}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profileSaving ? (
                <span className="inline-flex h-8 items-center rounded-sm border border-app-border bg-app-panel-muted px-3 text-xs font-medium text-app-text-muted">
                  Sparar profil...
                </span>
              ) : null}
              {selectedCompanyHref ? (
                <Link
                  href={selectedCompanyHref}
                  className="inline-flex h-8 items-center rounded-sm border border-app-border bg-app-panel-muted px-3 text-xs font-medium text-app-text transition hover:border-app-border-strong hover:bg-app-panel-hover"
                >
                  Företagssida
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        {actionError ? (
          <div className="rounded-sm border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
            {actionError}
          </div>
        ) : null}

        <nav
          className="flex gap-1 overflow-x-auto border-b border-app-border"
          aria-label="Profilvy"
        >
          {PROFILE_TABS.map((tab) => {
            const active = tab.key === activeProfileTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setProfileTab(tab.key)}
                className={[
                  "border-b-2 px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-app-accent-border text-app-accent-text"
                    : "border-transparent text-app-text-muted hover:text-app-text",
                ].join(" ")}
                aria-pressed={active}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeProfileTab === "profile" ? (
          <section className="grid gap-3 xl:grid-cols-2">
            <div className="rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-app-text">
                  Användare & företag
                </h2>
                <div className="flex gap-2">
                  {editingIdentity ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveProfileSection("identity")}
                        disabled={!identityDirty || profileSaving}
                        className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Spara
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelProfileSection("identity")}
                        className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                      >
                        Avbryt
                      </button>
                    </>
                  ) : (
                    <EditIconButton
                      label="Redigera användare"
                      onClick={() => setPendingEditSection("identity")}
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-medium uppercase text-app-text-subtle">
                    Display name
                  </span>
                  <input
                    readOnly={!editingIdentity}
                    value={profile.displayName}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    className={[
                      "mt-2 w-full rounded-sm border px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",
                      editingIdentity
                        ? "border-app-border bg-app-panel"
                        : "border-app-border bg-app-panel-muted",
                    ].join(" ")}
                    placeholder="Ditt namn"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase text-app-text-subtle">
                    Email
                  </span>
                  <input
                    readOnly={!editingIdentity}
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={[
                      "mt-2 w-full rounded-sm border px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",
                      editingIdentity
                        ? "border-app-border bg-app-panel"
                        : "border-app-border bg-app-panel-muted",
                    ].join(" ")}
                    placeholder="namn@foretag.se"
                  />
                </label>
              </div>

              <div className="mt-4 border-t border-app-border pt-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium uppercase text-app-text-subtle">
                      Valt företag
                    </div>
                    <h3 className="mt-1 truncate text-base font-semibold text-app-text">
                      {profile.company?.company_name ?? "Välj företag"}
                    </h3>
                    <p className="mt-1 text-sm text-app-text-subtle">
                      {companyMeta}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    {editingCompany ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setCompanyChangeMode(true)}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                        >
                          Välj
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveProfileSection("company")}
                          disabled={!companyDirty || profileSaving}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Spara
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelProfileSection("company")}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                        >
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <EditIconButton
                        label="Redigera valt företag"
                        onClick={() => setPendingEditSection("company")}
                      />
                    )}
                  </div>
                </div>

                {showCompanySearch ? (
                  <div className="mt-3">
                    <CompanySearchBox
                      onSelect={(company) => {
                        setProfile((current) => ({ ...current, company }));
                        setCompanyChangeMode(false);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3">
              <section className="rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-app-text">
                    Företagsbeskrivning
                  </h2>
                  <div className="flex gap-2">
                    {editingCompanyDescription ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void saveProfileSection("companyDescription")
                          }
                          disabled={!companyDescriptionDirty || profileSaving}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Spara
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            cancelProfileSection("companyDescription")
                          }
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                        >
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <EditIconButton
                        label="Redigera företagsbeskrivning"
                        onClick={() =>
                          setPendingEditSection("companyDescription")
                        }
                      />
                    )}
                  </div>
                </div>
                <textarea
                  readOnly={!editingCompanyDescription}
                  value={profile.companyDescription}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      companyDescription: event.target.value,
                    }))
                  }
                  className={[
                    "mt-3 min-h-32 w-full rounded-sm border px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",
                    editingCompanyDescription
                      ? "border-app-border bg-app-panel"
                      : "border-app-border bg-app-panel-muted",
                  ].join(" ")}
                  placeholder="Beskriv företaget med era egna ord."
                />
              </section>

              <section className="rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-app-text">
                    Idealkund
                  </h2>
                  <div className="flex gap-2">
                    {editingIdealCustomer ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            void saveProfileSection("idealCustomer")
                          }
                          disabled={!idealCustomerDirty || profileSaving}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Spara
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelProfileSection("idealCustomer")}
                          className="rounded-sm border border-app-border bg-app-panel-muted px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                        >
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <EditIconButton
                        label="Redigera idealkund"
                        onClick={() => setPendingEditSection("idealCustomer")}
                      />
                    )}
                  </div>
                </div>
                <textarea
                  readOnly={!editingIdealCustomer}
                  value={profile.idealCustomer}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      idealCustomer: event.target.value,
                    }))
                  }
                  className={[
                    "mt-3 min-h-32 w-full rounded-sm border px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",
                    editingIdealCustomer
                      ? "border-app-border bg-app-panel"
                      : "border-app-border bg-app-panel-muted",
                  ].join(" ")}
                  placeholder="Beskriv vilka kunder ni helst vill nå."
                />
              </section>
            </div>
          </section>
        ) : null}

        {activeProfileTab === "map" ? (
          <CustomerMapView company={profile.company} customers={customerItems} />
        ) : null}

        {activeProfileTab === "offers" ? (
          <OffersList
            offers={offerItems}
            customersById={customersById}
            onCreate={() => {
              setActionError(null);
              setCreatingOffer(true);
            }}
            onEdit={(offer) => {
              setActionError(null);
              setEditingOffer(offer);
            }}
            onDelete={setDeletingOffer}
          />
        ) : null}

        {activeProfileTab === "customers" ? (
          <CustomersList
            customers={customerItems}
            onCreate={() => {
              setActionError(null);
              setCreatingCustomer(true);
            }}
            onEdit={(customer) => {
              setActionError(null);
              setEditingCustomer(customer);
            }}
            onDelete={setDeletingCustomer}
          />
        ) : null}

        {activeProfileTab === "segments" ? (
          <SavedSegmentsList segments={segments} />
        ) : null}
      </div>

      <OfferDialog
        key={editingOffer?.id ?? (creatingOffer ? "new-offer" : "closed-offer")}
        open={offerDialogOpen}
        offer={editingOffer}
        segments={segments}
        customers={customerItems}
        saving={saving}
        error={actionError}
        onCancel={() => {
          setCreatingOffer(false);
          setEditingOffer(null);
        }}
        onSave={saveOffer}
      />

      <CustomerDialog
        key={
          editingCustomer?.id ??
          (creatingCustomer ? "new-customer" : "closed-customer")
        }
        open={customerDialogOpen}
        customer={editingCustomer}
        offers={offerItems}
        saving={saving}
        error={actionError}
        onCancel={() => {
          setCreatingCustomer(false);
          setEditingCustomer(null);
        }}
        onSave={saveCustomer}
      />

      <ConfirmDialog
        open={pendingEditSection !== null}
        title={
          pendingEditSection
            ? EDIT_SECTION_COPY[pendingEditSection].title
            : "Redigera?"
        }
        description={
          pendingEditSection
            ? EDIT_SECTION_COPY[pendingEditSection].description
            : undefined
        }
        confirmLabel="Gå till redigering"
        cancelLabel="Avbryt"
        onConfirm={confirmProfileEdit}
        onCancel={() => setPendingEditSection(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingOffer)}
        title="Ta bort erbjudande?"
        description={
          deletingOffer
            ? `Erbjudandet "${deletingOffer.name}" tas bort.`
            : undefined
        }
        confirmLabel="Ta bort"
        cancelLabel="Avbryt"
        tone="danger"
        onConfirm={confirmDeleteOffer}
        onCancel={() => setDeletingOffer(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingCustomer)}
        title="Ta bort kund?"
        description={
          deletingCustomer
            ? `Kunden "${deletingCustomer.company_name}" tas bort.`
            : undefined
        }
        confirmLabel="Ta bort"
        cancelLabel="Avbryt"
        tone="danger"
        onConfirm={confirmDeleteCustomer}
        onCancel={() => setDeletingCustomer(null)}
      />
    </main>
  );
}
