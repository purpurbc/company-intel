import Link from "next/link";

type MunicipalityHeaderProps = {
  municipalityName: string;
  municipalityCode: string;
  countyName: string;
  countyCode: string;
};

export function MunicipalityHeader({
  municipalityName,
  municipalityCode,
  countyName,
  countyCode,
}: MunicipalityHeaderProps) {
  return (
    <header className="border-b border-app-border pb-5">
      <h1 className="text-2xl font-semibold text-app-text">
        {municipalityName}
      </h1>
      <div className="mt-2 space-y-0.5 text-sm leading-5 text-app-text-muted">
        <div>Kommun</div>
        <div>
          <span className="font-medium text-app-text-subtle">Kod:</span>{" "}
          {municipalityCode}
        </div>
        <div>
          <span className="font-medium text-app-text-subtle">Län:</span>{" "}
          {countyCode ? (
            <Link
              href={`/county/${encodeURIComponent(countyCode)}`}
              className="font-medium text-app-text underline decoration-app-border-strong underline-offset-4 hover:text-app-accent-text"
            >
              {countyName}
            </Link>
          ) : (
            countyName
          )}
        </div>
      </div>
    </header>
  );
}
