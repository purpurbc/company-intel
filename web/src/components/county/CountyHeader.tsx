type CountyHeaderProps = {
  countyName: string;
};

export function CountyHeader({ countyName }: CountyHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">
        {countyName} — Company Overview
      </h1>
      <p className="text-sm text-gray-600">
        Översikt över företag i länet baserat på registrerade bolag.
      </p>
    </div>
  );
}