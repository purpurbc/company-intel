type Item = {
  code: string;
  name: string;
  count: number;
};

type HorizontalBarListProps = {
  title: string;
  items: Item[];
  maxItems?: number;
};

export function HorizontalBarList({
  title,
  items,
  maxItems = 10,
}: HorizontalBarListProps) {
  const sorted = [...items].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, maxItems);
  const total = sorted.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>

      <div className="mt-4 space-y-3">
        {top.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;

          return (
            <div key={`${item.code}-${item.name}`} className="space-y-1">
              <div className="flex justify-between gap-4 text-sm">
                <span className="truncate text-slate-300">
                  {item.code} {item.name}
                </span>
                <span className="shrink-0 text-slate-500">
                  {item.count.toLocaleString("sv-SE")} | {pct.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 rounded-sm bg-slate-800">
                <div
                  className="h-2 rounded-sm bg-emerald-400/80"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
