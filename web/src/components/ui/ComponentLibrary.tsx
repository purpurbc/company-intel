"use client";

import { useState } from "react";
import { Button, ActionControl, type ButtonVariant } from "@/src/components/ui/Button";
import { CollapsibleSection } from "@/src/components/ui/CollapsableSection";
import { CopyToClipboardButton } from "@/src/components/ui/CopyToClipboardButton";
import { CountChip, FilterChip, InfoChip, StatusChip } from "@/src/components/ui/Chip";
import { Dialog } from "@/src/components/ui/Dialog";
import { DataVisualization } from "@/src/components/ui/DataVisualization";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Feedback } from "@/src/components/ui/Feedback";
import { HorizontalBarList } from "@/src/components/ui/HorizontalBarList";
import { KpiCard, KpiGrid } from "@/src/components/ui/KpiCard";
import { List, ListItem } from "@/src/components/ui/List";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { Pagination } from "@/src/components/ui/Pagination";
import { SearchBar } from "@/src/components/ui/SearchBar";
import { SearchExamples } from "@/src/components/ui/SearchExamples";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { SkeletonBlock, SkeletonLine } from "@/src/components/ui/Skeleton";
import { SummaryGrid, SummaryItem } from "@/src/components/ui/SummaryGrid";
import {
  DetailField,
  DetailGrid,
  DetailList,
  DetailRow,
  DetailSection,
} from "@/src/components/ui/StructuredDetails";
import { Inset, Section, Surface } from "@/src/components/ui/Surface";
import { Tabs } from "@/src/components/ui/Tabs";
import { TextLink } from "@/src/components/ui/TextLink";
import { ListViewToggle } from "@/src/components/ui/ListViewToggle";
import { FilterChipGroup } from "@/src/components/company/FilterChipGroup";
import {
  WorkspaceListSort,
  type WorkspaceListSortValue,
} from "@/src/components/workspace/WorkspaceListSort";
import type { CompanySearchBy } from "@/src/lib/types";
import { ui } from "@/src/lib/uiStyles";

const buttonVariants: Array<{ value: ButtonVariant; label: string }> = [
  { value: "primary", label: "Primär" },
  { value: "secondary", label: "Sekundär" },
  { value: "accent", label: "Accent" },
  { value: "accept", label: "Godkänn" },
  { value: "delete", label: "Ta bort" },
  { value: "ghost", label: "Diskret" },
];

const catalogIcons = [
  ["Lägg till", "/icons/utility/add.svg"],
  ["Bekräfta", "/icons/utility/check-circle.svg"],
  ["Kopiera", "/icons/utility/copy-clipboard.svg"],
  ["Stäng", "/icons/utility/cross.svg"],
  ["Mer", "/icons/utility/dots-vertical.svg"],
  ["Redigera", "/icons/utility/edit.svg"],
  ["Ta bort", "/icons/utility/trashcan_delete.svg"],
  ["Uppdatera", "/icons/utility/update.svg"],
  ["Företag", "/icons/menu/industry-svgrepo-com.svg"],
  ["Karta", "/icons/menu/map-svgrepo-com.svg"],
] as const;

type CatalogTab = "overview" | "details" | "history";
type CatalogSelect = "all" | "active" | "inactive";
type CatalogDensity = "card" | "compact";

export function ComponentLibrary() {
  const [tab, setTab] = useState<CatalogTab>("overview");
  const [selectValue, setSelectValue] = useState<CatalogSelect>("all");
  const [density, setDensity] = useState<CatalogDensity>("card");
  const [workspaceSort, setWorkspaceSort] =
    useState<WorkspaceListSortValue>("name_asc");
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["active"]);
  const [query, setQuery] = useState("");
  const [searchBy, setSearchBy] = useState<CompanySearchBy>("all");
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);

  function toggleFilter(value: string) {
    setSelectedFilters((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  return (
    <div className="space-y-5">
      <Section title="Ytor och typografi" description="Page · PageHeader · Surface · Section · Inset">
        <div className="grid gap-3 lg:grid-cols-3">
          <Surface padding="compact">
            <p className={ui.eyebrow}>Överrubrik</p>
            <h3 className="mt-1 text-lg font-semibold text-app-text">Panelyta</h3>
            <p className={ui.sectionDescription}>Standardyta med kantlinje och skugga.</p>
          </Surface>
          <Surface tone="soft" padding="compact">
            <p className={ui.eyebrow}>Dämpad yta</p>
            <p className="mt-2 text-sm text-app-text-muted">För sekundärt innehåll.</p>
          </Surface>
          <Inset>
            <p className={ui.fieldLabel}>Fältetikett</p>
            <p className="mt-1 text-sm text-app-text">Inbäddad informationsyta</p>
            <p className={ui.helpText}>Hjälptext och kompletterande information.</p>
          </Inset>
        </div>
      </Section>

      <Section title="Knappar och åtgärder" description="Button · ActionControl · CopyToClipboardButton">
        <div className="flex flex-wrap items-center gap-2">
          {buttonVariants.map((variant) => (
            <Button key={variant.value} type="button" variant={variant.value} size="sm">
              {variant.label}
            </Button>
          ))}
          <Button type="button" size="sm" disabled>Inaktiverad</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="sm">
            Spara
            <MaskedIcon src="/icons/utility/add.svg" className="h-4 w-4" />
          </Button>
          <ActionControl
            label="Redigera"
            icon={<MaskedIcon src="/icons/utility/edit.svg" className="h-4 w-4" />}
          />
          <ActionControl
            label="Uppdatera"
            icon={<MaskedIcon src="/icons/utility/update.svg" className="h-4 w-4" />}
          >
            Uppdatera
          </ActionControl>
          <span className="inline-flex items-center gap-1 text-sm text-app-text-muted">
            556000-0000 <CopyToClipboardButton value="5560000000" />
          </span>
        </div>
      </Section>

      <Section title="Chips och etiketter" description="FilterChip · InfoChip · CountChip · StatusChip">
        <div className="flex flex-wrap items-start gap-2">
          <FilterChip selected={false} onClick={() => undefined}>Valbart</FilterChip>
          <FilterChip selected onClick={() => undefined}>Valt filter</FilterChip>
          <FilterChip disabled>Inaktiverat</FilterChip>
          <InfoChip>Information</InfoChip>
          <InfoChip className="max-w-52">Längre information som kan brytas över flera rader</InfoChip>
          <CountChip>3 valda</CountChip>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusChip tone="positive">Verksam</StatusChip>
          <StatusChip tone="danger">Ej längre verksam</StatusChip>
          <StatusChip tone="brown">Aldrig varit verksam</StatusChip>
          <StatusChip tone="warning">Likvidation beslutad</StatusChip>
          <StatusChip>Uppgift saknas</StatusChip>
        </div>
      </Section>

      <Section title="Sökning och formulär" description="SearchBar · SelectMenu · ListViewToggle · FilterChipGroup">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={() => undefined}
          searchBy={searchBy}
          onSearchByChange={setSearchBy}
          placeholder="Sök företag"
        >
          <SearchExamples examples={["Vium AB", "bygg Örebro", "5560000000"]} onSelect={setQuery} />
        </SearchBar>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="block w-56">
            <span className={ui.fieldLabel}>Dropdown</span>
            <span className="mt-1 block">
              <SelectMenu<CatalogSelect>
                label="Status"
                value={selectValue}
                onChange={setSelectValue}
                align="left"
                options={[
                  { value: "all", label: "Alla företag" },
                  { value: "active", label: "Verksamma" },
                  { value: "inactive", label: "Ej verksamma" },
                ]}
              />
            </span>
          </label>
          <ListViewToggle
            value={density}
            onChange={setDensity}
            ariaLabel="Listvisning"
          />
          <label className="block w-56">
            <span className={ui.fieldLabel}>Textfält</span>
            <input className={[ui.input, "mt-1"].join(" ")} placeholder="Skriv något" />
          </label>
        </div>

        <div className="mt-4 max-w-2xl">
          <FilterChipGroup
            title="Verksamhetsstatus"
            defaultOpen
            options={[
              { value: "active", label: "Verksam" },
              { value: "inactive", label: "Ej verksam" },
              { value: "never", label: "Aldrig verksam" },
            ]}
            selectedValues={selectedFilters}
            onToggle={toggleFilter}
          />
        </div>
      </Section>

      <Section title="Navigation och menyer" description="Tabs · DropdownMenu · WorkspaceListSort · Pagination · TextLink">
        <Tabs<CatalogTab>
          items={[
            { key: "overview", label: "Översikt" },
            { key: "details", label: "Detaljer" },
            { key: "history", label: "Händelser" },
          ]}
          value={tab}
          onChange={setTab}
          ariaLabel="Exempelflikar"
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <DropdownMenu
            label="Fler åtgärder"
            icon={<MaskedIcon src="/icons/utility/dots-vertical.svg" className="h-4 w-4" />}
            align="left"
            items={[
              { key: "open", label: "Öppna" },
              { key: "edit", label: "Redigera", icon: <MaskedIcon src="/icons/utility/edit.svg" className="h-4 w-4" /> },
              { key: "delete", label: "Ta bort", separatorBefore: true },
            ]}
          />
          <WorkspaceListSort
            value={workspaceSort}
            onChange={setWorkspaceSort}
          />
          <TextLink href="/companies">Textlänk till företag</TextLink>
          <span className="text-sm text-app-text-muted">Aktiv flik: {tab}</span>
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={240}
            hasNextPage={page < Math.ceil(240 / pageSize)}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          title="Listor och detaljer"
          description="List · StructuredDetails · DataVisualization"
        >
          <List surface="soft" title="Företag" description="Numrerad standardlista">
            <ListItem numbered index={1}>
              <p className="text-sm font-semibold text-app-text">Exempelbolaget AB</p>
              <p className="text-xs text-app-text-muted">Org.nr 556000-0000</p>
            </ListItem>
            <ListItem numbered index={2} tone="muted">
              <p className="text-sm font-semibold text-app-text">Nordisk Data AB</p>
              <p className="text-xs text-app-text-muted">Org.nr 556111-1111</p>
            </ListItem>
          </List>
          <DetailGrid columns={2} className="mt-4">
            <DetailField label="Kommun">Örebro</DetailField>
            <DetailField label="Antal anställda">24</DetailField>
          </DetailGrid>
          <DetailSection title="Beskrivning" className="mt-2">
            Gemensam yta för längre, strukturerad information.
          </DetailSection>
          <DetailList className="mt-3">
            <DetailRow label="Bolagsläge">Normalläge</DetailRow>
            <DetailRow label="Datakälla">Bolagsverket</DetailRow>
          </DetailList>
          <SummaryGrid columns={3} className="mt-3">
            <SummaryItem label="Bransch">Byggverksamhet</SummaryItem>
            <SummaryItem label="Omsättning">10–20 mkr</SummaryItem>
            <SummaryItem label="Antal anställda">10–19</SummaryItem>
          </SummaryGrid>
          <div className="mt-4">
            <DataVisualization
              caption="Exempel på kompakt dataöversikt"
              sortable
              chart={{
                xKey: "period",
                modes: ["line", "spline", "bar"],
                groupKey: "type",
                xOptions: [
                  { key: "period", label: "Period", groupKey: "type" },
                  { key: "type", label: "Typ", groupKey: "period", categorical: true },
                ],
                series: [
                  { key: "new", label: "Nya" },
                  { key: "closed", label: "Avslutade" },
                ],
              }}
              columns={[
                { key: "period", label: "Period" },
                { key: "type", label: "Typ" },
                { key: "new", label: "Nya", align: "right" },
                { key: "closed", label: "Avslutade", align: "right" },
              ]}
              rows={[
                {
                  key: "2026-08",
                  cells: {
                    period: "aug. 2026",
                    type: "Aktiebolag",
                    new: "4 215",
                    closed: "3 151",
                  },
                  sortValues: { period: "2026-08", type: "Aktiebolag", new: 4215, closed: 3151 },
                },
                {
                  key: "2026-07",
                  cells: {
                    period: "juli 2026",
                    type: "Aktiebolag",
                    new: "3 358",
                    closed: "3 319",
                  },
                  sortValues: { period: "2026-07", type: "Aktiebolag", new: 3358, closed: 3319 },
                },
                {
                  key: "2026-06",
                  cells: { period: "juni 2026", type: "Aktiebolag", new: "4 908", closed: "4 552" },
                  sortValues: { period: "2026-06", type: "Aktiebolag", new: 4908, closed: 4552 },
                },
                {
                  key: "2026-08-lager",
                  cells: { period: "aug. 2026", type: "Lagerbolag", new: "2 010", closed: "1 503" },
                  sortValues: { period: "2026-08", type: "Lagerbolag", new: 2010, closed: 1503 },
                },
                {
                  key: "2026-07-lager",
                  cells: { period: "juli 2026", type: "Lagerbolag", new: "1 808", closed: "1 703" },
                  sortValues: { period: "2026-07", type: "Lagerbolag", new: 1808, closed: 1703 },
                },
                {
                  key: "2026-06-lager",
                  cells: { period: "juni 2026", type: "Lagerbolag", new: "2 508", closed: "2 120" },
                  sortValues: { period: "2026-06", type: "Lagerbolag", new: 2508, closed: 2120 },
                },
              ]}
            />
          </div>
        </Section>

        <Section title="Nyckeltal" description="KpiGrid · KpiCard" source="Bolagsverket">
          <KpiGrid columns="four">
            <KpiCard label="Företag" value="12 480" detail="Aktiva" />
            <KpiCard label="Omsättning" value="84,2 mdkr" detail="Senaste år" />
            <KpiCard label="Anställda" value="36 210" />
            <KpiCard label="Tillväxt" value="+4,8 %" />
          </KpiGrid>
        </Section>
      </div>

      <HorizontalBarList
        title="Horisontell fördelning"
        source="SCB"
        items={[
          { code: "A", name: "Byggverksamhet", count: 480 },
          { code: "B", name: "Handel", count: 320 },
          { code: "C", name: "Konsultverksamhet", count: 200 },
        ]}
      />

      <Section title="Feedback och laddning" description="Feedback · EmptyState · Skeleton">
        <div className="grid gap-3 lg:grid-cols-3">
          <Feedback>Neutral information.</Feedback>
          <Feedback tone="warning">Något behöver kontrolleras.</Feedback>
          <Feedback tone="danger">Åtgärden kunde inte slutföras.</Feedback>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Inset>
            <EmptyState
              compact
              title="Inga resultat"
              description="Justera urvalet och försök igen."
              action={<Button type="button" variant="secondary" size="xs">Rensa filter</Button>}
            />
          </Inset>
          <Inset>
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="mt-3 w-full" />
            <SkeletonBlock className="mt-3 h-12 w-full" />
          </Inset>
        </div>
      </Section>

      <Section title="Expansion och dialog" description="CollapsibleSection · Dialog">
        <CollapsibleSection title="Expanderbart block" subtitle="Samma rörelse används genom applikationen." badge="2 fält">
          <p className="text-sm text-app-text-muted">Innehållet öppnas och stängs med standardiserad animation.</p>
        </CollapsibleSection>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
          Öppna dialog
        </Button>
      </Section>

      <Section title="Ikoner" description="MaskedIcon · gemensamma meny- och funktionsikoner">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {catalogIcons.map(([label, src]) => (
            <Inset key={src} className="flex items-center gap-2">
              <MaskedIcon src={src} className="h-4 w-4 text-app-text" />
              <span className="truncate text-xs text-app-text-muted">{label}</span>
            </Inset>
          ))}
        </div>
      </Section>

      {dialogOpen ? (
        <Dialog
          title="Exempeldialog"
          labelledBy="component-library-dialog-title"
          eyebrow="Dialog"
          width="sm"
          onClose={() => setDialogOpen(false)}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Avbryt</Button>
              <Button type="button" onClick={() => setDialogOpen(false)}>Spara</Button>
            </>
          }
        >
          <p className="text-sm text-app-text-muted">Dialogen renderas ovanför hela appskalet.</p>
        </Dialog>
      ) : null}
    </div>
  );
}
