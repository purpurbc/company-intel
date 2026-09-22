const PRODUCT_TIMEZONE = "Europe/Stockholm";

function stockholmDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PRODUCT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function companyAgeLabel(
  startDate: string | null,
  now: Date = new Date(),
) {
  const match = startDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const today = stockholmDateParts(now);
  const currentYear = Number(today.year);
  const currentMonth = Number(today.month);
  const currentDay = Number(today.day);
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) age -= 1;

  if (age < 1) return "Under 1 år";
  if (age === 1) return "1 år";
  return `${age} år`;
}
