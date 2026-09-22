"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { listCompanies, updateUserProfile } from "@/src/lib/api";
import { companyDisplayName } from "@/src/lib/companyNames";
import { formatOrganizationNumber } from "@/src/lib/organizationNumber";
import type {
  AppUserProfile,
  AppUserProfilePayload,
  CompanyListItem,
} from "@/src/lib/types";
import { Button, buttonClassName } from "@/src/components/ui/Button";
import { Feedback } from "@/src/components/ui/Feedback";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { Page } from "@/src/components/ui/Page";
import { PageHeader } from "@/src/components/ui/PageHeader";
import { Section } from "@/src/components/ui/Surface";
import { ui } from "@/src/lib/uiStyles";

type ProfileState = {
  displayName: string;
  email: string;
  company: CompanyListItem | null;
  companyDescription: string;
  idealCustomer: string;
};

type EditableSection = "account" | "company" | "target";

const EDIT_ICON = "/icons/utility/edit.svg";

function companyLocation(company: {
  postal_city?: string | null;
  municipality_name?: string | null;
  county_name?: string | null;
}) {
  return [
    company.municipality_name ?? company.postal_city,
    company.county_name,
  ]
    .filter(Boolean)
    .join(" · ");
}

function companyFromProfile(profile: AppUserProfile): CompanyListItem | null {
  if (!profile.company_org_nr || !profile.company_name) return null;

  return {
    org_nr: profile.company_org_nr,
    company_id: profile.company_id ?? 0,
    entity_type: profile.company_entity_type ?? "organization",
    pe_org_nr: profile.company_pe_org_nr ?? null,
    company_name: profile.company_name,
    registered_name: profile.company_registered_name ?? null,
    matched_name: null,
    care_of_address: null,
    postal_address: null,
    postal_code: null,
    postal_city: profile.postal_city,
    municipality_code: profile.municipality_code,
    municipality_name: profile.municipality_name,
    county_code: profile.county_code,
    county_name: profile.county_name,
    region_code: null,
    region_name: null,
    primary_industry_code: null,
    primary_industry_name: null,
    industry_section_code: null,
    industry_section_name: null,
    employee_size_code: null,
    employee_size: null,
    turnover_size_code: null,
    turnover_size: null,
    turnover_financial_size_code: null,
    turnover_financial_size: null,
    organization_form_code: null,
    organization_form: null,
    activity_status_code: null,
    activity_status: null,
    company_state_code: null,
    company_state: null,
    employer_status_code: null,
    employer_status: null,
  };
}

function stateFromProfile(profile: AppUserProfile): ProfileState {
  return {
    displayName: profile.display_name ?? "",
    email: profile.email ?? "",
    company: companyFromProfile(profile),
    companyDescription: profile.company_description ?? "",
    idealCustomer: profile.ideal_customer_description ?? "",
  };
}

function companyKey(company: CompanyListItem | null) {
  return company?.company_id ?? company?.pe_org_nr ?? company?.org_nr ?? "";
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="secondary"
      size="icon"
      className="h-7 min-w-7 px-1.5 py-0"
      aria-label={label}
      title={label}
    >
      <MaskedIcon src={EDIT_ICON} />
    </Button>
  );
}

function CompanySearchBox({
  onSelect,
}: {
  onSelect: (company: CompanyListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function search() {
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await listCompanies({
        q: value,
        search_by: "all",
        limit: 8,
        offset: 0,
      });
      setResults(response.items);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Sökningen kunde inte genomföras.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearched(false);
            setResults([]);
          }}
          className={[ui.input, "min-w-0 flex-1"].join(" ")}
          placeholder="Sök namn eller org.nr"
          aria-label="Sök eget företag"
        />
        <Button type="submit" disabled={loading || !query.trim()} variant="secondary">
          {loading ? "Söker…" : "Sök"}
        </Button>
      </form>

      {error ? <Feedback tone="danger">{error}</Feedback> : null}
      {!loading && searched && !error && results.length === 0 ? (
        <Feedback>Inga företag hittades.</Feedback>
      ) : null}
      {results.length > 0 ? (
        <div className="max-h-64 overflow-auto rounded-md border border-app-border">
          {results.map((company) => {
            const name = companyDisplayName(company);
            return (
              <button
                key={companyKey(company)}
                type="button"
                onClick={() => {
                  onSelect(company);
                  setQuery("");
                  setResults([]);
                  setSearched(false);
                }}
                className={[ui.selectMenuOption, "border-b border-app-border last:border-b-0 hover:bg-app-panel-hover-soft"].join(" ")}
              >
                <span className="block truncate font-semibold text-app-text">
                  {name.primary}
                </span>
                <span className="mt-0.5 block text-xs text-app-text-subtle">
                  {formatOrganizationNumber(company.org_nr)}
                  {companyLocation(company)
                    ? ` · ${companyLocation(company)}`
                    : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SectionActions({
  editing,
  dirty,
  saving,
  onEdit,
  onSave,
  onCancel,
}: {
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!editing) return <EditButton onClick={onEdit} label="Redigera" />;

  return (
    <>
      <Button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        variant="secondary"
        size="xs"
      >
        {saving ? "Sparar…" : "Spara"}
      </Button>
      <Button type="button" onClick={onCancel} variant="secondary" size="xs">
        Avbryt
      </Button>
    </>
  );
}

export function ProfileWorkspace({ userProfile }: { userProfile: AppUserProfile }) {
  const [profile, setProfile] = useState(() => stateFromProfile(userProfile));
  const [savedProfile, setSavedProfile] = useState(() =>
    stateFromProfile(userProfile),
  );
  const [editing, setEditing] = useState<EditableSection | null>(null);
  const [selectingCompany, setSelectingCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountDirty =
    profile.displayName !== savedProfile.displayName ||
    profile.email !== savedProfile.email;
  const companyDirty =
    companyKey(profile.company) !== companyKey(savedProfile.company) ||
    profile.companyDescription !== savedProfile.companyDescription;
  const targetDirty = profile.idealCustomer !== savedProfile.idealCustomer;
  const hasUnsavedChanges = accountDirty || companyDirty || targetDirty;

  const discardDraft = useCallback(() => {
    setProfile(savedProfile);
    setEditing(null);
    setSelectingCompany(false);
  }, [savedProfile]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function beforeNavigation(event: MouseEvent) {
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
      if (new URL(link.href, window.location.href).href === window.location.href) {
        return;
      }

      if (!window.confirm("Lämna sidan utan att spara ändringarna?")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      discardDraft();
    }

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeNavigation, true);
    };
  }, [discardDraft, hasUnsavedChanges]);

  function startEditing(section: EditableSection) {
    if (editing && editing !== section && hasUnsavedChanges) {
      const proceed = window.confirm(
        "Kassera osparade ändringar och redigera en annan del?",
      );
      if (!proceed) return;
      discardDraft();
    }
    setEditing(section);
    setError(null);
  }

  function payload(next: ProfileState): AppUserProfilePayload {
    return {
      auth_provider: userProfile.auth_provider,
      auth_subject: userProfile.auth_subject,
      email: next.email.trim() || null,
      display_name: next.displayName.trim() || "MVP User",
      role: userProfile.role || "user",
      company_org_nr: next.company?.org_nr ?? null,
      company_id: next.company?.company_id || null,
      company_description: next.companyDescription.trim() || null,
      ideal_customer_description: next.idealCustomer.trim() || null,
      settings: userProfile.settings ?? {},
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile(payload(profile));
      const next = stateFromProfile(updated);
      setProfile(next);
      setSavedProfile(next);
      setEditing(null);
      setSelectingCompany(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profilen kunde inte sparas.",
      );
    } finally {
      setSaving(false);
    }
  }

  function cancel(section: EditableSection) {
    setProfile((current) => {
      if (section === "account") {
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
          companyDescription: savedProfile.companyDescription,
        };
      }
      return { ...current, idealCustomer: savedProfile.idealCustomer };
    });
    setEditing(null);
    setSelectingCompany(false);
  }

  const selectedCompanyHref = profile.company
    ? `/company/${encodeURIComponent(
        profile.company.company_id
          ? `id:${profile.company.company_id}`
          : profile.company.pe_org_nr ?? profile.company.org_nr,
      )}`
    : null;

  return (
    <Page>
      <PageHeader
        title="Profil"
        actions={
          selectedCompanyHref ? (
            <Link
              href={selectedCompanyHref}
              className={buttonClassName({ variant: "secondary", size: "sm" })}
            >
              Företagssida
            </Link>
          ) : null
        }
      />

      {error ? <Feedback tone="danger">{error}</Feedback> : null}

      <div className={ui.sectionGrid}>
        <Section
          title="Konto"
          actions={
            <SectionActions
              editing={editing === "account"}
              dirty={accountDirty}
              saving={saving}
              onEdit={() => startEditing("account")}
              onSave={() => void save()}
              onCancel={() => cancel("account")}
            />
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={ui.fieldLabel}>Visningsnamn</span>
              <input
                readOnly={editing !== "account"}
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                className={[
                  editing === "account" ? ui.input : ui.inputReadOnly,
                  "mt-2",
                ].join(" ")}
              />
            </label>
            <label className="block">
              <span className={ui.fieldLabel}>E-post</span>
              <input
                readOnly={editing !== "account"}
                value={profile.email}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={[
                  editing === "account" ? ui.input : ui.inputReadOnly,
                  "mt-2",
                ].join(" ")}
              />
            </label>
          </div>
        </Section>

        <Section
          title="Eget företag"
          actions={
            <SectionActions
              editing={editing === "company"}
              dirty={companyDirty}
              saving={saving}
              onEdit={() => startEditing("company")}
              onSave={() => void save()}
              onCancel={() => cancel("company")}
            />
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-semibold text-app-text">
                {profile.company
                  ? companyDisplayName(profile.company).primary
                  : "Inget företag valt"}
              </div>
              {profile.company ? (
                <div className="mt-1 text-xs text-app-text-subtle">
                  {formatOrganizationNumber(profile.company.org_nr)}
                  {companyLocation(profile.company)
                    ? ` · ${companyLocation(profile.company)}`
                    : ""}
                </div>
              ) : null}
            </div>
            {editing === "company" ? (
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => setSelectingCompany((current) => !current)}
              >
                Välj företag
              </Button>
            ) : null}
          </div>

          {editing === "company" && selectingCompany ? (
            <div className="mt-3 border-t border-app-border pt-3">
              <CompanySearchBox
                onSelect={(company) => {
                  setProfile((current) => ({ ...current, company }));
                  setSelectingCompany(false);
                }}
              />
            </div>
          ) : null}

          <label className="mt-4 block border-t border-app-border pt-3">
            <span className={ui.fieldLabel}>Beskrivning</span>
            <textarea
              readOnly={editing !== "company"}
              value={profile.companyDescription}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  companyDescription: event.target.value,
                }))
              }
              className={[
                editing === "company" ? ui.textarea : ui.inputReadOnly,
                "mt-2 min-h-28",
              ].join(" ")}
              placeholder="Beskriv företaget med egna ord."
            />
          </label>
        </Section>

        <Section
          title="Målgrupp"
          actions={
            <SectionActions
              editing={editing === "target"}
              dirty={targetDirty}
              saving={saving}
              onEdit={() => startEditing("target")}
              onSave={() => void save()}
              onCancel={() => cancel("target")}
            />
          }
        >
          <label className="block">
            <span className={ui.fieldLabel}>Idealkund</span>
            <textarea
              readOnly={editing !== "target"}
              value={profile.idealCustomer}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  idealCustomer: event.target.value,
                }))
              }
              className={[
                editing === "target" ? ui.textarea : ui.inputReadOnly,
                "mt-2 min-h-32",
              ].join(" ")}
              placeholder="Beskriv vilka kunder ni helst vill nå."
            />
          </label>
        </Section>
      </div>
    </Page>
  );
}
