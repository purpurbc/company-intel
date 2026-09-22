export type NumericRange = [number, number];

export type NumericFilterBucket = {
  value: string;
  label: string;
  min: number;
  max: number;
};

export const EMPLOYEE_BUCKETS: NumericFilterBucket[] = [
  { value: "1", label: "0 anställda", min: 0, max: 0 },
  { value: "2", label: "1–4 anställda", min: 1, max: 4 },
  { value: "3", label: "5–9 anställda", min: 5, max: 9 },
  { value: "4", label: "10–19 anställda", min: 10, max: 19 },
  { value: "5", label: "20–49 anställda", min: 20, max: 49 },
  { value: "6", label: "50–99 anställda", min: 50, max: 99 },
  { value: "7", label: "100–199 anställda", min: 100, max: 199 },
  { value: "8", label: "200–499 anställda", min: 200, max: 499 },
  { value: "9", label: "500–999 anställda", min: 500, max: 999 },
  { value: "10", label: "1 000–1 499 anställda", min: 1000, max: 1499 },
  { value: "11", label: "1 500–1 999 anställda", min: 1500, max: 1999 },
  { value: "12", label: "2 000–2 999 anställda", min: 2000, max: 2999 },
  { value: "13", label: "3 000–3 999 anställda", min: 3000, max: 3999 },
  { value: "14", label: "4 000–4 999 anställda", min: 4000, max: 4999 },
  { value: "15", label: "5 000–9 999 anställda", min: 5000, max: 9999 },
  { value: "16", label: "10 000+ anställda", min: 10000, max: 10000 },
];

export const TURNOVER_BUCKETS: NumericFilterBucket[] = [
  { value: "0", label: "< 1 tkr", min: 0, max: 0 },
  { value: "1", label: "1–499 tkr", min: 1, max: 499 },
  { value: "2", label: "500–999 tkr", min: 500, max: 999 },
  { value: "3", label: "1 000–4 999 tkr", min: 1000, max: 4999 },
  { value: "4", label: "5 000–9 999 tkr", min: 5000, max: 9999 },
  { value: "5", label: "10 000–19 999 tkr", min: 10000, max: 19999 },
  { value: "6", label: "20 000–49 999 tkr", min: 20000, max: 49999 },
  { value: "7", label: "50 000–99 999 tkr", min: 50000, max: 99999 },
  { value: "8", label: "100 000–499 999 tkr", min: 100000, max: 499999 },
  { value: "9", label: "500 000–999 999 tkr", min: 500000, max: 999999 },
  {
    value: "10",
    label: "1 000 000–4 999 999 tkr",
    min: 1000000,
    max: 4999999,
  },
  {
    value: "11",
    label: "5 000 000–9 999 999 tkr",
    min: 5000000,
    max: 9999999,
  },
  {
    value: "12",
    label: "10 000 000+ tkr",
    min: 10000000,
    max: 10000000,
  },
];

export const EMPLOYEE_RANGE: NumericRange = [0, 10000];
export const TURNOVER_RANGE: NumericRange = [0, 10000000];
export const AGE_RANGE: NumericRange = [0, 100];

/**
 * SCB provides employees and turnover as classes rather than exact values.
 * The interval UI therefore keeps the user's exact bounds locally while the
 * query selects every source class that overlaps them. Search results still
 * follow the precision of the underlying source classes.
 */
export function bucketValuesForNumericRange(
  buckets: NumericFilterBucket[],
  [rangeMin, rangeMax]: NumericRange,
) {
  return buckets
    .filter((bucket) => bucket.max >= rangeMin && bucket.min <= rangeMax)
    .map((bucket) => bucket.value);
}

export function numericRangeFromSelectedBuckets(
  buckets: NumericFilterBucket[],
  selectedValues: string[],
  fallback: NumericRange,
): NumericRange {
  const selected = buckets.filter((bucket) =>
    selectedValues.includes(bucket.value),
  );

  if (selected.length === 0) return fallback;

  return [
    Math.min(...selected.map((bucket) => bucket.min)),
    Math.max(...selected.map((bucket) => bucket.max)),
  ];
}

export function isFullNumericRange(
  range: NumericRange,
  fullRange: NumericRange,
) {
  return range[0] <= fullRange[0] && range[1] >= fullRange[1];
}
