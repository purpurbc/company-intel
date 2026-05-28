"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href?: string;
  badge?: string;
  icon: string;
  rail?: boolean;
};

const profileItem: NavItem = {
  label: "Vium Företagen AB",
  href: "/profile",
  icon: "VF",
  rail: true,
};

const primaryItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "H", rail: true },
  { label: "Överblick", href: "/sweden", icon: "S", rail: true },
  { label: "Karta", href: "/map", icon: "K", rail: true },
  { label: "Alla län", href: "/counties", icon: "L" },
  { label: "Alla kommuner", href: "/municipalities", icon: "M" },
];

const futureItems: NavItem[] = [
  { label: "Sparade segment", badge: "Senare", icon: "SG" },
  { label: "Opportunity Feed", badge: "Senare", icon: "OF" },
  { label: "Kundbas", badge: "Senare", icon: "KB" },
  { label: "Lead Lists", badge: "Senare", icon: "LL" },
];

const railItems: NavItem[] = [
  profileItem,
  ...primaryItems.filter((item) => item.rail),
];

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ item, active = false }: { item: NavItem; active?: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition",
        active
          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
          : "border-slate-800 bg-slate-900 text-slate-400",
      ].join(" ")}
    >
      {item.icon}
    </span>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const darkLogoSrc = compact
    ? "/icons/logo/cintela_logo_wht.svg"
    : "/icons/logo/cintela_wide_text_logo_wht_color.svg";
  const lightLogoSrc = compact
    ? "/icons/logo/cintela_logo_blk.svg"
    : "/icons/logo/cintela_wide_text_logo_blk_color.svg";

  return (
    <span
      className={[
        "relative inline-flex items-center justify-center",
        compact ? "h-10 w-10" : "h-6 w-32",
      ].join(" ")}
    >
      <Image
        src={darkLogoSrc}
        alt="Cintela"
        width={compact ? 24 : 128}
        height={24}
        priority
        unoptimized
        className={[
          "theme-logo-dark absolute object-contain",
          compact ? "w-6" : "w-32",
          compact ? "h-6" : "h-6",
        ].join(" ")}
      />
      <Image
        src={lightLogoSrc}
        alt="Cintela"
        width={compact ? 24 : 128}
        height={24}
        priority
        unoptimized
        className={[
          "theme-logo-light absolute object-contain",
          compact ? "w-6" : "w-32",
          compact ? "h-6" : "h-6",
        ].join(" ")}
      />

    </span>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <NavIcon item={item} active={active} />
        <span className="min-w-0 truncate">{item.label}</span>
      </span>
      {item.badge ? (
        <span className="rounded-sm border border-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const className = [
    "flex h-10 min-w-0 items-center justify-between gap-2 rounded-md py-0 pl-0 pr-3 text-sm transition",
    active
      ? "bg-slate-900 text-slate-50"
      : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
  ].join(" ");

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

function RailLink({ item, pathname }: { item: NavItem; pathname: string }) {
  if (!item.href) return null;

  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      title={item.label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-slate-900"
    >
      <NavIcon item={item} active={active} />
    </Link>
  );
}

function SidebarRail({
  pathname,
  onOpen,
}: {
  pathname: string;
  onOpen: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 border-r border-slate-800 bg-slate-950 px-2 py-3 md:block">
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Öppna sidomeny"
          title="Öppna sidomeny"
          className="group relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
        >
          <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
            <BrandLogo compact />
          </span>
          <span className="absolute opacity-0 transition-opacity group-hover:opacity-100">
            {">"}
          </span>
        </button>

        <nav
          className="mt-4 flex flex-col gap-2"
          aria-label="Snabbmeny"
        >
          {railItems.map((item) => (
            <RailLink key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function AppSidebar({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) {
    return <SidebarRail pathname={pathname} onOpen={onOpen} />;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Stäng sidomeny"
        className="fixed inset-0 z-40 bg-slate-950/70 md:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-800 bg-slate-950 px-2 py-3 shadow-2xl md:w-64 md:max-w-none md:shadow-none">
        <div className="flex h-full flex-col">
          <div className="flex h-10 items-center gap-2">
            <Link
              href="/"
              aria-label="Cintela dashboard"
              title="Cintela"
              className="flex h-10 min-w-0 flex-1 items-center rounded-md px-2 text-slate-100 transition hover:bg-slate-900"
            >
              <BrandLogo />
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng sidomeny"
              title="Stäng sidomeny"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-sm text-slate-300 hover:bg-slate-800"
            >
              {"<"}
            </button>
          </div>

          <nav className="mt-4 flex flex-col gap-2" aria-label="Huvudmeny">
            <SidebarLink item={profileItem} pathname={pathname} />
            {primaryItems.map((item) => (
              <SidebarLink key={item.label} item={item} pathname={pathname} />
            ))}
          </nav>

          <div className="mt-6">
            <div className="px-3 text-xs font-medium uppercase tracking-wide text-slate-600">
              Kommande
            </div>
            <nav className="mt-2 flex flex-col gap-2" aria-label="Kommande vyer">
              {futureItems.map((item) => (
                <SidebarLink key={item.label} item={item} pathname={pathname} />
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
