"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ChevronIcon } from "@/src/components/ui/ChevronIcon";
import { usePopoverPresence } from "@/src/components/ui/usePopoverPresence";
import {
  ui,
  uiControlSize,
  uiRadius,
  uiTextSize,
  type UiRadius,
  type UiTextSize,
} from "@/src/lib/uiStyles";

type SelectMenuOption<T extends string> = {
  value: T;
  label: string;
};

type SelectMenuProps<T extends string> = {
  label: string;
  options: SelectMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  align?: "left" | "right";
  mobileAlign?: "left" | "right";
  compact?: boolean;
  embedded?: boolean;
  radius?: UiRadius;
  textSize?: UiTextSize;
  searchable?: boolean;
  searchPlaceholder?: string;
  panelWidth?: "trigger" | "wide";
};

const OPEN_EVENT = "company-intel-select-open";
const WIDE_PANEL_WIDTH = 416;
const VIEWPORT_GUTTER = 8;
const STACKED_LAYOUT_BREAKPOINT = 1280;

function horizontalPanelBounds(element: HTMLElement) {
  const visualViewport = window.visualViewport;
  const viewportLeft = visualViewport?.offsetLeft ?? 0;
  const viewportWidth = Math.min(
    visualViewport?.width ?? window.innerWidth,
    document.documentElement.clientWidth,
  );
  const viewportRight = viewportLeft + viewportWidth;
  const page = element.closest("main");

  if (!page) {
    return {
      left: viewportLeft + VIEWPORT_GUTTER,
      right: viewportRight - VIEWPORT_GUTTER,
    };
  }

  const pageRect = page.getBoundingClientRect();
  const pageStyle = window.getComputedStyle(page);
  const pageLeft =
    pageRect.left + (Number.parseFloat(pageStyle.paddingLeft) || 0);
  const pageRight =
    pageRect.right - (Number.parseFloat(pageStyle.paddingRight) || 0);

  return {
    left: Math.max(viewportLeft + VIEWPORT_GUTTER, pageLeft),
    right: Math.min(viewportRight - VIEWPORT_GUTTER, pageRight),
  };
}

export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
  align = "right",
  mobileAlign,
  compact = false,
  embedded = false,
  radius = "md",
  textSize = "xs",
  searchable = false,
  searchPlaceholder = "Sök",
  panelWidth = "trigger",
}: SelectMenuProps<T>) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [widePanelStyle, setWidePanelStyle] = useState<CSSProperties>();
  const {
    isOpen,
    isMounted,
    openPopover,
    closePopover,
    handlePopoverAnimationEnd,
    motionClassName,
  } = usePopoverPresence();
  const selected = options.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("sv-SE");
    if (!searchable || !normalizedQuery) return options;

    return options.filter((option) =>
      `${option.label} ${option.value}`
        .toLocaleLowerCase("sv-SE")
        .includes(normalizedQuery),
    );
  }, [options, query, searchable]);
  const panelAlignment = mobileAlign
    ? [
        mobileAlign === "right" ? "right-0 left-auto" : "left-0 right-auto",
        align === "right"
          ? "xl:right-0 xl:left-auto"
          : "xl:left-0 xl:right-auto",
      ]
    : [align === "right" ? "right-0 left-auto" : "left-0 right-auto"];
  const panelOrigin = mobileAlign
    ? [
        mobileAlign === "right" ? "origin-top-right" : "origin-top-left",
        align === "right" ? "xl:origin-top-right" : "xl:origin-top-left",
      ]
    : [align === "right" ? "origin-top-right" : "origin-top-left"];

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePopover();
        setQuery("");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePopover();
        setQuery("");
      }
    }

    function onOtherOpen(event: Event) {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== id) {
        closePopover();
        setQuery("");
      }
    }

    function closeOnResize() {
      closePopover();
      setQuery("");
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    window.addEventListener("resize", closeOnResize);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [closePopover, id, isOpen]);

  function toggleOpen() {
    if (!isOpen) {
      if (panelWidth === "wide") {
        const root = rootRef.current;
        if (root) {
          const rect = root.getBoundingClientRect();
          const panelBounds = horizontalPanelBounds(root);
          const width = Math.min(
            WIDE_PANEL_WIDTH,
            Math.max(0, panelBounds.right - panelBounds.left),
          );
          const responsiveAlign =
            mobileAlign && window.innerWidth < STACKED_LAYOUT_BREAKPOINT
              ? mobileAlign
              : align;
          const desiredLeft =
            responsiveAlign === "right" ? rect.right - width : rect.left;
          const panelLeft = Math.max(
            panelBounds.left,
            Math.min(
              desiredLeft,
              panelBounds.right - width,
            ),
          );

          setWidePanelStyle({
            left: panelLeft - rect.left,
            right: "auto",
            width,
          });
        }
      }
      window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { id } }));
      openPopover();
    } else {
      closePopover();
      setQuery("");
    }
  }

  return (
    <div
      ref={rootRef}
      className={[
        "relative min-w-0 max-w-full",
        embedded ? "h-full" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className={[
          embedded ? ui.selectMenuButtonEmbedded : ui.selectMenuButton,
          embedded ? "rounded-none" : uiRadius[radius],
          uiTextSize[textSize],
          "max-w-full overflow-hidden",
          embedded
            ? uiControlSize.select.embedded
            : compact
              ? uiControlSize.select.compact
              : uiControlSize.select.default,
        ].join(" ")}
        aria-expanded={isOpen}
      >
        {label ? <span className="shrink-0 text-app-text-subtle">{label}</span> : null}
        <span className="min-w-0 flex-1 truncate text-left text-app-text" title={selected?.label}>
          {selected?.label ?? "-"}
        </span>
        <span className="shrink-0 text-app-text-subtle">
          <ChevronIcon expanded={isOpen} />
        </span>
      </button>

      {isMounted ? (
        <div
          style={panelWidth === "wide" ? widePanelStyle : undefined}
          onAnimationEnd={handlePopoverAnimationEnd}
          className={[
            ui.selectMenuPanel,
            panelWidth === "wide"
              ? "max-w-none"
              : "max-w-full",
            searchable ? "overflow-hidden py-0" : "",
            motionClassName,
            ...panelOrigin,
            ...panelAlignment,
          ].join(" ")}
        >
          {searchable ? (
            <div className="border-b border-app-border p-2">
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={[ui.input, "h-7 px-2 py-1 text-xs"].join(" ")}
              />
            </div>
          ) : null}

          <div className={searchable ? "max-h-60 overflow-y-auto py-1" : ""}>
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    closePopover();
                    setQuery("");
                  }}
                  className={[
                    ui.selectMenuOption,
                    "truncate",
                    option.value === value
                      ? ui.selectMenuOptionActive
                      : ui.selectMenuOptionIdle,
                  ].join(" ")}
                  title={option.label}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-app-text-subtle">
                Inga träffar
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
