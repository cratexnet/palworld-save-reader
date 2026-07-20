export interface ResultsSearchEntry {
  text: readonly (string | null | undefined)[];
  paldeckCodes: readonly (string | null | undefined)[];
}

export function normalizeResultsSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function normalizePaldeckSearchCode(value: string): string | null {
  const normalized = normalizeResultsSearchText(value);
  const match = /^(?:no\.?\s*)?(\d+)([a-z]?)$/u.exec(normalized);
  if (!match) return null;

  const digits = match[1].replace(/^0+(?=\d)/u, "");
  return `${digits}${match[2]}`;
}

export function matchesResultsSearch(
  entry: ResultsSearchEntry,
  query: string,
): boolean {
  const normalizedQuery = normalizeResultsSearchText(query);
  if (!normalizedQuery) return true;

  const paldeckQuery = normalizePaldeckSearchCode(normalizedQuery);
  if (paldeckQuery) {
    return entry.paldeckCodes.some(
      (code) =>
        typeof code === "string" &&
        normalizePaldeckSearchCode(code) === paldeckQuery,
    );
  }

  return entry.text.some(
    (value) =>
      typeof value === "string" &&
      normalizeResultsSearchText(value).includes(normalizedQuery),
  );
}
