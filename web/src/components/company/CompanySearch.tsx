"use client";

import { useEffect, useState } from "react";

import type { CompaniesResponse, CompanySearchBy } from "@/src/lib/types";
import { listCompanies } from "@/src/lib/api";

import { SearchBar } from "@/src/components/ui/SearchBar";
import { Pagination } from "@/src/components/ui/Pagination";
import { CompanyList } from "@/src/components/company/CompanyList";
import { CompanyFilterPanel } from "@/src/components/company/CompanyFilterPanel";

export function CompanySearch() {
  const [q, setQ] = useState("");
  const [searchBy, setSearchBy] = useState<CompanySearchBy>("all");
  const [limit, setLimit] = useState(25);

  const [countyCodes, setCountyCodes] = useState<string[]>([]);
  const [municipalityCodes, setMunicipalityCodes] = useState<string[]>([]);
  const [sizeClassCodes, setSizeClassCodes] = useState<string[]>([]);
  const [industryCodes, setIndustryCodes] = useState<string[]>([]);

  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search(offset = 0) {
    setLoading(true);
    setErr(null);

    try {
      const res = await listCompanies({
        q,
        search_by: searchBy,
        county_codes: countyCodes.length > 0 ? countyCodes : undefined,
        municipality_codes:
          municipalityCodes.length > 0 ? municipalityCodes : undefined,
        size_class_codes: sizeClassCodes.length > 0 ? sizeClassCodes : undefined,
        industry_codes: industryCodes.length > 0 ? industryCodes : undefined,
        limit,
        offset,
      } as any);

      setData(res);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setQ("");
    setSearchBy("all");
    setLimit(25);
    setCountyCodes([]);
    setMunicipalityCodes([]);
    setSizeClassCodes([]);
    setIndustryCodes([]);
  }

  useEffect(() => {
    search(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offset = data?.offset ?? 0;
  const itemCount = data?.items?.length ?? 0;

  const canPrev = offset > 0;
  const canNext = itemCount === limit && limit > 0;

  return (
    <section className="space-y-5">
      <SearchBar
        value={q}
        onChange={setQ}
        onSearch={() => search(0)}
        searchBy={searchBy}
        onSearchByChange={setSearchBy}
        limit={limit}
        onLimitChange={setLimit}
        loading={loading}
        placeholder="Sök företag"
      />

      <CompanyFilterPanel
        countyCodes={countyCodes}
        municipalityCodes={municipalityCodes}
        sizeClassCodes={sizeClassCodes}
        industryCodes={industryCodes}
        onCountyCodesChange={setCountyCodes}
        onMunicipalityCodesChange={setMunicipalityCodes}
        onSizeClassCodesChange={setSizeClassCodes}
        onIndustryCodesChange={setIndustryCodes}
      />

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => search(0)}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          Använd filter
        </button>

        <button
          onClick={() => {
            resetFilters();
            setTimeout(() => search(0), 0);
          }}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          Rensa
        </button>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Laddar…
        </div>
      )}

      {data && (
        <>
          <div className="text-sm text-slate-600">
            Visar {data.items.length} träffar (offset {data.offset})
            {typeof data.total === "number" ? ` av ${data.total}` : ""}
          </div>

          <CompanyList items={data.items} />

          <Pagination
            canPrev={canPrev}
            canNext={canNext}
            loading={loading}
            onPrev={() => search(offset - limit)}
            onNext={() => search(offset + limit)}
          />
        </>
      )}
    </section>
  );
}
