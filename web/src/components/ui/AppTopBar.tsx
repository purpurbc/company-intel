import Link from "next/link";

function TopBarButton({
  label,
  icon,
  disabled = false,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-950"
            aria-label="Company Intel dashboard"
            title="Company Intel"
          >
            CI
          </Link>
          <div className="hidden min-w-0 sm:block">
            <div className="text-sm font-semibold text-slate-100">
              Company Intel
            </div>
            <div className="text-xs text-slate-500">Lead workspace</div>
          </div>
        </div>

        <nav className="flex items-center gap-2" aria-label="Snabbmeny">
          <TopBarButton label="ICP-inställningar" icon="ICP" disabled />
          <TopBarButton label="Byt färgtema" icon="◐" disabled />
          <TopBarButton label="Profil" icon="PR" disabled />
          <TopBarButton label="Logga ut" icon="UT" disabled />
          <TopBarButton label="Meny" icon="☰" disabled />
        </nav>
      </div>
    </header>
  );
}
