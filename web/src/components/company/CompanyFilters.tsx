type CompanyFiltersProps = {
  countyCode: string;
  onCountyCodeChange: (value: string) => void;
  municipalityCode: string;
  onMunicipalityCodeChange: (value: string) => void;
};

export function CompanyFilters({
  countyCode,
  onCountyCodeChange,
  municipalityCode,
  onMunicipalityCodeChange,
}: CompanyFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Länskod</label>
        <input
          value={countyCode}
          onChange={(e) => onCountyCodeChange(e.target.value)}
          placeholder="t.ex. 18"
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-gray-600">Kommunkod</label>
        <input
          value={municipalityCode}
          onChange={(e) => onMunicipalityCodeChange(e.target.value)}
          placeholder="t.ex. 1880"
          className="border rounded px-3 py-2 w-full"
        />
      </div>
    </div>
  );
}