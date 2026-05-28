import Link from "next/link";

type Field = {
  label: string;
  value: string;
  placeholder?: boolean;
};

type RoadmapItem = {
  title: string;
  description: string;
  status: "MVP" | "Senare";
};

const profileFields: Field[] = [
  { label: "Bolag", value: "Vium Företagen AB" },
  { label: "Org.nr", value: "5594483561" },
  { label: "Hemsida", value: "Lägg till webbplats", placeholder: true },
  { label: "Primärt erbjudande", value: "Beskriv vad ni säljer B2B", placeholder: true },
];

const icpFields: Field[] = [
  { label: "Idealkund", value: "Ex. lokala tjänstebolag med 1-49 anställda", placeholder: true },
  { label: "Geografi", value: "Län, kommuner eller regioner ni prioriterar", placeholder: true },
  { label: "Branscher", value: "SNI/avdelningar som brukar passa", placeholder: true },
  { label: "Dålig match", value: "Bolag ni sällan vill bearbeta", placeholder: true },
];

const customerFields: Field[] = [
  { label: "Bra kunder", value: "Välj befintliga kunder som liknar bra leads", placeholder: true },
  { label: "Varför de passar", value: "Behov, storlek, köpsignal eller timing", placeholder: true },
  { label: "Mindre bra kunder", value: "Markera mönster som ska sänka match score", placeholder: true },
];

const insightBlocks: RoadmapItem[] = [
  {
    title: "Match score",
    description:
      "Regelbaserad matchning mot profil, geografi, bransch, storlek och signaler.",
    status: "MVP",
  },
  {
    title: "AI segment generator",
    description:
      "Föreslår filter och målgrupper utifrån profil och kundexempel.",
    status: "Senare",
  },
  {
    title: "Opportunity feed",
    description:
      "Visar nya företag och förändringar sedan sist för sparade segment.",
    status: "Senare",
  },
  {
    title: "Website enrichment",
    description:
      "Analyserar egna och prospekts webbplatser för behov och möjliga vinklar.",
    status: "Senare",
  },
];

function StatusBadge({ status }: { status: RoadmapItem["status"] }) {
  const className =
    status === "MVP"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : "border-slate-700 bg-slate-900 text-slate-400";

  return (
    <span className={`rounded-sm border px-2 py-1 text-[11px] font-medium uppercase ${className}`}>
      {status}
    </span>
  );
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-md border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {eyebrow}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldGrid({ fields }: { fields: Field[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.label}
          className="rounded-md border border-slate-800 bg-slate-950/45 p-4"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {field.label}
          </div>
          <div
            className={[
              "mt-2 text-sm font-medium",
              field.placeholder ? "text-slate-500" : "text-slate-100",
            ].join(" ")}
          >
            {field.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-md border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Användarprofil
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
                Profil & ICP setup
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Här samlas användarens bolag, erbjudande, målgrupp och kundmönster.
                Den här profilen ska senare göra dashboard, match score och AI-förslag
                personliga för just säljarens verksamhet.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="rounded-md bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-950 opacity-60"
              >
                Spara profil
              </button>
              <Link
                href="/"
                className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Till dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <SectionCard
              eyebrow="Grunddata"
              title="Bolagsprofil"
              description="Basen för hur verktyget förstår användarens egen säljkontext."
            >
              <FieldGrid fields={profileFields} />
            </SectionCard>

            <SectionCard
              id="icp"
              eyebrow="Målgrupp"
              title="Ideal Customer Profile"
              description="Detta bör styra vilka leads som prioriteras, varför de matchar och vilka filter AI kan föreslå."
            >
              <FieldGrid fields={icpFields} />
            </SectionCard>

            <SectionCard
              eyebrow="Kundmönster"
              title="Current customers"
              description="En enkel plats för att senare välja referenskunder och märka vad som gör dem bra eller dåliga."
            >
              <FieldGrid fields={customerFields} />
            </SectionCard>
          </div>

          <aside className="space-y-5">
            <section className="rounded-md border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Profilstatus
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">
                MVP-block
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  ["Bolagsdata", "Delvis"],
                  ["ICP", "Tom"],
                  ["Geografi", "Tom"],
                  ["Kundbas", "Senare"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/45 px-3 py-2"
                  >
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-medium text-slate-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nästa produktvärde
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-50">
                Vad profilen ska driva
              </h2>
              <div className="mt-5 space-y-3">
                {insightBlocks.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-md border border-slate-800 bg-slate-950/45 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-100">
                        {item.title}
                      </h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
