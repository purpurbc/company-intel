"use client";

import { useEffect, useState } from "react";

import {
  applyColorTheme,
  COLOR_THEME_OPTIONS,
  currentColorTheme,
  type ColorTheme,
} from "@/src/lib/appTheme";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { ui } from "@/src/lib/uiStyles";

export function AppearanceSettings() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("nordic");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setColorTheme(currentColorTheme());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function selectColorTheme(nextTheme: ColorTheme) {
    setColorTheme(nextTheme);
    applyColorTheme(nextTheme);
  }

  return (
    <div className="flex max-w-xs items-center justify-between gap-4">
      <span className={ui.label}>Färgtema</span>
      <div className="w-32 shrink-0">
        <SelectMenu
          label=""
          options={COLOR_THEME_OPTIONS}
          value={colorTheme}
          onChange={selectColorTheme}
          align="left"
          compact
        />
      </div>
    </div>
  );
}
