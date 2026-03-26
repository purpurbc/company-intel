type Item = {
  code: string,
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
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>

      <div className="space-y-2">
        {top.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0;

          return (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{item.code} {item.name}</span>
                <span className="text-gray-600">
                  {item.count.toLocaleString("sv-SE")} · {pct.toFixed(1)}%
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded">
                <div
                  className="h-2 bg-black/70 rounded"
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