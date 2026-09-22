"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatedCollapse } from "@/src/components/ui/AnimatedCollapse";
import { buttonClassName } from "@/src/components/ui/Button";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import type { AppUserProfile } from "@/src/lib/types";

type NavItem = {
  label: string;
  href?: string;
  badge?: string;
  icon: string;
  fallback?: string;
  rail?: boolean;
  activePrefixes?: readonly string[];
};

const defaultProfileItem: NavItem = {
  label: "",
  href: "/profile",
  icon: "/icons/menu/image-user-svgrepo-com.svg",
  fallback: "P",
  rail: true,
};

const primaryItemsBeforeInformation: NavItem[] = [
  {
    label: "Hem",
    href: "/",
    icon: "/icons/menu/house-chimney-blank-svgrepo-com.svg",
    fallback: "H",
    rail: true,
  },
  {
    label: "Företag",
    href: "/companies",
    icon: "/icons/menu/user-search-svgrepo-com.svg",
    fallback: "SF",
    rail: true,
  },
];

const informationItems: NavItem[] = [
  {
    label: "Överblick",
    href: "/sweden",
    icon: "/icons/menu/globe-svgrepo-com.svg",
    fallback: "Ö",
    rail: true,
  },
  {
    label: "Statistik",
    href: "/sverigedata/statistik",
    icon: "/icons/menu/landmark-svgrepo-com.svg",
    fallback: "S",
    rail: true,
  },
  {
    label: "Geografi",
    href: "/geography",
    icon: "/icons/menu/map-location-pin-svgrepo-com.svg",
    fallback: "G",
    rail: true,
    activePrefixes: [
      "/geography",
      "/counties",
      "/county/",
      "/municipalities",
      "/municipality/",
    ],
  },
  {
    label: "Karta",
    href: "/map",
    icon: "/icons/menu/map-svgrepo-com.svg",
    fallback: "K",
    rail: true,
  },
];

const primaryItemsAfterInformation: NavItem[] = [
  {
    label: "Arbetsyta",
    href: "/workspace",
    icon: "/icons/menu/industry-svgrepo-com.svg",
    fallback: "A",
    rail: true,
  },
];

const informationGroupItem: NavItem = {
  label: "Sverigedata",
  href: "/sverigedata",
  icon: "/icons/menu/globe-svgrepo-com.svg",
  fallback: "S",
  rail: true,
  activePrefixes: [
    "/sverigedata",
    "/sverigedata/statistik",
    "/sweden",
    "/geography",
    "/counties",
    "/county/",
    "/municipalities",
    "/municipality/",
    "/map",
  ],
};

const railItems = [
  ...primaryItemsBeforeInformation,
  informationGroupItem,
  ...primaryItemsAfterInformation,
];

const settingsItem: NavItem = {
  label: "Inställningar",
  href: "/settings",
  icon: "/icons/menu/gear.svg",
  fallback: "I",
};

const adminItem: NavItem = {
  label: "Admin",
  href: "/admin",
  icon: "/icons/menu/king.svg",
  fallback: "A",
};

const componentLibraryItem: NavItem = {
  label: "Komponenter",
  href: "/components",
  icon: "/icons/menu/filter.svg",
  fallback: "K",
};

const utilityItems = [componentLibraryItem, adminItem, settingsItem];

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

function isActive(
  pathname: string,
  href?: string,
  activePrefixes: readonly string[] = [],
) {
  if (!href) return false;
  if (
    activePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix),
    )
  ) {
    return true;
  }
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function profileDisplayName(userProfile: AppUserProfile | null) {
  return (
    userProfile?.display_name?.trim() ||
    userProfile?.company_name?.trim() ||
    "Profil"
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
      <span className={compact ? "relative h-5 w-6" : "relative h-6 w-[113px]"}>
        <Image
          src={darkLogoSrc}
          alt="Cintela"
          fill
          sizes={compact ? "24px" : "113px"}
          priority
          unoptimized
          className="theme-logo-dark object-contain"
        />
        <Image
          src={lightLogoSrc}
          alt="Cintela"
          fill
          sizes={compact ? "24px" : "113px"}
          priority
          unoptimized
          className="theme-logo-light object-contain"
        />
      </span>

    </span>
  );
}

function SidebarLink({
  item,
  pathname,
  compact = false,
  nested = false,
}: {
  item: NavItem;
  pathname: string;
  compact?: boolean;
  nested?: boolean;
}) {
  const active = isActive(pathname, item.href, item.activePrefixes);
  const content = nested ? (
    <span className="min-w-0 flex-1 truncate whitespace-nowrap">
      {item.label}
    </span>
  ) : (
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
    "flex min-w-0 items-center justify-between gap-2 rounded-md py-0 text-xs transition",
    nested ? "h-7 pl-8" : "h-8 pl-0",
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

function SidebarNavigation({
  pathname,
  compact,
  informationOpen,
  onInformationToggle,
}: {
  pathname: string;
  compact: boolean;
  informationOpen: boolean;
  onInformationToggle: () => void;
}) {
  if (compact) {
    return railItems.map((item) => (
      <SidebarLink
        key={item.label || item.href}
        item={item}
        pathname={pathname}
        compact
      />
    ));
  }

  const informationActive = isActive(
    pathname,
    informationGroupItem.href,
    informationGroupItem.activePrefixes,
  );

  return (
    <>
      {primaryItemsBeforeInformation.map((item) => (
        <SidebarLink key={item.href} item={item} pathname={pathname} />
      ))}

      <div>
        <div
          className={[
            "flex h-8 w-full min-w-0 items-center rounded-md text-xs transition",
            informationActive
              ? "bg-app-panel-muted text-app-text"
              : "text-app-text-muted hover:bg-app-panel-muted hover:text-app-text",
          ].join(" ")}
        >
          <Link
            href={informationGroupItem.href ?? "/sverigedata"}
            className="flex h-full min-w-0 flex-1 items-center gap-2.5"
          >
            <span className="flex w-10 shrink-0 justify-center">
              <NavIcon item={informationGroupItem} active={informationActive} />
            </span>
            <span className="truncate">{informationGroupItem.label}</span>
          </Link>
          <button
            type="button"
            aria-expanded={informationOpen}
            aria-label={informationOpen ? "Dölj undersidor" : "Visa undersidor"}
            title={informationOpen ? "Dölj undersidor" : "Visa undersidor"}
            onClick={onInformationToggle}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-app-text-muted transition hover:bg-app-panel-hover hover:text-app-text"
          >
            <ChevronIcon expanded={informationOpen} className="h-3.5 w-3.5" />
          </button>
        </div>

        <AnimatedCollapse expanded={informationOpen}>
          <div className="mt-1 space-y-1">
            {informationItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                nested
              />
            ))}
          </div>
        </AnimatedCollapse>
      </div>

      {primaryItemsAfterInformation.map((item) => (
        <SidebarLink key={item.href} item={item} pathname={pathname} />
      ))}
    </>
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
  const informationActive = isActive(
    pathname,
    informationGroupItem.href,
    informationGroupItem.activePrefixes,
  );
  const [informationMenuState, setInformationMenuState] = useState({
    pathname,
    open: informationActive,
  });
  const informationOpen =
    informationMenuState.pathname === pathname
      ? informationMenuState.open
      : informationActive;
  const toggleInformation = () =>
    setInformationMenuState({ pathname, open: !informationOpen });
  const profileName = profileDisplayName(userProfile);
  const profileItem: NavItem = {
    ...defaultProfileItem,
    label: profileName,
    fallback: profileFallback(profileName),
  };
  const orderedUtilityItems = [profileItem, ...utilityItems];

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
              aria-label="Cintela startsida"
              title="Cintela"
              className="flex h-8 min-w-0 flex-1 items-center rounded-md px-2 text-app-text transition hover:bg-app-panel-muted"
            >
              <BrandLogo />
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Stäng sidomeny"
              title="Stäng sidomeny"
              className={buttonClassName({
                variant: "ghost",
                size: "icon",
                className: "h-7 w-7 shrink-0 bg-transparent p-0 hover:bg-app-panel-muted",
              })}
            >
              <MaskedIcon src="/icons/menu/hide_sidebar.svg" />
            </button>
          </div>

          <nav className="mt-4 flex flex-col gap-1.5" aria-label="Huvudmeny">
            <SidebarNavigation
              pathname={pathname}
              compact={false}
              informationOpen={informationOpen}
              onInformationToggle={toggleInformation}
            />
          </nav>

          <nav className="mt-auto flex flex-col gap-1.5 pt-4" aria-label="Administration och inställningar">
            {orderedUtilityItems.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
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
                buttonClassName({ variant: "ghost", size: "icon" }),
                "group absolute left-0 top-0 h-10 w-10 bg-transparent p-0 transition-[opacity,transform] duration-100 hover:bg-app-panel-muted",
                open
                  ? "pointer-events-none -translate-x-1 opacity-0"
                  : "translate-x-0 opacity-100 delay-75",
              ].join(" ")}
            >
              <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
                <BrandLogo compact />
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <MaskedIcon src="/icons/menu/show_sidebar.svg" />
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
                aria-label="Cintela startsida"
                title="Cintela"
                tabIndex={open ? 0 : -1}
                className="flex h-8 min-w-0 flex-1 items-center rounded-md px-2 text-app-text transition hover:bg-app-panel-muted"
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
                  variant: "ghost",
                  size: "icon",
                  className: "h-7 w-7 shrink-0 bg-transparent p-0 hover:bg-app-panel-muted",
                })}
              >
                <MaskedIcon src="/icons/menu/hide_sidebar.svg" />
              </button>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1.5" aria-label={open ? "Huvudmeny" : "Snabbmeny"}>
            {open ? (
              <SidebarNavigation
                pathname={pathname}
                compact={false}
                informationOpen={informationOpen}
                onInformationToggle={toggleInformation}
              />
            ) : (
              railItems.map((item) => (
                <SidebarLink
                  key={item.label || item.href}
                  item={item}
                  pathname={pathname}
                  compact
                />
              ))
            )}
          </nav>

          <nav className="mt-auto flex flex-col gap-1.5 pt-4" aria-label="Administration och inställningar">
            {orderedUtilityItems.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                compact={!open}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
