"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClassName } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import type { AppUserProfile } from "@/src/lib/types";

type NavItem = {
  label: string;
  href?: string;
  badge?: string;
  icon: string;
  fallback?: string;
  rail?: boolean;
};

const defaultProfileItem: NavItem = {
  label: "",
  href: "/profile",
  icon: "/icons/menu/image-user-svgrepo-com.svg",
  fallback: "P",
  rail: true,
};

const primaryItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "/icons/menu/house-chimney-blank-svgrepo-com.svg",
    fallback: "H",
    rail: true,
  },
  {
    label: "Sök företag",
    href: "/companies",
    icon: "/icons/menu/user-search-svgrepo-com.svg",
    fallback: "SF",
    rail: true,
  },
  { label: "Överblick", href: "/sweden", icon: "S", rail: true },
  {
    label: "Karta",
    href: "/map",
    icon: "/icons/menu/map-svgrepo-com.svg",
    fallback: "K",
    rail: true,
  },
  { label: "Alla län", href: "/counties", icon: "L" },
  { label: "Alla kommuner", href: "/municipalities", icon: "M" },
];

const futureItems: NavItem[] = [
  { label: "Möjligheter", badge: "Senare", icon: "OF" },
  { label: "Kundbas", badge: "Senare", icon: "KB" },
  { label: "Leads", badge: "Senare", icon: "LL" },
];

const iconByFallback: Record<string, string> = {
  H: "/icons/menu/house-chimney-blank-svgrepo-com.svg",
  SF: "/icons/menu/user-search-svgrepo-com.svg",
  S: "/icons/menu/globe-svgrepo-com.svg",
  K: "/icons/menu/map-svgrepo-com.svg",
  L: "/icons/menu/landmark-svgrepo-com.svg",
  M: "/icons/menu/map-location-pin-svgrepo-com.svg",
  SG: "/icons/menu/user-search-svgrepo-com.svg",
  OF: "/icons/menu/globe-svgrepo-com.svg",
  KB: "/icons/menu/house-turret-svgrepo-com.svg",
  LL: "/icons/menu/user-search-svgrepo-com.svg",
  P: "/icons/menu/image-user-svgrepo-com.svg",
};

function isActive(pathname: string, href?: string) {
  if (!href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function profileDisplayName(userProfile: AppUserProfile | null) {
  return (
    userProfile?.display_name?.trim() ||
    userProfile?.company_name?.trim() ||
    "" // or Profil
  );
}

function profileFallback(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "P";
}

function NavIcon({ item, active = false }: { item: NavItem; active?: boolean }) {
  const fallback = item.fallback ?? item.icon;
  const iconSrc = item.icon.startsWith("/")
    ? item.icon
    : iconByFallback[item.icon];

  return (
    <span
      className={[
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition",
        active
          ? "border-transparent bg-transparent text-app-accent-text"
          : "border-transparent bg-transparent text-app-text-muted",
      ].join(" ")}
    >
      {iconSrc ? (
        <MaskedIcon src={iconSrc} />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
      <span className="sr-only">{fallback}</span>
    </span>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const darkLogoSrc = compact
    ? "/icons/logo/cintela_logo_wht.svg"
    : "/icons/logo/cintela_wide_text_logo_wht.svg";
  const lightLogoSrc = compact
    ? "/icons/logo/cintela_logo_blk.svg"
    : "/icons/logo/cintela_wide_text_logo_blk.svg";

  return (
    <span
      className={[
        "relative inline-flex items-center justify-center",
        compact ? "h-8 w-8" : "h-6 w-32",
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
          compact ? "w-5" : "w-32",
          compact ? "h-5" : "h-6",
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
          compact ? "w-5" : "w-32",
          compact ? "h-5" : "h-6",
        ].join(" ")}
      />

    </span>
  );
}

function SidebarLink({
  item,
  pathname,
  compact = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
}) {
  const active = isActive(pathname, item.href);
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex w-10 shrink-0 justify-center">
          <NavIcon item={item} active={active} />
        </span>
        <span
          className={[
            "min-w-0 truncate whitespace-nowrap transition-[opacity,transform]",
            compact
              ? "pointer-events-none -translate-x-1 opacity-0"
              : "translate-x-0 opacity-100 delay-75",
          ].join(" ")}
        >
          {item.label}
        </span>
      </span>
      {item.badge && !compact ? (
        <span className="rounded-sm border border-app-border px-1.5 py-0.5 text-[10px] font-medium uppercase text-app-text-subtle transition-opacity delay-75">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const className = [
    "flex h-9 min-w-0 items-center justify-between gap-2 rounded-md py-0 pl-0 text-sm transition",
    compact ? "w-10 pr-0" : "w-full pr-2.5",
    active
      ? "bg-app-panel-muted text-app-text"
      : "text-app-text-muted hover:bg-app-panel-muted hover:text-app-text",
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

export function AppSidebar({
  open,
  onOpen,
  onClose,
  userProfile,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  userProfile: AppUserProfile | null;
}) {
  const pathname = usePathname();
  const profileName = profileDisplayName(userProfile);
  const profileItem: NavItem = {
    ...defaultProfileItem,
    label: profileName,
    fallback: profileFallback(profileName),
  };
  const dashboardItem = primaryItems[0]!;
  const secondaryPrimaryItems = primaryItems.slice(1);
  const orderedPrimaryItems: NavItem[] = [
    dashboardItem,
    profileItem,
    ...secondaryPrimaryItems,
  ];
  const railItems: NavItem[] = [
    dashboardItem,
    profileItem,
    ...secondaryPrimaryItems.filter((item) => item.rail),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Stäng sidomeny"
        className={[
          "fixed inset-0 z-40 bg-app-overlay transition-opacity duration-150 ease-out md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-app-border bg-app-panel px-2 py-3 shadow-[var(--app-shadow-panel)] transition-transform duration-150 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-10 items-center gap-2">
            <Link
              href="/"
              aria-label="Cintela dashboard"
              title="Cintela"
              className="flex h-9 min-w-0 flex-1 items-center rounded-md px-2 text-app-text transition hover:bg-app-panel-muted"
            >
              <BrandLogo />
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng sidomeny"
              title="Stäng sidomeny"
              className={buttonClassName({
                variant: "secondary",
                size: "icon",
                className: "h-9 w-9 shrink-0 p-0",
              })}
            >
              {"<"}
            </button>
          </div>

          <nav className="mt-4 flex flex-col gap-1.5" aria-label="Huvudmeny">
            {orderedPrimaryItems.map((item) => (
              <SidebarLink
                key={item.label || item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </nav>

          <div className="mt-6">
            <div className="px-3 text-xs font-medium uppercase tracking-wide text-app-text-subtle">
              Kommande
            </div>
            <nav className="mt-2 flex flex-col gap-1.5" aria-label="Kommande vyer">
              {futureItems.map((item) => (
                <SidebarLink key={item.label} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div className="mt-auto rounded-md border border-app-border bg-app-panel-muted p-3">
            <div className="text-xs font-medium text-app-text-muted">MVP focus</div>
            <p className="mt-1 text-xs leading-5 text-app-text-subtle">
              Stabil sök, tydliga företagssidor och regionala vyer först.
            </p>
          </div>
        </div>
      </aside>

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 hidden overflow-hidden border-r border-app-border bg-app-panel px-2 py-3 shadow-[var(--app-shadow-panel)] transition-[width] duration-150 ease-out md:block",
          open ? "w-64" : "w-14",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="relative h-10">
            <button
              type="button"
              onClick={onOpen}
              aria-label="Öppna sidomeny"
              title="Öppna sidomeny"
              tabIndex={open ? -1 : 0}
              className={[
                buttonClassName({ variant: "secondary", size: "icon" }),
                "group absolute left-0 top-0 h-10 w-10 p-0 transition-[opacity,transform] duration-100",
                open
                  ? "pointer-events-none -translate-x-1 opacity-0"
                  : "translate-x-0 opacity-100 delay-75",
              ].join(" ")}
            >
              <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
                <BrandLogo compact />
              </span>
              <span className="absolute opacity-0 transition-opacity group-hover:opacity-100">
                {">"}
              </span>
            </button>

            <div
              className={[
                "absolute inset-y-0 left-0 right-0 flex items-center gap-2 transition-[opacity,transform] duration-100",
                open
                  ? "translate-x-0 opacity-100 delay-75"
                  : "pointer-events-none -translate-x-1 opacity-0",
              ].join(" ")}
            >
              <Link
                href="/"
                aria-label="Cintela dashboard"
                title="Cintela"
                tabIndex={open ? 0 : -1}
                className="flex h-9 min-w-0 flex-1 items-center rounded-md px-2 text-app-text transition hover:bg-app-panel-muted"
              >
                <BrandLogo />
              </Link>

              <button
                type="button"
                onClick={onClose}
                aria-label="Stäng sidomeny"
                title="Stäng sidomeny"
                tabIndex={open ? 0 : -1}
                className={buttonClassName({
                  variant: "secondary",
                  size: "icon",
                  className: "h-9 w-9 shrink-0 p-0",
                })}
              >
                {"<"}
              </button>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1.5" aria-label={open ? "Huvudmeny" : "Snabbmeny"}>
            {(open ? orderedPrimaryItems : railItems).map((item) => (
              <SidebarLink
                key={item.label || item.href}
                item={item}
                pathname={pathname}
                compact={!open}
              />
            ))}
          </nav>

          <div
            className={[
              "mt-6 transition-[opacity,transform] duration-100",
              open
                ? "translate-x-0 opacity-100 delay-75"
                : "pointer-events-none -translate-x-1 opacity-0",
            ].join(" ")}
          >
            <div className="px-3 text-xs font-medium uppercase tracking-wide text-app-text-subtle">
              Kommande
            </div>
            <nav className="mt-2 flex flex-col gap-1.5" aria-label="Kommande vyer">
              {futureItems.map((item) => (
                <SidebarLink key={item.label} item={item} pathname={pathname} />
              ))}
            </nav>
          </div>

          <div
            className={[
              "mt-auto rounded-md border border-app-border bg-app-panel-muted p-3 transition-[opacity,transform] duration-100",
              open
                ? "translate-x-0 opacity-100 delay-75"
                : "pointer-events-none translate-y-1 opacity-0",
            ].join(" ")}
          >
            <div className="text-xs font-medium text-app-text-muted">MVP focus</div>
            <p className="mt-1 text-xs leading-5 text-app-text-subtle">
              Stabil sök, tydliga företagssidor och regionala vyer först.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

