"use client";

type TabOption<T extends string> = {
  key: T;
  label: string;
};

type TabsProps<T extends string> = {
  items: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export const tabsClassName =
  "app-scrollbar-hidden flex gap-1 overflow-x-auto border-b border-app-border-strong";

export function tabClassName(active: boolean) {
  return [
    "shrink-0 whitespace-nowrap rounded-t-md border-b-2 px-2.5 py-1.5 text-sm font-semibold transition-colors",
    active
      ? "border-app-accent bg-app-accent-bg text-app-accent-text"
      : "border-transparent text-app-text-muted hover:bg-app-panel-soft hover:text-app-text",
  ].join(" ");
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
}: TabsProps<T>) {
  return (
    <nav
      className={[
        tabsClassName,
        className,
      ].join(" ")}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={tabClassName(active)}
            aria-pressed={active}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
