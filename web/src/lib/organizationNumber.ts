/** Formats Swedish 10-digit organization and personal identity numbers as XXXXXX-XXXX. */
export function formatOrganizationNumber(
  value: string | null | undefined,
): string {
  if (!value) return "-";

  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;

  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

/** Clipboard/API-safe representation without visual separators. */
export function organizationNumberDigits(
  value: string | null | undefined,
): string {
  return value?.replace(/\D/g, "") ?? "";
}
