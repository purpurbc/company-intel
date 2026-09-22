"use client";

import { useEffect, useState } from "react";
import { ActionControl } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import {
  applyColorMode,
  currentColorMode,
  type ColorMode,
} from "@/src/lib/appTheme";

const ICONS = {
  dashboard: "/icons/menu/house-chimney-blank-svgrepo-com.svg",
  profile: "/icons/menu/image-user-svgrepo-com.svg",
  themeLight: "/icons/menu/sun-svgrepo-com.svg",
  themeDark: "/icons/menu/moon-svgrepo-com.svg",
  logout: "/icons/menu/logout-svgrepo-com.svg",
  sidebarShow: "/icons/menu/show_sidebar.svg",
  sidebarHide: "/icons/menu/hide_sidebar.svg",
};

export function AppTopBar({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  const [theme, setTheme] = useState<ColorMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(currentColorMode());
      setMounted(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) applyColorMode(theme);
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
              icon={
                <MaskedIcon
                  src={sidebarOpen ? ICONS.sidebarHide : ICONS.sidebarShow}
                />
              }
              onClick={onToggleSidebar}
              pressed={sidebarOpen}
              variant="ghost"
              size="icon"
            />
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
