import type { PalworldExtractedInventoryRow } from "./extracted-inventory-payload";

const REQUIRED_COLUMNS = ["instance_id", "character_id"] as const;

export function parsePalworldOwnedPalsCsv(
  csv: string,
): PalworldExtractedInventoryRow[] {
  const rows = parseCsvRows(csv.replace(/^\uFEFF/, ""));
  if (rows.length === 0) return [];

  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  const columns = new Map(headers.map((header, index) => [header, index]));
  for (const column of REQUIRED_COLUMNS) {
    if (!columns.has(column)) {
      throw new Error(`CSV is missing required column: ${column}.`);
    }
  }

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => ({
      instanceId: getCell(row, columns, "instance_id"),
      characterId: getCell(row, columns, "character_id"),
      gender: getCell(row, columns, "gender"),
      passiveIds: getCell(row, columns, "passive_ids"),
      slotIndex: getCell(row, columns, "slot_index"),
    }));
}

function getCell(
  row: readonly string[],
  columns: Map<string, number>,
  key: string,
) {
  const index = columns.get(key);
  if (index == null) return "";
  return row[index] ?? "";
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}
