export type UiTextSize = "xs" | "sm" | "md" | "lg";
export type UiRadius = "sm" | "md" | "lg" | "full";
export type UiWidth = "W2" | "W4" | "W8" | "W12" | "W16" | "W24" | "W32" | "W48" | "full" | "auto";
export type UiHeight = "H2" | "H4" | "H8" | "H12" | "H16" | "H24" | "H32" | "H48" | "auto";

export const uiWidth = {
  W2: "w-2",
  W4: "w-4",
  W8: "w-8",
  W12: "w-12",
  W16: "w-16",
  W24: "w-24",
  W32: "w-32",
  W48: "w-48",
  full: "w-full",
  auto: "w-auto",
} as const;

export const uiHeight = {
  H2: "h-2",
  H4: "h-4",
  H8: "h-8",
  H12: "h-12",
  H16: "h-16",
  H24: "h-24",
  H32: "h-32",
  H48: "h-48",
  auto: "h-auto",
} as const;

export const uiTextSize = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

export const uiRadius = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

export const ui = {
  card: "rounded-md border border-app-border bg-app-panel shadow-[var(--app-shadow-panel)]",
  cardMuted: "rounded-md border border-app-border bg-app-panel-muted shadow-[var(--app-shadow-panel)]",

  input:
    "w-full rounded-md border border-app-border-strong bg-app-panel px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",

  select:
    "rounded-md border border-app-border-strong bg-app-panel px-3 py-2 text-sm text-app-text outline-none transition focus:border-app-focus",

  buttonBase:
    "inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50",

  buttonPrimary:
    "bg-app-control-bg text-app-control-text hover:bg-app-control-bg-hover",

  buttonSecondary:
    "border border-app-border-strong bg-app-panel text-app-text hover:bg-app-panel-hover",

  buttonAccent:
    "border border-app-accent-border bg-app-accent-bg text-app-accent-text hover:bg-app-accent-bg-soft",

  buttonDark:
    "border border-app-border-strong bg-app-bg text-app-text hover:bg-app-panel",

  buttonLight:
    "border border-app-border bg-app-panel-soft text-app-text hover:bg-app-panel-hover",

  buttonDelete:
    "border border-app-danger-border bg-app-danger-bg text-app-danger-text hover:opacity-80",

  buttonAccept:
    "border border-app-accent-border bg-app-accent-bg text-app-accent-text hover:bg-app-accent-bg-soft",

  buttonGhost:
    "text-app-text-muted hover:bg-app-panel-hover",

  buttonToggle:
    "border border-app-border bg-app-panel-soft text-app-text-muted hover:bg-app-panel-hover hover:text-app-text",

  selectMenuButton:
    "inline-flex w-full items-center justify-between gap-2 border border-app-border-strong bg-app-panel font-medium text-app-text transition hover:bg-app-panel-hover",

  selectMenuPanel:
    "absolute z-30 mt-2 max-h-72 min-w-full overflow-auto rounded-md border border-app-border bg-app-panel py-1 shadow-[var(--app-shadow-panel)]",

  selectMenuOption:
    "block w-full px-3 py-2 text-left text-sm transition",

  selectMenuOptionActive:
    "bg-app-control-bg text-app-control-text",

  selectMenuOptionIdle:
    "text-app-text-muted hover:bg-app-panel-hover hover:text-app-text",

  toggleGroup:
    "inline-flex rounded-md border border-app-border-strong bg-app-panel-soft p-0.5",

  toggleOption:
    "rounded-sm border border-transparent font-medium transition",

  toggleOptionActive:
    "!border-app-border-strong bg-app-control-bg text-app-control-text ring-1 ring-app-border-strong shadow-sm",

  toggleOptionIdle:
    "text-app-text-muted hover:bg-app-panel-hover hover:text-app-text",

  label: "text-sm font-medium text-app-text-muted",
  helpText: "text-sm text-app-text-subtle",

  chip:
    "rounded-md border px-3 py-1.5 text-sm transition border-app-border-strong bg-app-panel text-app-text hover:bg-app-panel-hover",

  chipSelected:
    "!border-app-border-strong !bg-app-control-bg !text-app-control-text hover:!bg-app-control-bg-hover hover:!text-app-control-text focus:!text-app-control-text active:!text-app-control-text visited:!text-app-control-text",

  countChip:
    "rounded-md border border-app-border-strong bg-app-panel-soft px-2.5 py-1 text-xs font-medium text-app-text-muted",

  badge:
    "rounded-md border border-app-border-strong bg-app-panel-soft px-2 py-1 text-xs font-medium text-app-text",

  badgeSelected:
    "rounded-md border border-app-border-strong bg-app-control-bg px-2 py-1 text-xs font-medium text-app-control-text",

  divider: "border-app-border",
};
