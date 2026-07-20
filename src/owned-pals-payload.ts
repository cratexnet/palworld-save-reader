export const PALWORLD_OWNED_PALS_PAYLOAD_VERSION = 1;

export interface CompactOwnedPalRow {
  i: string;
  s: string;
  g?: "M" | "F" | "" | null;
  p?: readonly string[];
  l?: string;
}

export interface CompactOwnedPalsPayload {
  v: typeof PALWORLD_OWNED_PALS_PAYLOAD_VERSION;
  pals: readonly CompactOwnedPalRow[];
}

export function isCompactOwnedPalsPayload(
  value: unknown,
): value is CompactOwnedPalsPayload {
  if (
    !isPlainObject(value) ||
    value.v !== PALWORLD_OWNED_PALS_PAYLOAD_VERSION
  ) {
    return false;
  }
  return Array.isArray(value.pals) && value.pals.every(isCompactOwnedPalRow);
}

function isCompactOwnedPalRow(value: unknown): value is CompactOwnedPalRow {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.i) || !isNonEmptyString(value.s)) return false;
  if (
    value.g !== undefined &&
    value.g !== null &&
    value.g !== "" &&
    value.g !== "M" &&
    value.g !== "F"
  ) {
    return false;
  }
  if (
    value.p !== undefined &&
    (!Array.isArray(value.p) || value.p.some((item) => !isNonEmptyString(item)))
  ) {
    return false;
  }
  return value.l === undefined || typeof value.l === "string";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
