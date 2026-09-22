type CountyHeaderProps = {
  countyName: string;
  countyCode: string;
};

export function CountyHeader({ countyName, countyCode }: CountyHeaderProps) {
  return (
    <PageHeader
      title={countyName}
      meta={
        <>
        <div>Län</div>
        <div>
          <span className="font-medium text-app-text-subtle">Kod:</span>{" "}
          {countyCode}
        </div>
        </>
      }
    />
  );
}
import { PageHeader } from "@/src/components/ui/PageHeader";
