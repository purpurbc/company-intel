function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

function readableCase(value: string | null | undefined) {
  const text = clean(value);
  if (!text) return null;
  if (text !== text.toLocaleUpperCase("sv-SE")) return text;

  const lower = text.toLocaleLowerCase("sv-SE");
  return lower.charAt(0).toLocaleUpperCase("sv-SE") + lower.slice(1);
}

export function formatSwedishPostalCode(value: string | null | undefined) {
  const text = clean(value);
  if (!text) return null;
  const digits = text.replace(/\s/g, "");
  return /^\d{5}$/.test(digits)
    ? `${digits.slice(0, 3)} ${digits.slice(3)}`
    : text;
}

export function formatPostalAddress({
  careOf,
  street,
  postalCode,
  city,
}: {
  careOf?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
}) {
  const careOfName = clean(careOf)?.replace(/^c\s*\/\s*o\s*/i, "");
  const locality = [
    formatSwedishPostalCode(postalCode),
    readableCase(city),
  ]
    .filter(Boolean)
    .join(" ");

  return [
    careOfName ? `c/o ${careOfName}` : null,
    readableCase(street),
    locality || null,
  ]
    .filter(Boolean)
    .join(", ");
}
