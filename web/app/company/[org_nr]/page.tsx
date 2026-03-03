import Link from "next/link";

/* 
NOTE: temporary page generated with AI
*/

const API = process.env.NEXT_PUBLIC_API_BASE;

async function getCompany(orgNr: string) {
  const res = await fetch(`${API}/company/${encodeURIComponent(orgNr)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default async function CompanyPage({
  params,
}: {
  params: { org_nr: string };
}) {

  const { org_nr } = await params;   // <-- FIX
  const orgNr = decodeURIComponent(org_nr);
  const data = await getCompany(orgNr);

  if (data?.error === "not_found") {
    return (
      <main className="p-6 max-w-3xl mx-auto">
        <Link href="/" className="hover:underline">
          ← Tillbaka
        </Link>
        <div className="mt-4">Hittade inte bolag.</div>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4">
      <Link href="/" className="hover:underline">
        ← Tillbaka
      </Link>

      <div className="border rounded p-4">
        <h1 className="text-2xl font-semibold">{data.company_name}</h1>
        <div className="text-sm text-gray-600">{data.org_nr}</div>
        <div className="mt-2 text-sm">
          {data.seat_municipality ?? "-"}, {data.seat_county ?? "-"} ·{" "}
          {data.post_ort ?? "-"}
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Översikt</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt>Bransch</dt>
          <dd>{data.bransch_1 ?? "-"}</dd>

          <dt>Avdelning</dt>
          <dd>{data.avdelning_1 ?? "-"}</dd>

          <dt>Omsättning (fin)</dt>
          <dd>{data.turnover_fin_size ?? "-"}</dd>

          <dt>Anställda</dt>
          <dd>{data.size_class ?? "-"}</dd>

          <dt>Juridisk form</dt>
          <dd>{data.legal_form ?? "-"}</dd>

          <dt>Sektor</dt>
          <dd>{data.sector ?? "-"}</dd>

          <dt>Status</dt>
          <dd>{data.company_status ?? "-"}</dd>

          <dt>Bolagsstatus</dt>
          <dd>{data.company_state ?? "-"}</dd>
        </dl>
      </div>

      <details className="border rounded p-4">
        <summary className="cursor-pointer font-semibold">Raw payload</summary>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </main>
  );
}