import Link from "next/link";

type MunicipalityHeaderProps = {
  municipalityName: string;
  countyName: string;
  countyCode: string;
};

export function MunicipalityHeader({
  municipalityName,
  countyName,
  countyCode,
}: MunicipalityHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Kommunal marknad
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
        {municipalityName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Översikt över företagsbas, branschmix och säljsignaler i kommunen.
      </p>
      <div className="mt-3 text-sm text-slate-400">
        Län:{" "}
        <Link
          href={`/county/${encodeURIComponent(countyCode)}`}
          className="font-medium text-slate-200 underline decoration-slate-600 underline-offset-4 hover:text-white"
        >
          {countyName}
        </Link>
      </div>
    </section>
  );
}
