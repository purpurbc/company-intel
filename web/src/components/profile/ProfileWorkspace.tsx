"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
    className: "border-emerald-500/40 bg-emerald-500/12 text-emerald-200",
  },
  {
    value: "bad_match",
    label: "Dålig match",
    className: "border-amber-500/40 bg-amber-500/12 text-amber-200",
  },
  {
    value: "good_customer",
    label: "Bra kund",
    className: "border-sky-500/40 bg-sky-500/12 text-sky-200",
  },
  {
    value: "strategic",
    label: "Strategisk",
    className: "border-violet-500/40 bg-violet-500/12 text-violet-200",
  },
  {
    value: "partnership",
    label: "Partnerskap",
    className: "border-cyan-500/40 bg-cyan-500/12 text-cyan-200",
  },
  {
    value: "reference",
    label: "Referenskund",
    className: "border-lime-500/40 bg-lime-500/12 text-lime-200",
  },
  {
    value: "very_bad_customer",
    label: "Extremt dålig kund",
    className: "border-red-500/40 bg-red-500/12 text-red-200",
  },
] as const;

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
        "rounded-md border px-2 py-1 text-xs font-medium",
        meta?.className ??
          "border-app-border bg-app-panel-soft text-app-text-muted",
      ].join(" ")}
    >
      {meta?.label ?? value}
    </span>
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
                      "rounded-md border px-2.5 py-1.5 text-xs font-medium transition",
                      active
                        ? label.className
                        : "border-app-border bg-app-panel text-app-text-muted hover:bg-app-panel-hover hover:text-app-text",
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
  const [confirmCompanyChangeOpen, setConfirmCompanyChangeOpen] =
    useState(false);
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

  const showCompanySearch = !profile.company || companyChangeMode;

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
      setProfile(profileFromUserProfile(saved));
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Kunde inte spara profilen.",
      );
    } finally {
      setProfileSaving(false);
    }
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
    <main className="min-h-screen bg-app-bg p-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-md border border-app-border bg-app-panel p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                Användarprofil
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-app-text">
                Profil & ICP
              </h1>
              <p className="mt-2 text-xs text-app-text-subtle">
                User ID: {userProfile.id}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {profileSaving ? (
                <span className="rounded-md border border-app-border bg-app-panel-soft px-3 py-2.5 text-sm text-app-text-subtle">
                  Sparar profil...
                </span>
              ) : null}
              <Link
                href="/"
                className="rounded-md border border-app-border-strong bg-app-panel px-4 py-2.5 text-sm font-medium text-app-text transition hover:bg-app-panel-hover"
              >
                Dashboard
              </Link>
              {selectedCompanyHref ? (
                <Link
                  href={selectedCompanyHref}
                  className="rounded-md bg-app-control-bg px-4 py-2.5 text-sm font-medium text-app-control-text transition hover:bg-app-control-bg-hover"
                >
                  Företagssida
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        {actionError ? (
          <div className="rounded-md border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
            {actionError}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-md border border-app-border bg-app-panel p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
              Användare & eget företag
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                  Display name
                </span>
                <input
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  onBlur={() => void saveUserProfile()}
                  className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                  placeholder="Ditt namn"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                  Email
                </span>
                <input
                  value={profile.email}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  onBlur={() => void saveUserProfile()}
                  className="mt-2 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                  placeholder="namn@foretag.se"
                />
              </label>
            </div>
            <div className="mt-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-app-text">
                  {profile.company?.company_name ?? "Välj företag"}
                </h2>
                <p className="mt-1 text-sm text-app-text-subtle">{companyMeta}</p>
              </div>
              {profile.company ? (
                <button
                  type="button"
                  onClick={() => setConfirmCompanyChangeOpen(true)}
                  className="shrink-0 rounded-md border border-app-border bg-app-panel px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
                >
                  Ändra
                </button>
              ) : null}
            </div>

            {showCompanySearch ? (
              <div className="mt-4">
                <CompanySearchBox
                  onSelect={(company) => {
                    const nextProfile = { ...profile, company };
                    setProfile(nextProfile);
                    setCompanyChangeMode(false);
                    void saveUserProfile(nextProfile);
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-5">
            <label className="block rounded-md border border-app-border bg-app-panel p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                Företagsbeskrivning
              </span>
              <textarea
                value={profile.companyDescription}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    companyDescription: event.target.value,
                  }))
                }
                onBlur={() => void saveUserProfile()}
                className="mt-3 min-h-32 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="Beskriv företaget med era egna ord."
              />
            </label>

            <label className="block rounded-md border border-app-border bg-app-panel p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-app-text-subtle">
                Idealkund
              </span>
              <textarea
                value={profile.idealCustomer}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    idealCustomer: event.target.value,
                  }))
                }
                onBlur={() => void saveUserProfile()}
                className="mt-3 min-h-32 w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2.5 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus"
                placeholder="Beskriv vilka kunder ni helst vill nå."
              />
            </label>
          </div>
        </section>

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

        <SavedSegmentsList segments={segments} />
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
        open={confirmCompanyChangeOpen}
        title="Ändra valt företag?"
        description={
          profile.company
            ? `Valet "${profile.company.company_name}" tas bort och du kan söka fram ett nytt företag.`
            : undefined
        }
        confirmLabel="Ta bort val"
        cancelLabel="Avbryt"
        onConfirm={() => {
          const nextProfile = { ...profile, company: null };
          setProfile(nextProfile);
          setCompanyChangeMode(false);
          setConfirmCompanyChangeOpen(false);
          void saveUserProfile(nextProfile);
        }}
        onCancel={() => setConfirmCompanyChangeOpen(false)}
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
