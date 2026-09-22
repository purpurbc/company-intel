type CompanyNameInput = {
  entity_type?: "organization" | "person" | "other" | null;
  company_name?: string | null;
  registered_name?: string | null;
  matched_name?: string | null;
};

function cleanName(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeName(value: string | null | undefined) {
  return cleanName(value)?.toLocaleLowerCase("sv-SE") ?? "";
}

export function personNameFirst(value: string | null | undefined) {
  const name = cleanName(value);
  if (!name) return null;

  const [lastName, ...rest] = name.split(",").map((part) => part.trim());
  const firstNames = rest.join(" ");
  if (!lastName || !firstNames) return name;

  return `${firstNames} ${lastName}`;
}

export function companyDisplayName(company: CompanyNameInput) {
  const companyName = cleanName(company.company_name);
  const registeredName = cleanName(company.registered_name);
  const matchedName = cleanName(company.matched_name);

  if (company.entity_type === "person") {
    const personName = personNameFirst(companyName ?? registeredName);
    const hasSeparateBusinessName =
      registeredName &&
      companyName &&
      normalizeName(registeredName) !== normalizeName(companyName);

    return {
      primary: personName ?? companyName ?? registeredName ?? "-",
      secondary: hasSeparateBusinessName ? registeredName : null,
    };
  }

  return {
    primary: companyName ?? registeredName ?? matchedName ?? "-",
    secondary: null,
  };
}
