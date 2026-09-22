export type StatusTone = "positive" | "warning" | "danger" | "brown" | "neutral";

export function statusToneClass(tone: StatusTone) {
  if (tone === "positive") {
    return "bg-app-positive-bg text-app-positive-text";
  }
  if (tone === "warning") {
    return "bg-app-warning-bg text-app-warning-text";
  }
  if (tone === "danger") {
    return "bg-app-danger-bg text-app-danger-text";
  }
  if (tone === "brown") {
    return "bg-app-brown-bg text-app-brown-text";
  }
  return "bg-app-info-bg text-app-info-text";
}
