import Link from "next/link";

type NavItem = {
  label: string;
  href?: string;
  badge?: string;
};

const primaryItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Alla län", href: "/counties" },
  { label: "Alla kommuner", href: "/municipalities" },
];

const futureItems: NavItem[] = [
  { label: "Sparade segment", badge: "Senare" },
  { label: "Opportunity Feed", badge: "Senare" },
  { label: "ICP Setup", badge: "Senare" },
  { label: "Lead Lists", badge: "Senare" },
];

function SidebarLink({ item }: { item: NavItem }) {
  const content = (
    <>
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-sm border border-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const className =
    "flex min-w-0 items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-slate-50";

  if (!item.href) {
    return (
      <div className={`${className} cursor-not-allowed opacity-60`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function AppSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Stäng sidomeny"
        className="fixed inset-0 z-40 bg-slate-950/70 md:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-800 bg-slate-950 px-3 py-3 shadow-2xl md:w-64 md:max-w-none md:shadow-none">
        <div className="flex h-full flex-col">
          <div className="flex h-11 items-center gap-2">
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 text-slate-100 hover:bg-slate-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-950">
                VF
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  Vium Företagen
                </span>
                <span className="block truncate text-xs text-slate-500">
                  Lead workspace
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng sidomeny"
              title="Stäng sidomeny"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-sm text-slate-300 hover:bg-slate-800"
            >
              {"<"}
            </button>
          </div>

          <nav className="mt-4 space-y-1" aria-label="Huvudmeny">
            {primaryItems.map((item) => (
              <SidebarLink key={item.label} item={item} />
            ))}
          </nav>

          <div className="mt-6">
            <div className="px-3 text-xs font-medium uppercase tracking-wide text-slate-600">
              Kommande
            </div>
            <nav className="mt-2 space-y-1" aria-label="Kommande vyer">
              {futureItems.map((item) => (
                <SidebarLink key={item.label} item={item} />
              ))}
            </nav>
          </div>

          <div className="mt-auto rounded-md border border-slate-800 bg-slate-900/60 p-3">
            <div className="text-xs font-medium text-slate-300">MVP focus</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Stabil sök, tydliga företagssidor och regionala vyer först.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
