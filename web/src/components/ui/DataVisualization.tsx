"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { AnimatedContent } from "@/src/components/ui/AnimatedContent";
import { DropdownMenu } from "@/src/components/ui/DropdownMenu";
import { ActionControl } from "@/src/components/ui/Button";
import { chartPath } from "@/src/components/ui/chartPath";
import { ChartTooltip } from "@/src/components/ui/ChartTooltip";
import {
  DataTable,
  DataTableColumnDividerToggle,
  type ColumnDividerMode,
  type DataTableProps,
  type DataTableRow,
} from "@/src/components/ui/DataTable";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ToggleButton } from "@/src/components/ui/ToggleButton";

export type DataChartMode = "line" | "spline" | "bar";
export type DataChartValueFormat = "number" | "signed" | "percent";

const chartModeLabels: Record<DataChartMode, string> = {
  line: "Raka linjer",
  spline: "Spline",
  bar: "Staplar",
};

export type DataChartSeries = {
  key: string;
  label: string;
  axis?: "primary" | "secondary";
  format?: DataChartValueFormat;
};

export type DataChartConfig = {
  xKey: string;
  xOptions?: readonly {
    key: string;
    label: string;
    groupKey?: string;
    categorical?: boolean;
  }[];
  groupKey?: string;
  series: readonly DataChartSeries[];
  modes?: readonly DataChartMode[];
  defaultMode?: DataChartMode;
  defaultVisibleKeys?: readonly string[];
};

type DataVisualizationProps = Omit<
  DataTableProps,
  | "showColumnDividersToggle"
  | "defaultShowColumnDividers"
  | "columnDividerMode"
  | "onColumnDividerModeChange"
> & {
  chart: DataChartConfig;
};

type ResolvedSeries = DataChartSeries & {
  id: string;
  groupValue?: string | number;
  color: string;
};

type ChartDatum = {
  x: string | number;
  label: string;
  values: Record<string, number | null>;
};

type ChartScale = {
  ticks: number[];
  baseline: number;
  position: (value: number) => number;
};

const chartColors = Array.from(
  { length: 12 },
  (_, index) => `var(--app-chart-${index + 1})`,
);

const compactNumber = new Intl.NumberFormat("sv-SE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function rawValue(row: DataTableRow, key: string) {
  const value = row.sortValues?.[key];
  if (typeof value === "string" || typeof value === "number") return value;

  const cell = row.cells[key];
  return typeof cell === "string" || typeof cell === "number" ? cell : null;
}

function valueId(value: string | number) {
  return `${typeof value}:${value}`;
}

function compareValues(left: string | number, right: string | number) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "sv-SE", { numeric: true });
}

function formatValue(value: number, format: DataChartValueFormat = "number") {
  if (format === "percent") {
    return `${(value * 100).toLocaleString("sv-SE", { maximumFractionDigits: 1 })}%`;
  }
  if (format === "signed" && value > 0) {
    return `+${value.toLocaleString("sv-SE")}`;
  }
  return value.toLocaleString("sv-SE");
}

function formatTick(value: number, format: DataChartValueFormat = "number") {
  if (format === "percent") return `${Math.round(value * 100)}%`;
  return compactNumber.format(value);
}

function niceStep(range: number, tickCount: number) {
  const roughStep = range / Math.max(1, tickCount - 1);
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const fraction = roughStep / power;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * power;
}

function createScale(values: number[], top: number, bottom: number, isFitted: boolean): ChartScale {
  const observations = values.length ? values : [0];
  let minimum = Math.min(...observations, ...(isFitted ? [] : [0]));
  let maximum = Math.max(...observations, ...(isFitted ? [] : [0]));
  if (minimum === maximum) {
    const padding = Math.max(Math.abs(minimum) * 0.01, 1);
    minimum -= isFitted ? padding : 0;
    maximum += padding;
  }

  const step = niceStep(maximum - minimum, 5);
  if (!isFitted) {
    minimum = Math.floor(minimum / step) * step;
    maximum = Math.ceil(maximum / step) * step;
  }
  const span = maximum - minimum || 1;
  const ticks = isFitted ? Array.from({ length: 5 }, (_, index) => minimum + span * index / 4) : Array.from(
    { length: Math.round(span / step) + 1 },
    (_, index) => minimum + index * step,
  );

  return {
    ticks,
    baseline: Math.min(maximum, Math.max(minimum, 0)),
    position: (value) => bottom - ((value - minimum) / span) * (bottom - top),
  };
}

function resolveChartData(
  rows: readonly DataTableRow[],
  config: DataChartConfig,
) {
  const groups = config.groupKey
    ? Array.from(
        new Map(
          rows.flatMap((row) => {
            const value = rawValue(row, config.groupKey!);
            if (value === null) return [];
            const cell = row.cells[config.groupKey!];
            const label =
              typeof cell === "string" || typeof cell === "number"
                ? String(cell)
                : String(value);
            return [[valueId(value), { value, label }] as const];
          }),
        ).values(),
      ).sort((left, right) => compareValues(left.value, right.value))
    : [];

  const series: ResolvedSeries[] = config.series.flatMap((item) =>
    groups.length > 0
      ? groups.map((group) => ({
          ...item,
          id: `${item.key}:${valueId(group.value)}`,
          label: `${item.label} · ${group.label}`,
          groupValue: group.value,
          color: "",
        }))
      : [{ ...item, id: item.key, color: "" }],
  ).map((item, index) => ({
    ...item,
    color: chartColors[index % chartColors.length],
  }));

  const xValues = Array.from(
    new Map(
      rows.flatMap((row) => {
        const value = rawValue(row, config.xKey);
        return value === null ? [] : [[valueId(value), value] as const];
      }),
    ).values(),
  ).sort(compareValues);

  const data: ChartDatum[] = xValues.map((x) => {
    const matchingRow = rows.find((row) => rawValue(row, config.xKey) === x);
    const xCell = matchingRow?.cells[config.xKey];
    const label =
      typeof xCell === "string" || typeof xCell === "number"
        ? String(xCell)
        : String(x);

    return {
      x,
      label,
      values: Object.fromEntries(
        series.map((item) => {
          const row = rows.find(
            (candidate) =>
              rawValue(candidate, config.xKey) === x &&
              (item.groupValue === undefined ||
                rawValue(candidate, config.groupKey!) === item.groupValue),
          );
          const value = row ? rawValue(row, item.key) : null;
          return [item.id, typeof value === "number" ? value : null];
        }),
      ),
    };
  });

  return { data, series };
}

function LineMarks({
  data,
  series,
  xPosition,
  scales,
  smooth,
}: {
  data: ChartDatum[];
  series: ResolvedSeries[];
  xPosition: (index: number) => number;
  scales: Record<"primary" | "secondary", ChartScale>;
  smooth: boolean;
}) {
  return series.map((item) => {
    const scale = scales[item.axis ?? "primary"];
    const path = chartPath(data.map((datum, index) => {
      const value = datum.values[item.id];
      return value === null ? null : { x: xPosition(index), y: scale.position(value) };
    }), smooth);

    return (
      <g key={item.id}>
        <path
          d={path}
          fill="none"
          stroke={item.color}
          strokeWidth="var(--app-chart-line-width)"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((datum, index) => {
          const value = datum.values[item.id];
          return value === null ? null : (
            <circle
              key={`${item.id}-${valueId(datum.x)}`}
              cx={xPosition(index)}
              cy={scale.position(value)}
              r="2.75"
              fill={item.color}
              stroke="var(--app-panel)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              tabIndex={0}
              aria-label={`${datum.label} · ${item.label}: ${formatValue(value, item.format)}`}
              data-chart-info={`${datum.label} · ${item.label}: ${formatValue(value, item.format)}`}
              data-chart-color={item.color}
            >
            </circle>
          );
        })}
      </g>
    );
  });
}

function BarMarks({
  data,
  series,
  xPosition,
  xStep,
  scales,
}: {
  data: ChartDatum[];
  series: ResolvedSeries[];
  xPosition: (index: number) => number;
  xStep: number;
  scales: Record<"primary" | "secondary", ChartScale>;
}) {
  const groupWidth = Math.min(xStep * 0.72, Math.max(52, series.length * 14));
  const slotWidth = groupWidth / Math.max(series.length, 1);
  const barWidth = slotWidth * 0.88;

  return data.flatMap((datum, dataIndex) =>
    series.map((item, seriesIndex) => {
      const value = datum.values[item.id];
      if (value === null) return null;
      const scale = scales[item.axis ?? "primary"];
      const zeroY = scale.position(scale.baseline);
      const valueY = scale.position(value);
      const x =
        xPosition(dataIndex) - groupWidth / 2 + seriesIndex * (groupWidth / series.length);

      return (
        <rect
          key={`${item.id}-${valueId(datum.x)}`}
          x={x}
          y={Math.min(zeroY, valueY) - (zeroY === valueY ? 1 : 0)}
          width={barWidth}
          height={Math.max(1, Math.abs(zeroY - valueY))}
          rx="1.5"
          fill={item.color}
          tabIndex={0}
          aria-label={`${datum.label} · ${item.label}: ${formatValue(value, item.format)}`}
          data-chart-info={`${datum.label} · ${item.label}: ${formatValue(value, item.format)}`}
          data-chart-color={item.color}
        >
        </rect>
      );
    }),
  );
}

function Chart({
  caption,
  data,
  series,
  mode,
  isFitted,
}: {
  caption: string;
  data: ChartDatum[];
  series: ResolvedSeries[];
  mode: DataChartMode;
  isFitted: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-w-0 w-full">
      {width > 0 ? (
        <ChartPlot caption={caption} data={data} series={series} mode={mode} width={width} isFitted={isFitted} />
      ) : <div className="h-72" />}
    </div>
  );
}

function ChartPlot({ caption, data, series, mode, width, isFitted }: {
  caption: string;
  data: ChartDatum[];
  series: ResolvedSeries[];
  mode: DataChartMode;
  width: number;
  isFitted: boolean;
}) {
  const plotId = useId();
  if (series.length === 0) {
    return (
      <p className="flex min-h-64 items-center justify-center text-xs text-app-text-muted">
        Välj minst en serie för att visa diagrammet.
      </p>
    );
  }

  if (!data.length) return <p className="py-2 text-xs text-app-text-muted">Ingen data finns i underlaget.</p>;
  const height = 288;
  const left = isFitted ? 88 : 56;
  const right = series.some((item) => item.axis === "secondary") ? (isFitted ? 76 : 56) : 12;
  const top = 14;
  const bottom = 48;
  const plotRight = width - right;
  const plotBottom = height - bottom;
  const plotWidth = Math.max(1, plotRight - left);
  const xStep = plotWidth / Math.max(1, mode === "bar" ? data.length : data.length - 1);
  const xPosition = (index: number) =>
    mode === "bar" ? left + xStep * (index + 0.5)
      : data.length > 1 ? left + xStep * index : (left + plotRight) / 2;
  const axisValues = (axis: "primary" | "secondary") =>
    series
      .filter((item) => (item.axis ?? "primary") === axis)
      .flatMap((item) => data.flatMap((datum) => datum.values[item.id] ?? []));
  const primaryValues = axisValues("primary");
  const secondaryValues = axisValues("secondary");
  const scales = {
    primary: createScale(primaryValues, top, plotBottom, isFitted),
    secondary: createScale(secondaryValues, top, plotBottom, isFitted),
  };
  const primaryFormat = series.find((item) => (item.axis ?? "primary") === "primary")?.format;
  const secondaryFormat = series.find((item) => item.axis === "secondary")?.format;
  const labelWidth = Math.max(42, ...data.map((datum) => datum.label.length * 7 + 12));
  const labelCount = mode === "bar" && data.length <= 2
    ? data.length
    : Math.min(data.length, Math.max(1, Math.floor(plotWidth / labelWidth)));
  const labelIndices = new Set(Array.from({ length: labelCount }, (_, index) =>
    labelCount === 1 ? data.length - 1 : Math.round(index * (data.length - 1) / (labelCount - 1)),
  ));

  return (
    <ChartTooltip key={`${width}-${isFitted}-${mode}-${data[0]?.x}-${series.map((item) => item.id).join(",")}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={caption}
        className="block h-72 w-full"
        style={{ fontSize: "var(--app-chart-font-size)" }}
      >
        <defs>
          <clipPath id={plotId}>
            <rect x={left - 4} y={top - 4} width={plotWidth + 8} height={plotBottom - top + 8} />
          </clipPath>
        </defs>
        {scales.primary.ticks.map((tick) => {
          const y = scales.primary.position(tick);
          return (
            <g key={`primary-${tick}`}>
              <line
                x1={left}
                x2={plotRight}
                y1={y}
                y2={y}
                stroke="var(--app-border)"
                strokeOpacity="0.65"
                strokeWidth="var(--app-chart-grid-width)"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={left - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="var(--app-text-subtle)"
                fontSize="inherit"
              >
                {isFitted ? formatValue(Number(tick.toFixed(1)), primaryFormat) : formatTick(tick, primaryFormat)}
              </text>
            </g>
          );
        })}
        {secondaryValues.length > 0
          ? scales.secondary.ticks.map((tick) => (
              <text
                key={`secondary-${tick}`}
                x={plotRight + 8}
                y={scales.secondary.position(tick) + 3.5}
                fill="var(--app-text-subtle)"
                fontSize="inherit"
              >
                {isFitted ? formatValue(Number(tick.toFixed(3)), secondaryFormat) : formatTick(tick, secondaryFormat)}
              </text>
            ))
          : null}

        <g clipPath={`url(#${plotId})`}>
        {mode !== "bar" ? (
          <LineMarks
            data={data}
            series={series}
            xPosition={xPosition}
            scales={scales}
            smooth={mode === "spline"}
          />
        ) : (
          <BarMarks
            data={data}
            series={series}
            xPosition={xPosition}
            xStep={data.length > 1 ? xStep : plotRight - left}
            scales={scales}
          />
        )}
        </g>

        {data.map((datum, index) =>
          labelIndices.has(index) ? (
            <text
              key={valueId(datum.x)}
              x={xPosition(index)}
              y={plotBottom + 24}
              textAnchor={mode === "bar" ? "middle" : index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"}
              fill="var(--app-text-subtle)"
              fontSize="inherit"
            >
              {datum.label}
            </text>
          ) : null,
        )}
      </svg>
    </ChartTooltip>
  );
}

/** Shared table/chart view for comparable numeric data. */
export function DataVisualization({
  chart,
  columns,
  rows,
  caption,
  emptyText,
  sortable,
}: DataVisualizationProps) {
  const [view, setView] = useState<"table" | "chart">("table");
  const [mode, setMode] = useState<DataChartMode>(chart.defaultMode ?? "line");
  const [xKey, setXKey] = useState(chart.xKey);
  const [isReversed, setIsReversed] = useState(false);
  const [isFitted, setIsFitted] = useState(false);
  const xOption = chart.xOptions?.find((option) => option.key === xKey);
  const isCategorical = Boolean(xOption?.categorical);
  const activeMode = isCategorical ? "bar" : mode;
  const [columnDividerMode, setColumnDividerMode] =
    useState<ColumnDividerMode>("hidden");
  const resolved = useMemo(
    () => resolveChartData(rows, {
      ...chart,
      xKey,
      groupKey: xOption ? xOption.groupKey : chart.groupKey,
    }),
    [chart, rows, xKey, xOption],
  );
  const [seriesSelections, setSeriesSelections] = useState<Record<string, boolean>>({});
  function isSeriesVisible(item: ResolvedSeries) {
    return seriesSelections[`${xKey}:${item.id}`] ??
      (!chart.defaultVisibleKeys || chart.defaultVisibleKeys.includes(item.key));
  }
  const visibleSeries = resolved.series.filter(isSeriesVisible);
  const displayedData = isReversed ? [...resolved.data].reverse() : resolved.data;

  function toggleSeries(item: ResolvedSeries) {
    setSeriesSelections((current) => ({
      ...current,
      [`${xKey}:${item.id}`]: !isSeriesVisible(item),
    }));
  }

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-end gap-1.5">
        {view === "chart" ? (
          <>
            <ActionControl
              label="Anpassa Y-skalan till synliga serier"
              variant="ghost"
              size="sm"
              pressed={isFitted}
              disabled={!visibleSeries.length}
              onClick={() => setIsFitted(true)}
              icon={<MaskedIcon src="/icons/utility/fit.svg" className="h-4 w-4" />}
            >
              Anpassa
            </ActionControl>
            {chart.xOptions ? (
              <DropdownMenu
                label="X-axel"
                triggerText={`X: ${xOption?.label ?? xKey}`}
                triggerVariant="ghost"
                icon={<MaskedIcon src="/icons/utility/chart_bar.svg" className="h-4 w-4" />}
                items={chart.xOptions.map((option) => ({
                  key: option.key,
                  label: option.label,
                  active: xKey === option.key,
                  onSelect: () => setXKey(option.key),
                }))}
              />
            ) : null}
            <ActionControl
              label={isReversed ? "X-axel: fallande. Byt till stigande" : "X-axel: stigande. Byt till fallande"}
              variant="ghost"
              pressed={isReversed}
              onClick={() => setIsReversed((current) => !current)}
              icon={<MaskedIcon src="/icons/utility/arrow_right.svg" className={`h-4 w-4 ${isReversed ? "rotate-180" : ""}`} />}
            />
            <DropdownMenu
              label="Synliga dataserier"
              triggerText="Serier"
              triggerVariant="ghost"
              icon={<MaskedIcon src="/icons/menu/filter.svg" className="h-4 w-4" />}
              items={resolved.series.map((item) => ({
                key: item.id,
                label: item.label,
                active: isSeriesVisible(item),
                selectable: true,
                closeOnSelect: false,
                onSelect: () => toggleSeries(item),
                icon: <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />,
              }))}
            />
            <DropdownMenu
              label="Diagramtyp"
              triggerText={chartModeLabels[activeMode]}
              triggerVariant="ghost"
              icon={<MaskedIcon src={`/icons/utility/chart_${activeMode}.svg`} className="h-4 w-4" />}
              items={(chart.modes ?? ["line", "spline", "bar"]).map((chartMode) => ({
                key: chartMode,
                label: chartModeLabels[chartMode],
                active: activeMode === chartMode,
                disabled: isCategorical && chartMode !== "bar",
                onSelect: () => setMode(chartMode),
                icon: <MaskedIcon src={`/icons/utility/chart_${chartMode}.svg`} className="h-4 w-4 shrink-0" />,
              }))}
            />
          </>
        ) : null}
        {view === "table" ? (
          <DataTableColumnDividerToggle
            value={columnDividerMode}
            onChange={setColumnDividerMode}
          />
        ) : null}
        <ToggleButton<"table" | "chart">
          value={view}
          onChange={setView}
          iconOnly
          ariaLabel="Visningsläge"
          options={[
            {
              value: "table",
              label: "Tabell",
              icon: (
                <MaskedIcon
                  src="/icons/utility/compact_list.svg"
                  className="h-4 w-4"
                />
              ),
            },
            {
              value: "chart",
              label: "Diagram",
              icon: (
                <MaskedIcon
                  src="/icons/utility/chart_line.svg"
                  className="h-4 w-4"
                />
              ),
            },
          ]}
        />
      </div>

      <AnimatedContent key={view}>
        {view === "table" ? (
          <DataTable
            columns={columns}
            rows={rows}
            caption={caption}
            emptyText={emptyText}
            sortable={sortable}
            columnDividerMode={columnDividerMode}
            onColumnDividerModeChange={setColumnDividerMode}
          />
        ) : (
          <div className="relative">
            <Chart
              caption={caption}
              data={displayedData}
              series={visibleSeries}
              mode={activeMode}
              isFitted={isFitted}
            />
            {isFitted ? (
              <div className="absolute bottom-0 left-0">
                <ActionControl
                  label="Återställ Y-skalan"
                  variant="ghost"
                  onClick={() => setIsFitted(false)}
                  icon={<MaskedIcon src="/icons/menu/house-chimney-blank-svgrepo-com.svg" className="h-4 w-4" />}
                />
              </div>
            ) : null}
          </div>
        )}
      </AnimatedContent>
    </div>
  );
}
