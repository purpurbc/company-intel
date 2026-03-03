"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* 
NOTE: temporary page generated with AI
*/

type CompanyListItem = {
  org_nr: string;
  company_name: string;
  post_ort: string | null;
  seat_county_name: string | null;
  seat_municipality_name: string | null;
  industry_5_name: string | null;
};

type CompaniesResponse = {
  items: CompanyListItem[];
  total?: number;
  limit: number;
  offset: number;
};

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function HomePage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function search(offset = 0) {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "25");
      params.set("offset", String(offset));

      const res = await fetch(`${API}/companies?${params.toString()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = (await res.json()) as CompaniesResponse;
      setData(json);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    search(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = (data?.offset ?? 0) > 0;
  const canNext =
    data?.items?.length === (data?.limit ?? 0) && (data?.limit ?? 0) > 0;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Company Intel</h1>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök företag (namn eller orgnr)"
          className="border rounded px-3 py-2 w-full"
        />
        <button
          onClick={() => search(0)}
          className="border rounded px-3 py-2"
          disabled={loading}
        >
          Sök
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

          <ul className="divide-y border rounded">
            {data.items.map((c) => (
              <li key={c.org_nr} className="p-3">
                <Link
                  href={`/company/${encodeURIComponent(c.org_nr)}`}
                  className="font-medium hover:underline"
                >
                  {c.company_name}
                </Link>
                <div className="text-sm text-gray-600">
                  {c.org_nr}
                  {" · "}
                  {c.seat_municipality_name ?? "-"}
                  {", "}
                  {c.seat_county_name ?? "-"}
                  {" · "}
                  {c.post_ort ?? "-"}
                </div>
                <div className="text-sm">{c.industry_5_name ?? ""}</div>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <button
              className="border rounded px-3 py-2"
              disabled={!canPrev || loading}
              onClick={() => search((data.offset ?? 0) - (data.limit ?? 25))}
            >
              Föregående
            </button>
            <button
              className="border rounded px-3 py-2"
              disabled={!canNext || loading}
              onClick={() => search((data.offset ?? 0) + (data.limit ?? 25))}
            >
              Nästa
            </button>
          </div>
        </>
      )}
    </main>
  );
}