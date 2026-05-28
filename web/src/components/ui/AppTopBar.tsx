"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("company-intel-theme", theme);
}

function TopBarButton({
  label,
  icon,
  disabled = false,
  href,
  onClick,
  pressed,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  pressed?: boolean;
}) {
  const className =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

  if (href && !disabled) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={className}
    >
      {icon}
    </button>
  );
}

function DashboardHomeIcon() {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className="relative inline-flex h-4 min-w-4 items-center justify-center">
      <Image
        src="/icons/home.svg"
        alt=""
        aria-hidden="true"
        width={16}
        height={16}
        unoptimized
        className={[
          "absolute h-4 w-4 object-contain transition-opacity",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
      />
      <span className={loaded ? "opacity-0" : "opacity-100"}>&amp;!</span>
    </span>
  );
}

export function AppTopBar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentTheme = document.documentElement.dataset.theme;
      const initialTheme =
        currentTheme === "light" || currentTheme === "dark"
          ? currentTheme
          : "dark";

      setTheme(initialTheme);
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) applyTheme(theme);
  }, [mounted, theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }

  const themeLabel =
    !mounted || theme === "dark" ? "Byt till ljust tema" : "Byt till mörkt tema";
  const themeIcon = !mounted || theme === "dark" ? "LJ" : "MR";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="md:hidden">
            <TopBarButton
              label={sidebarOpen ? "Stäng sidomeny" : "Öppna sidomeny"}
              icon={sidebarOpen ? "<" : ">"}
              onClick={onToggleSidebar}
              pressed={sidebarOpen}
            />
          </div>

        </div>

        <nav className="flex items-center gap-2" aria-label="Snabbmeny">
          <TopBarButton
            label="ICP-inställningar"
            icon="ICP"
            href="/profile#icp"
          />
          <TopBarButton
            label={themeLabel}
            icon={themeIcon}
            onClick={toggleTheme}
            pressed={mounted ? theme === "light" : false}
          />
          <TopBarButton
            label="Dashboard"
            icon={<DashboardHomeIcon />}
            href="/"
          />
          <TopBarButton label="Logga ut" icon="UT" disabled />
        </nav>
      </div>
    </header>
  );
}
