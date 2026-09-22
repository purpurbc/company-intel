"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/src/components/ui/Button";
import { MaskedIcon } from "@/src/components/ui/MaskedIcon";
import { ui } from "@/src/lib/uiStyles";
import {
  COMPANY_PAGE_SIZE_OPTIONS,
  COMPANY_RESULT_WINDOW_LIMIT,
  companyResultPageCount,
} from "@/src/lib/pagination";

type PageToken = number | "start-gap" | "end-gap";

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number | null;
  hasNextPage: boolean;
  resultWindowLimit?: number;
  loading?: boolean;
  pageSizeOptions?: readonly number[];
  ariaLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function visiblePages(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "end-gap", totalPages - 1, totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, 2, "start-gap", totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "start-gap",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-gap",
    totalPages,
  ];
}

/** Compact, reusable pagination for result lists. */
export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  hasNextPage,
  resultWindowLimit = COMPANY_RESULT_WINDOW_LIMIT,
  loading = false,
  pageSizeOptions = COMPANY_PAGE_SIZE_OPTIONS,
  ariaLabel = "Resultatsidor",
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const id = useId();
  const totalPages =
    totalItems === null
      ? null
      : companyResultPageCount(totalItems, pageSize, resultWindowLimit);
  const normalizedPage =
    totalPages === null
      ? Math.max(1, currentPage)
      : Math.max(1, Math.min(currentPage, totalPages));
  const pageTokens =
    totalPages === null
      ? [normalizedPage]
      : visiblePages(normalizedPage, totalPages);
  const [gotoDraft, setGotoDraft] = useState({ page: normalizedPage, value: "" });
  const gotoValue = gotoDraft.page === normalizedPage ? gotoDraft.value : "";

  function changePage(page: number) {
    const maximum = totalPages ?? Math.max(normalizedPage, page);
    setGotoDraft({ page: normalizedPage, value: "" });
    onPageChange(Math.max(1, Math.min(Math.trunc(page), maximum)));
  }

  function submitGoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gotoValue || totalPages === null) return;
    changePage(Number(gotoValue));
  }

  const canGoBack = normalizedPage > 1;
  const canGoForward =
    totalPages === null ? hasNextPage : normalizedPage < totalPages;

  return (
    <nav
      aria-label={ariaLabel}
      className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-md border border-app-border bg-app-panel px-2.5 py-2 text-xs text-app-text-muted shadow-[var(--app-shadow-panel)]"
    >
      <div className="flex min-h-7 min-w-0 items-center gap-1 sm:min-w-[17rem]">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7 min-w-7 px-1.5"
          disabled={!canGoBack || loading}
          aria-label="Föregående sida"
          onClick={() => changePage(normalizedPage - 1)}
        >
          <MaskedIcon
            src="/icons/utility/down.svg"
            className="h-3.5 w-3.5 rotate-90"
          />
        </Button>

        {pageTokens.map((token) => {
          if (typeof token !== "number") {
            return (
              <span
                key={token}
                aria-hidden="true"
                className="inline-flex h-7 min-w-5 items-center justify-center px-1 text-app-text-subtle"
              >
                …
              </span>
            );
          }

          const active = token === normalizedPage;
          return (
            <button
              key={token}
              type="button"
              disabled={loading}
              aria-current={active ? "page" : undefined}
              aria-label={`Sida ${token}`}
              onClick={() => changePage(token)}
              className={[
                "h-7 min-w-7 rounded-md px-1.5 text-xs font-medium tabular-nums transition disabled:cursor-not-allowed disabled:opacity-50",
                "inline-flex items-center justify-center",
                active
                  ? "border border-app-accent-border bg-app-accent-bg text-app-accent-text"
                  : "text-app-text hover:bg-app-panel-hover",
              ].join(" ")}
            >
              {token.toLocaleString("sv-SE")}
            </button>
          );
        })}

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-7 min-w-7 px-1.5"
          disabled={!canGoForward || loading}
          aria-label="Nästa sida"
          onClick={() => changePage(normalizedPage + 1)}
        >
          <MaskedIcon
            src="/icons/utility/down.svg"
            className="h-3.5 w-3.5 -rotate-90"
          />
        </Button>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        <label className="sr-only" htmlFor={`${id}-page-size`}>
          Resultat per sida
        </label>
        <span className="relative block h-7 w-28 shrink-0">
          <select
            id={`${id}-page-size`}
            value={pageSize}
            disabled={loading}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className={[
              ui.select,
              "h-7 w-full appearance-none py-1 pl-2.5 pr-7 text-center text-xs leading-4 [text-align-last:center]",
            ].join(" ")}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / sida
              </option>
            ))}
          </select>
          <MaskedIcon
            src="/icons/utility/down.svg"
            className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-app-text-subtle"
          />
        </span>

        <form className="flex items-center gap-2" onSubmit={submitGoto}>
          <label htmlFor={`${id}-goto`} className="whitespace-nowrap">
            Gå till
          </label>
          <span className="block w-14 shrink-0">
            <input
              id={`${id}-goto`}
              value={gotoValue}
              disabled={loading || totalPages === null}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Gå till sida"
              min={1}
              max={totalPages ?? undefined}
              placeholder={String(normalizedPage)}
              onChange={(event) => {
                if (/^\d*$/.test(event.target.value)) {
                  setGotoDraft({ page: normalizedPage, value: event.target.value });
                }
              }}
              className={[ui.input, "h-7 px-2 py-1 text-center text-xs tabular-nums"].join(" ")}
            />
          </span>
        </form>
      </div>
    </nav>
  );
}
