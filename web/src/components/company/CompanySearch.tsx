"use client";

import { useEffect, useState } from "react";

import type {
  CompaniesResponse,
  CompanySearchBy,
} from "@/src/lib/types";
import { listCompanies } from "@/src/lib/api";

import { SearchBar } from "@/src/components/ui/SearchBar";
import { Pagination } from "@/src/components/ui/Pagination";
import { CompanyList } from "@/src/components/company/CompanyList";
import { CompanyFilters } from "@/src/components/company/CompanyFilters";

export function CompanySearch() {
  const [q, setQ] = useState("");
  const [searchBy, setSearchBy] = useState<CompanySearchBy>("all");
  const [limit, setLimit] = useState(25);

  const [countyCode, setCountyCode] = useState("");
  const [municipalityCode, setMunicipalityCode] = useState("");

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
        county_code: countyCode || undefined,
        municipality_code: municipalityCode || undefined,
        limit,
        offset,
      });

      setData(res);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
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
    <section className="space-y-4">
      <SearchBar
        value={q}
        onChange={setQ}
        onSearch={() => search(0)}
        searchBy={searchBy}
        onSearchByChange={setSearchBy}
        limit={limit}
        onLimitChange={(value) => {
          setLimit(value);
        }}
        loading={loading}
        placeholder="Sök företag"
      />

      <CompanyFilters
        countyCode={countyCode}
        onCountyCodeChange={setCountyCode}
        municipalityCode={municipalityCode}
        onMunicipalityCodeChange={setMunicipalityCode}
      />

      <div className="flex gap-2">
        <button
          onClick={() => search(0)}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          Använd filter
        </button>

        <button
          onClick={() => {
            setQ("");
            setSearchBy("all");
            setLimit(25);
            setCountyCode("");
            setMunicipalityCode("");
            search(0);
          }}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          Rensa
        </button>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {loading && <div>Laddar…</div>}

      {data && (
        <>
          <div className="text-sm text-gray-600">
            Visar {data.items.length} (offset {data.offset})
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