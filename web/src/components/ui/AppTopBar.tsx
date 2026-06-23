"use client";

import { useEffect, useState } from "react";
import { ActionControl } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";

type Theme = "dark" | "light";

const ICONS = {
  dashboard: "/icons/menu/house-chimney-blank-svgrepo-com.svg",
  profile: "/icons/menu/image-user-svgrepo-com.svg",
  themeLight: "/icons/menu/sun-svgrepo-com.svg",
  themeDark: "/icons/menu/moon-svgrepo-com.svg",
  logout: "/icons/menu/logout-svgrepo-com.svg",
};

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("company-intel-theme", theme);
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
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const themeLabel =
    !mounted || theme === "dark" ? "Byt till ljust tema" : "Byt till mörkt tema";

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-bg/90 backdrop-blur">
      <div className="relative mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="md:hidden">
            <ActionControl
              label={sidebarOpen ? "Stäng sidomeny" : "Öppna sidomeny"}
              onClick={onToggleSidebar}
              pressed={sidebarOpen}
              variant="secondary"
              size="icon"
            >
              {sidebarOpen ? "<" : ">"}
            </ActionControl>
          </div>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Snabbmeny">
          {/* <ActionControl
            label="Profil"
            icon={<MaskedIcon src={ICONS.profile} />}
            href="/profile"
          /> */}
          <ActionControl
            label={themeLabel}
            icon={
              <MaskedIcon
                src={theme === "dark" ? ICONS.themeLight : ICONS.themeDark}
              />
            }
            onClick={toggleTheme}
            pressed={mounted ? theme === "light" : false}
          />
          {/* <ActionControl
            label="Dashboard"
            icon={<MaskedIcon src={ICONS.dashboard} />}
            href="/"
          /> */}
          <ActionControl 
            label="Logga ut" 
            icon={<MaskedIcon src={ICONS.logout} />}
            href="/"
            disabled
          />
        </nav>
      </div>
    </header>
  );
}
