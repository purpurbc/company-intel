import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

type PageSkeletonVariant = "dashboard" | "region" | "company" | "sweden";

export function SkeletonBlock({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={[
        "skeleton-pulse rounded-sm border border-app-border bg-app-panel",
        className,
      ].join(" ")}
      style={style}
    />
  );
}

export function SkeletonLine({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={[
        "skeleton-pulse h-2.5 rounded-sm bg-app-panel-muted",
        className,
      ].join(" ")}
      style={style}
    />
  );
}

function HeaderSkeleton() {
  return (
    <header className="border-b border-app-border pb-5">
      <SkeletonLine className="h-6 w-56 max-w-[72%]" />
      <div className="mt-3 space-y-2">
        <SkeletonLine className="w-32" />
        <SkeletonLine className="w-full max-w-xl" />
      </div>
    </header>
  );
}

function TabSkeleton() {
  return (
    <div className="flex gap-1 overflow-hidden border-b border-app-border">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="px-3 py-2">
          <SkeletonLine className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function DataRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-app-border/70">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
        >
          <SkeletonLine className="w-20" />
          <SkeletonLine
            className={[
              index % 3 === 0
                ? "w-full"
                : index % 3 === 1
                  ? "w-3/4"
                  : "w-1/2",
            ].join(" ")}
          />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton({
  rows = 6,
  children,
  className = "",
}: {
  rows?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-sm border border-app-border bg-app-panel p-3.5 sm:p-3",
        className,
      ].join(" ")}
    >
      <SkeletonLine className="h-3.5 w-28" />
      <div className="mt-3">
        {children ?? <DataRowsSkeleton rows={rows} />}
      </div>
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div className="border border-app-border bg-app-panel-muted p-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="w-32" />
        <SkeletonLine className="h-7 w-20" />
      </div>
      <div className="mt-5 grid grid-cols-[4.75rem_minmax(0,1fr)]">
        <div className="relative h-40 border-b border-app-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLine
              key={index}
              className="absolute right-3 h-2 w-12"
              style={{ bottom: `${18 + index * 22}%` } as React.CSSProperties}
            />
          ))}
        </div>
        <div className="relative h-40 overflow-hidden border-b border-app-border">
          <div className="absolute inset-x-0 bottom-0 top-4 flex items-end justify-center gap-8 px-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="skeleton-pulse w-9 border border-app-border-strong bg-app-panel"
                style={{ height: `${24 + ((index * 17) % 62)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-8 px-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonLine key={index} className="w-10" />
        ))}
      </div>
    </div>
  );
}

function CompanySkeletonBody() {
  return (
    <div className="space-y-3">
      <TabSkeleton />
      <div className="grid gap-3 xl:grid-cols-2">
        <SectionSkeleton rows={8} />
        <SectionSkeleton rows={6} />
      </div>
      <SectionSkeleton rows={6}>
        <div className="space-y-3">
          <ChartSkeleton />
          <DataRowsSkeleton rows={6} />
        </div>
      </SectionSkeleton>
      <SectionSkeleton rows={6} />
    </div>
  );
}

function RegionSkeletonBody({ sweden = false }: { sweden?: boolean }) {
  return (
    <div className="space-y-5">
      <div
        className={[
          "grid gap-3",
          sweden
            ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            : "grid-cols-2 md:grid-cols-5",
        ].join(" ")}
      >
        {Array.from({ length: sweden ? 6 : 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-20" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: sweden ? 6 : 4 }).map((_, index) => (
          <SectionSkeleton key={index} rows={6} />
        ))}
      </div>
    </div>
  );
}

export function RegionDataSkeleton() {
  return <RegionSkeletonBody />;
}

export function SwedenDataSkeleton() {
  return <RegionSkeletonBody sweden />;
}

function DashboardSkeletonBody() {
  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-3xl pt-[20vh]">
        <SkeletonLine className="mx-auto h-5 w-44" />
        <SkeletonBlock className="mx-auto mt-5 h-12 w-full" />
      </div>
      <SkeletonList />
    </div>
  );
}

export function PageSkeleton({
  variant = "region",
}: {
  variant?: PageSkeletonVariant;
}) {
  return (
    <main className="min-h-screen bg-app-bg px-5 py-4 text-app-text sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {variant !== "dashboard" ? <HeaderSkeleton /> : null}
        {variant === "company" ? <CompanySkeletonBody /> : null}
        {variant === "region" ? <RegionSkeletonBody /> : null}
        {variant === "sweden" ? <RegionSkeletonBody sweden /> : null}
        {variant === "dashboard" ? <DashboardSkeletonBody /> : null}
      </div>
    </main>
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <section className="rounded-sm border border-app-border bg-app-panel">
      <div className="border-b border-app-border p-4">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="mt-2 w-56 max-w-full" />
      </div>
      <div className="divide-y divide-app-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-5 w-5 shrink-0 border-0" />
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonLine className="h-4 w-56 max-w-full" />
                <SkeletonLine className="w-full max-w-2xl" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <SkeletonLine />
                  <SkeletonLine />
                  <SkeletonLine />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
