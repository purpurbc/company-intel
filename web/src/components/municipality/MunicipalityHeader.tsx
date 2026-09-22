import { TextLink } from "@/src/components/ui/TextLink";
import { PageHeader } from "@/src/components/ui/PageHeader";

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
    <PageHeader
      title={municipalityName}
      meta={
        <>
        <div>Kommun</div>
        <div>
          <span className="font-medium text-app-text-subtle">Kod:</span>{" "}
          {municipalityCode}
        </div>
        <div>
          <span className="font-medium text-app-text-subtle">Län:</span>{" "}
          {countyCode ? (
            <TextLink href={`/county/${encodeURIComponent(countyCode)}`}>
              {countyName}
            </TextLink>
          ) : (
            countyName
          )}
        </div>
        </>
      }
    />
  );
}
