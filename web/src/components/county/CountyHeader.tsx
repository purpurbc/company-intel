type CountyHeaderProps = {
  countyName: string;
  countyCode: string;
};

export function CountyHeader({ countyName, countyCode }: CountyHeaderProps) {
  return (
    <header className="border-b border-app-border pb-5">
      <h1 className="text-2xl font-semibold text-app-text">{countyName}</h1>
      <div className="mt-2 space-y-0.5 text-sm leading-5 text-app-text-muted">
        <div>Län</div>
        <div>
          <span className="font-medium text-app-text-subtle">Kod:</span>{" "}
          {countyCode}
        </div>
      </div>
    </header>
  );
}
