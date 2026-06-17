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
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition",
        active
          ? "border-app-accent-border bg-app-accent-bg text-app-accent-text"
          : "border-app-border bg-app-panel text-app-text-muted",
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
        <span className="rounded-sm border border-app-border px-1.5 py-0.5 text-[10px] font-medium uppercase text-app-text-subtle">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  const className = [
    "flex h-10 min-w-0 items-center justify-between gap-2 rounded-md py-0 pl-0 pr-3 text-sm transition",
    active
      ? "bg-app-panel text-app-text"
      : "text-app-text-muted hover:bg-app-panel hover:text-app-text",
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-app-panel"
    >
      <NavIcon item={item} active={active} />
    </Link>
  );
}

function SidebarRail({
  pathname,
  onOpen,
  profileItem,
}: {
  pathname: string;
  onOpen: () => void;
  profileItem: NavItem;
}) {
  const railItems: NavItem[] = [
    profileItem,
    ...primaryItems.filter((item) => item.rail),
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 border-r border-app-border bg-app-bg px-2 py-3 md:block">
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Öppna sidomeny"
          title="Öppna sidomeny"
          className={[
            buttonClassName({ variant: "secondary", size: "icon" }),
            "group relative h-10 w-10 p-0",
          ].join(" ")}
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

  if (!open) {
    return (
      <SidebarRail
        pathname={pathname}
        onOpen={onOpen}
        profileItem={profileItem}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Stäng sidomeny"
        className="fixed inset-0 z-40 bg-app-overlay md:hidden"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-app-border bg-app-bg px-2 py-3 shadow-2xl md:w-64 md:max-w-none md:shadow-none">
        <div className="flex h-full flex-col">
          <div className="flex h-10 items-center gap-2">
            <Link
              href="/"
              aria-label="Cintela dashboard"
              title="Cintela"
              className="flex h-10 min-w-0 flex-1 items-center rounded-md px-2 text-app-text transition hover:bg-app-panel"
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
                className: "h-10 w-10 shrink-0 p-0",
              })}
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
            <div className="px-3 text-xs font-medium uppercase tracking-wide text-app-text-subtle">
              Kommande
            </div>
            <nav className="mt-2 flex flex-col gap-2" aria-label="Kommande vyer">
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
    </>
  );
}

