"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  APP_THEME_CHANGE_EVENT,
  applyColorMode,
  applyColorTheme,
  COLOR_THEME_OPTIONS,
  currentColorMode,
  currentColorTheme,
  type ColorMode,
  type ColorTheme,
} from "@/src/lib/appTheme";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { Surface } from "@/src/components/ui/Surface";
import { ui } from "@/src/lib/uiStyles";

export function AppearanceSettings() {
  const [colorMode, setColorMode] = useState<ColorMode>("dark");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("signature");

  useEffect(() => {
    const syncAppearance = () => {
      setColorMode(currentColorMode());
      setColorTheme(currentColorTheme());
    };
    const timer = window.setTimeout(syncAppearance, 0);
    window.addEventListener(APP_THEME_CHANGE_EVENT, syncAppearance);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(APP_THEME_CHANGE_EVENT, syncAppearance);
    };
  }, []);

  return (
    <Surface padding="none">
      <div className="flex min-h-12 items-center justify-between gap-4 border-b border-app-border px-4 py-2">
        <span className={ui.label}>Visningsläge</span>
        <div className="w-32 shrink-0">
          <SelectMenu
            label=""
            options={[{ value: "dark", label: "Mörkt" }, { value: "light", label: "Ljust" }]}
            value={colorMode}
            onChange={(nextMode) => { setColorMode(nextMode); applyColorMode(nextMode); }}
            align="left"
            compact
          />
        </div>
      </div>
      <div className="flex min-h-12 flex-col items-stretch gap-1.5 border-b border-app-border px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className={ui.label}>Färgtema</span>
        <div className="w-full shrink-0 sm:w-56">
          <SelectMenu
            label=""
            options={COLOR_THEME_OPTIONS}
            value={colorTheme}
            onChange={(nextTheme) => { setColorTheme(nextTheme); applyColorTheme(nextTheme); }}
            align="left"
            compact
          />
        </div>
      </div>
      {[
        { href: "/admin", label: "Admin", icon: "/icons/menu/king.svg" },
        { href: "/components", label: "Komponenter", icon: "/icons/menu/filter.svg" },
      ].map((destination) => (
        <Link
          key={destination.href}
          href={destination.href}
          className="flex h-10 items-center gap-3 px-4 text-sm text-app-text-muted transition hover:bg-app-panel-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-focus"
        >
          <MaskedIcon src={destination.icon} />
          <span className="flex-1">{destination.label}</span>
          <MaskedIcon src="/icons/utility/arrow_right.svg" className="h-3.5 w-3.5" />
        </Link>
      ))}
    </Surface>
  );
}
