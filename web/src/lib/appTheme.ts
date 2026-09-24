export type ColorMode = "dark" | "light";
export type ColorTheme = "signature" | "slate" | "sand" | "forest";

export const COLOR_MODE_STORAGE_KEY = "company-intel-theme";
export const COLOR_THEME_STORAGE_KEY = "company-intel-color-theme";
export const APP_THEME_CHANGE_EVENT = "company-intel-theme-change";

export const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: "signature", label: "grafit och ultramarin" },
  { value: "slate", label: "djupblå skiffer" },
  { value: "sand", label: "varm sandsten" },
  { value: "forest", label: "dämpad skogsgrön" },
];

export function isColorMode(value: unknown): value is ColorMode {
  return value === "dark" || value === "light";
}

export function isColorTheme(value: unknown): value is ColorTheme {
  return value === "signature" || value === "slate" || value === "sand" || value === "forest";
}

export function currentColorMode(): ColorMode {
  const value = document.documentElement.dataset.theme;
  return isColorMode(value) ? value : "dark";
}

export function currentColorTheme(): ColorTheme {
  const value = document.documentElement.dataset.colorTheme;
  return isColorTheme(value) ? value : "signature";
}

function announceThemeChange() {
  window.dispatchEvent(
    new CustomEvent(APP_THEME_CHANGE_EVENT, {
      detail: {
        mode: currentColorMode(),
        colorTheme: currentColorTheme(),
      },
    }),
  );
}

export function applyColorMode(mode: ColorMode) {
  document.documentElement.dataset.theme = mode;
  localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  announceThemeChange();
}

export function applyColorTheme(colorTheme: ColorTheme) {
  document.documentElement.dataset.colorTheme = colorTheme;
  localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  announceThemeChange();
}
