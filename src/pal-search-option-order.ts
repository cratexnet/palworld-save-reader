export interface PalSearchOptionOrderValue {
  value: string;
  label: string;
  paldeckNumber?: number | null;
  paldeckCode?: string | null;
}

export function comparePalSearchOptions(
  left: PalSearchOptionOrderValue,
  right: PalSearchOptionOrderValue,
  locale: string,
) {
  const leftIsNumbered = left.paldeckNumber != null;
  const rightIsNumbered = right.paldeckNumber != null;

  if (leftIsNumbered !== rightIsNumbered) return leftIsNumbered ? -1 : 1;

  if (leftIsNumbered && rightIsNumbered) {
    const numberDiff = left.paldeckNumber! - right.paldeckNumber!;
    if (numberDiff !== 0) return numberDiff;

    const codeDiff = (left.paldeckCode ?? "").localeCompare(
      right.paldeckCode ?? "",
      "en",
      { numeric: true },
    );
    if (codeDiff !== 0) return codeDiff;
  }

  const labelDiff = left.label.localeCompare(right.label, locale);
  if (labelDiff !== 0) return labelDiff;
  return left.value.localeCompare(right.value, "en");
}
