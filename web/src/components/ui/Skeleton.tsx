type SkeletonProps = {
  className?: string;
};

type PageSkeletonVariant = "dashboard" | "region" | "company" | "sweden";

export function SkeletonBlock({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "skeleton-pulse rounded-md border border-slate-800 bg-slate-900",
        className,
      ].join(" ")}
    />
  );
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return (
    <div
      className={[
        "skeleton-pulse h-3 rounded-sm bg-slate-800",
        className,
      ].join(" ")}
    />
  );
}

function BackPlaceholder() {
  return <div className="text-sm font-medium text-slate-400">Tillbaka</div>;
}

function HeaderSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  const copy = {
    dashboard: {
      eyebrow: "Daily lead workspace",
      title: "Cintela",
      body: "Hitta matchande företag utifrån din profil och få insikter för att maximera sälj.",
    },
    sweden: {
      eyebrow: "Nationell marknadsöversikt",
      title: "Överblick",
      body: "Samlad bild av företagsbasen, regional koncentration och prospekteringsunderlaget.",
    },
    region: {
      eyebrow: "Regional översikt",
      title: "Geografisk översikt",
      body: "Regional företagsstatistik, företagsmix och geografisk fördelning laddas.",
    },
    company: {
      eyebrow: "Företagsprofil",
      title: "Företag laddas",
      body: "Företagsdata, signaler och historik hämtas.",
    },
  }[variant];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {copy.eyebrow}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
        {copy.title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        {copy.body}
      </p>
    </section>
  );
}

function KpiSkeleton({
  labels,
}: {
  labels: string[];
}) {
  return (
    <div
      className={[
        "grid gap-3",
        labels.length >= 6
          ? "grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
          : "grid-cols-2 md:grid-cols-5",
      ].join(" ")}
    >
      {labels.map((label) => (
        <div
          key={label}
          className="rounded-md border border-slate-800 bg-slate-900 p-4"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <SkeletonLine className="mt-3 h-6 w-20" />
          <SkeletonLine className="mt-2 w-24" />
        </div>
      ))}
    </div>
  );
}

function MetricSectionSkeleton({
  title,
  eyebrow,
}: {
  title: string;
  eyebrow?: string;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-base font-semibold text-slate-100">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-slate-800 bg-slate-950/50 p-3"
          >
            <SkeletonLine className="w-20" />
            <SkeletonLine className="mt-3 h-5 w-24" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BarListSkeleton({ title }: { title: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <div className="mt-4 space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between gap-4">
              <SkeletonLine className="w-48 max-w-[70%]" />
              <SkeletonLine className="w-16" />
            </div>
            <SkeletonLine className="h-2 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BusinessMixSkeleton({ sweden = false }: { sweden?: boolean }) {
  const titles = sweden
    ? [
        "Företag per län",
        "Största kommuner",
        "Företag per branschgrupp",
        "Företag per avdelning",
        "Företag per omsättningsklass",
        "Företag per storleksklass",
      ]
    : [
        "Företag per kommun",
        "Företag per A-region",
        "Företag per branschgrupp",
        "Företag per storleksklass",
      ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Företagsmix
        </p>
        <h2 className="text-lg font-semibold text-slate-100">
          {sweden ? "Sverige som marknad" : "Geografisk fördelning"}
        </h2>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        {titles.map((title) => (
          <BarListSkeleton key={title} title={title} />
        ))}
      </div>
    </section>
  );
}

export function RegionDataSkeleton() {
  return (
    <>
      <KpiSkeleton
        labels={["Företag", "Aktiva", "Arbetsgivare", "Kommuner", "A-regioner"]}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <MetricSectionSkeleton
          title="Regional Sales Summary"
          eyebrow="MVP-insikt"
        />
        <MetricSectionSkeleton title="Market Signals" />
      </div>
      <BusinessMixSkeleton />
    </>
  );
}

export function SwedenDataSkeleton() {
  return (
    <>
      <KpiSkeleton
        labels={[
          "Företag",
          "Verksamma",
          "Arbetsgivare",
          "Moms + F-skatt",
          "Kommuner",
          "Branschgrupper",
        ]}
      />
      <BusinessMixSkeleton sweden />
    </>
  );
}

function CompanySkeletonBody() {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <MetricSectionSkeleton title="AI Business Summary" eyebrow="Blueprint" />
        <MetricSectionSkeleton title="Lead & Match Scoring" />
        <MetricSectionSkeleton title="AI Recommendations" />
        <MetricSectionSkeleton title="Business Signals" />
        <MetricSectionSkeleton title="Företagsinformation" />
        <MetricSectionSkeleton title="Ekonomi" />
      </div>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-base font-semibold text-slate-100">Rå payload</h2>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonLine key={index} />
          ))}
        </div>
      </section>
    </>
  );
}

export function PageSkeleton({
  variant = "region",
}: {
  variant?: PageSkeletonVariant;
}) {
  const kpiLabels =
    variant === "sweden"
      ? ["Företag", "Verksamma", "Arbetsgivare", "Moms + F-skatt", "Kommuner", "Branschgrupper"]
      : variant === "region"
        ? ["Företag", "Aktiva", "Arbetsgivare", "Kommuner", "A-regioner"]
        : ["Matchande företag", "Rekommenderade leads", "Nya bolag", "Högpotential"];

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BackPlaceholder />
        <HeaderSkeleton variant={variant} />

        {variant !== "company" && variant !== "region" && variant !== "sweden" ? (
          <KpiSkeleton labels={kpiLabels} />
        ) : null}

        {variant === "dashboard" ? (
          <>
            <section className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Prospektering
                </p>
                <h2 className="text-lg font-semibold text-slate-100">
                  Search & Filters
                </h2>
              </div>
              <SkeletonBlock className="h-32" />
            </section>
            <SkeletonList />
          </>
        ) : null}

        {variant === "sweden" ? <SwedenDataSkeleton /> : null}

        {variant === "region" ? (
          <RegionDataSkeleton />
        ) : null}

        {variant === "company" ? <CompanySkeletonBody /> : null}
      </div>
    </main>
  );
}

export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Lead Cards
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-100">
          Alla träffar
        </h2>
      </div>
      <div className="divide-y divide-slate-800">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-5">
            <div className="flex items-start gap-4">
              <div className="text-xs tabular-nums text-slate-600">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonLine className="h-5 w-56 max-w-full" />
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
