"use client";

import Link from "next/link";
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
  onClick,
  pressed,
}: {
  label: string;
  icon: string;
  disabled?: boolean;
  onClick?: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-800 bg-slate-900 px-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
    </button>
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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className={sidebarOpen ? "md:hidden" : ""}>
            <TopBarButton
              label={sidebarOpen ? "Stäng sidomeny" : "Öppna sidomeny"}
              icon="ME"
              onClick={onToggleSidebar}
              pressed={sidebarOpen}
            />
          </div>

          <Link
            href="/"
            className={[
              "h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-950",
              sidebarOpen ? "flex md:hidden" : "flex",
            ].join(" ")}
            aria-label="Company Intel dashboard"
            title="Company Intel"
          >
            VF
          </Link>

          <div
            className={[
              "min-w-0",
              sidebarOpen ? "hidden" : "hidden sm:block",
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-slate-100">
              Vium Företagen AB
            </div>
            <div className="text-xs text-slate-500">5594483561</div>
          </div>
        </div>

        <nav className="flex items-center gap-2" aria-label="Snabbmeny">
          <TopBarButton label="ICP-inställningar" icon="ICP" disabled />
          <TopBarButton
            label={themeLabel}
            icon={themeIcon}
            onClick={toggleTheme}
            pressed={mounted ? theme === "light" : false}
          />
          <TopBarButton label="Profil" icon="PR" disabled />
          <TopBarButton label="Logga ut" icon="UT" disabled />
        </nav>
      </div>
    </header>
  );
}
