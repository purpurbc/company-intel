export const COMPANY_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 150] as const;
export const COMPANY_RESULT_WINDOW_LIMIT = 10_000;
export const COMPANY_MAX_PAGES = 1_000;

export type CompanyPageSize = (typeof COMPANY_PAGE_SIZE_OPTIONS)[number];

export function isCompanyPageSize(value: unknown): value is CompanyPageSize {
  return (
    typeof value === "number" &&
    COMPANY_PAGE_SIZE_OPTIONS.includes(value as CompanyPageSize)
  );
}

export function companyResultPageCount(
  totalItems: number,
  pageSize: number,
  resultWindowLimit = COMPANY_RESULT_WINDOW_LIMIT,
) {
  const accessibleItems = Math.min(
    Math.max(0, totalItems),
    Math.max(1, resultWindowLimit),
  );
  return Math.min(
    COMPANY_MAX_PAGES,
    Math.max(1, Math.ceil(accessibleItems / pageSize)),
  );
}
