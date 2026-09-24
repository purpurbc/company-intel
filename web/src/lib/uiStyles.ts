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

/** Shared density for interactive controls. Keep control spacing out of pages. */
export const uiControlSize = {
  button: {
    icon: "h-7 min-w-7 px-1 text-xs",
    xs: "h-6 px-2 py-0.5 text-xs",
    sm: "h-7 px-2 py-1 text-xs",
    md: "h-7 px-2.5 py-1 text-xs",
  },
  toggle: {
    xs: "px-1.5 py-0.5",
    sm: "px-2 py-1",
    md: "px-2.5 py-1",
  },
  select: {
    embedded: "h-full px-2 py-0",
    compact: "h-7 px-2 py-1",
    default: "h-7 px-2.5 py-1",
  },
} as const;

export const ui = {
  /*
   * Application-level design tokens. Page and Surface components consume these
   * so product code should not repeat page padding, panel padding or heading
   * typography. Change these values to update the complete application shell.
   */
  page: "min-h-screen bg-app-bg px-3 py-4 text-app-text sm:px-4 sm:py-5",
  pageContent: "mx-auto w-full max-w-7xl space-y-4",
  pageContentNarrow: "mx-auto w-full max-w-4xl space-y-4",
  pageContentCompact: "mx-auto w-full max-w-xl space-y-4",
  pageHeader: "[&+nav]:!mt-3",
  pageTitle: "text-2xl font-semibold text-app-text",
  pageDescription: "mt-2 max-w-3xl text-sm leading-6 text-app-text-muted",
  eyebrow: "text-xs font-medium uppercase text-app-text-subtle",
  sectionTitle: "text-base font-semibold text-app-text",
  sectionDescription: "mt-1 text-sm leading-6 text-app-text-muted",
  sectionGrid: "grid min-w-0 gap-3 lg:grid-cols-2",
  detailGrid: "grid min-w-0 gap-3 xl:grid-cols-2",

  card: "rounded-md border border-app-border bg-app-panel shadow-[var(--app-shadow-panel)]",
  cardMuted: "rounded-md border border-app-border bg-app-panel-muted shadow-[var(--app-shadow-panel)]",
  stickyHeader:
    "sticky top-0 z-30 bg-app-panel shadow-[var(--app-shadow-sticky)]",
  panelPadding: "p-2.5 sm:p-3",
  panelPaddingCompact: "p-2.5",
  inset: "rounded-md border border-app-border bg-app-panel-soft p-2",
  modalOverlay:
    "fixed inset-0 z-[100] flex items-center justify-center bg-app-overlay p-4",
  modalPanel:
    "max-h-[90vh] w-full overflow-auto rounded-md border border-app-border bg-app-panel p-3 shadow-[var(--app-shadow-float)] sm:p-4",

  input:
    "min-h-7 w-full rounded-md border border-app-border-strong bg-app-panel px-2 py-1 text-xs text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",

  inputReadOnly:
    "min-h-7 w-full rounded-md border border-app-border bg-app-panel-muted px-2 py-1 text-xs text-app-text outline-none",

  textarea:
    "w-full rounded-md border border-app-border-strong bg-app-panel px-2 py-1 text-xs text-app-text outline-none transition placeholder:text-app-placeholder focus:border-app-focus",

  searchFrame:
    "app-search-frame rounded-lg border border-app-border bg-app-panel p-1 text-left",

  select:
    "min-h-7 rounded-md border border-app-border-strong bg-app-panel px-2 py-1 text-xs text-app-text outline-none transition focus:border-app-focus",

  buttonBase:
    "inline-flex items-center justify-center gap-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-50",

  buttonPrimary:
    "bg-app-control-bg text-app-control-text hover:bg-app-control-bg-hover",

  buttonSecondary:
    "border border-app-border-strong bg-app-panel text-app-text hover:bg-app-panel-hover",

  buttonAccent:
    "bg-app-action-accent-bg text-app-action-accent-text shadow-sm hover:bg-app-action-accent-bg-hover",

  buttonDark:
    "border border-app-border-strong bg-app-bg text-app-text hover:bg-app-panel",

  buttonLight:
    "border border-app-border bg-app-panel-soft text-app-text hover:bg-app-panel-hover",

  buttonDelete:
    "bg-app-action-danger-bg text-app-action-danger-text shadow-sm hover:bg-app-action-danger-bg-hover",

  buttonAccept:
    "bg-app-action-accept-bg text-app-action-accept-text shadow-sm hover:bg-app-action-accept-bg-hover",

  buttonGhost:
    "text-app-text-muted hover:bg-app-panel-hover hover:text-app-text",

  buttonToggle:
    "border border-app-border-strong bg-app-panel text-app-text hover:bg-app-panel-hover",

  selectMenuButton:
    "inline-flex w-full items-center justify-between gap-2 border border-app-border-strong bg-app-panel font-normal text-app-text transition hover:bg-app-panel-hover",

  selectMenuButtonEmbedded:
    "inline-flex h-full w-full items-center justify-between gap-2 border-0 bg-transparent font-normal text-app-text transition hover:bg-app-panel-hover",

  selectMenuPanel:
    "absolute z-30 mt-2 max-h-72 min-w-full overflow-auto rounded-md border border-app-border bg-app-panel py-1 shadow-[var(--app-shadow-panel)]",

  selectMenuOption:
    "block w-full px-2 py-1.5 text-left text-xs transition",

  selectMenuOptionActive:
    "bg-app-accent-bg text-app-accent-text",

  selectMenuOptionIdle:
    "text-app-text hover:bg-app-panel-hover",

  toggleGroup:
    "relative inline-grid grid-cols-2 items-center rounded-md bg-app-panel-soft p-0.5 shadow-[inset_0_0_0_1px_var(--app-border)]",

  toggleOption:
    "relative z-10 inline-flex items-center justify-center rounded-sm font-medium leading-none transition-colors duration-150",

  toggleOptionActive:
    "text-app-accent-text",

  toggleOptionIdle:
    "text-app-text-muted hover:text-app-text",

  label: "text-sm font-medium text-app-text",
  fieldLabel: "text-xs font-medium uppercase text-app-text-muted",
  helpText: "text-xs text-app-text-muted",

  chip:
    "rounded-md border px-2 py-1 !text-xs transition border-app-border-strong bg-app-panel text-app-text hover:bg-app-panel-hover",

  chipSelected:
    "!border-app-border-strong !bg-app-control-bg !text-app-control-text hover:!bg-app-control-bg-hover hover:!text-app-control-text focus:!text-app-control-text active:!text-app-control-text visited:!text-app-control-text",

  countChip:
    "inline-flex items-center rounded-full bg-app-panel-soft px-2 py-0.5 text-[11px] font-medium leading-4 text-app-text-muted",

  badge:
    "inline-flex max-w-full items-start whitespace-normal break-words text-xs font-medium leading-5 text-app-text-muted",

  divider: "border-app-border",
};
