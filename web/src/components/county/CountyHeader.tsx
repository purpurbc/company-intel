type CountyHeaderProps = {
  countyName: string;
};

export function CountyHeader({ countyName }: CountyHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Regional marknad
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
        {countyName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Översikt över företagsbas, geografi och möjliga säljinsikter i länet.
      </p>
    </section>
  );
}
