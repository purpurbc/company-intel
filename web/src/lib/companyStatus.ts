export type StatusTone = "positive" | "warning" | "danger" | "neutral";

export const COMPANY_STATUS_OPTIONS = [
  { value: "1", label: "Är verksam" },
  { value: "9", label: "Är ej längre verksam" },
  { value: "0", label: "Har aldrig varit verksam" },
];

export const COMPANY_STATE_OPTIONS = [
  { value: "0", label: "Normalläge" },
  { value: "11", label: "Ackordsförhandling inledd" },
  { value: "12", label: "Ackordsförhandling upphör" },
  { value: "13", label: "Ackordsförhandling upphävd av domstol" },
  { value: "20", label: "Konkurs inledd" },
  { value: "21", label: "Konkurs avslutad" },
  { value: "22", label: "Konkurs avslutad med överskott" },
  { value: "24", label: "Konkurs upphävd av rätt" },
  { value: "31", label: "Likvidation avslutad" },
  { value: "32", label: "Likvidation beslutad" },
  { value: "33", label: "Likvidation fortsätter" },
  { value: "34", label: "Likvidation upphör, verksamheten återupptas" },
  { value: "35", label: "Likvidation upphävd av domstol" },
  { value: "36", label: "Bolaget avfört enl 13 kap 18 § ABL" },
  { value: "37", label: "Bolaget är avfört" },
  { value: "40", label: "Fusion inledd" },
  { value: "41", label: "Upplöst genom fusion" },
  { value: "45", label: "Fusion tillåten" },
  { value: "49", label: "Fusion pågår" },
  { value: "50", label: "Avförd enligt 17§ handelsregisterlagen" },
  { value: "51", label: "Avförd" },
  { value: "52", label: "Avregistrerad" },
  { value: "53", label: "Avregistrerad pga ny innehavare" },
  { value: "54", label: "Avförd pga fusion med utländskt företag" },
  { value: "60", label: "Avförd pga utländskt företags Likvidation/Konkurs" },
  { value: "61", label: "Avförd, verksamheten har upphört" },
  { value: "62", label: "Avförd, filialen saknar verkställande direktör" },
  { value: "63", label: "Avförd, enligt domstolsbeslut" },
  { value: "64", label: "Avförd, årsredovisning saknas" },
  { value: "70", label: "Bolaget avfört på egen begäran" },
  { value: "71", label: "Bolaget avfört av Bolagsverket" },
  { value: "73", label: "Avförd" },
  { value: "74", label: "Avförd, omregistrerat till Bankaktiebolag" },
  { value: "75", label: "Beslut om ombildning" },
  { value: "76", label: "Tillstånd till ombildning" },
  { value: "77", label: "Avregistrerad pga ombildning" },
  { value: "78", label: "Ombildning förfallen" },
  { value: "80", label: "Företagsrekonstruktion inledd" },
  { value: "81", label: "Företagsrekonstruktion upphörd" },
  { value: "82", label: "Företagsrekonstruktion upphävd av domstol" },
  { value: "85", label: "Resolution inledd" },
  { value: "86", label: "Resolution avslutad" },
  { value: "87", label: "Resolution upphävd" },
  { value: "90", label: "Delning pågår" },
  { value: "91", label: "Upplöst genom delning" },
  { value: "99", label: "Övertagande av annat bolag pågår" },
];

export function companyStatusLabel(
  code?: string | null,
  label?: string | null,
) {
  if (label?.trim()) return label;
  return (
    COMPANY_STATUS_OPTIONS.find((option) => option.value === code)?.label ??
    "Status saknas"
  );
}

export function companyStatusTone(code?: string | null): StatusTone {
  if (code === "1") return "positive";
  if (code === "9") return "danger";
  if (code === "0") return "warning";
  return "neutral";
}

export function companyStateTone(code?: string | null): StatusTone {
  if (!code) return "neutral";
  if (code === "0") return "positive";
  return "danger";
}

export function marketingTone(code?: string | null): StatusTone {
  if (!code) return "neutral";
  if (["11", "12", "13"].includes(code)) return "positive";
  if (["21", "22", "23"].includes(code)) return "warning";
  return "neutral";
}

export function statusToneClass(tone: StatusTone) {
  if (tone === "positive") {
    return "border-app-accent-border bg-app-accent-bg text-app-accent-text";
  }
  if (tone === "warning") {
    return "border-app-warning-border bg-app-warning-bg text-app-warning-text";
  }
  if (tone === "danger") {
    return "border-app-danger-border bg-app-danger-bg text-app-danger-text";
  }
  return "border-app-border-strong bg-app-panel-soft text-app-text-muted";
}
