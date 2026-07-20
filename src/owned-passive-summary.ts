import type { CompactOwnedPalsPayload } from "./owned-pals-payload";

export interface PalworldOwnedPassiveSummaryItem {
  id: string;
  count: number;
}

export function summarizePalworldOwnedPassiveSkills(
  payload: CompactOwnedPalsPayload,
  options: { limit?: number; priorityIds?: readonly string[] } = {},
): PalworldOwnedPassiveSummaryItem[] {
  const counts = new Map<string, number>();
  const priorityIndex = new Map(
    (options.priorityIds ?? []).map((id, index) => [id, index]),
  );

  for (const pal of payload.pals) {
    const uniquePassiveIds = new Set(
      (pal.p ?? []).map((passiveId) => passiveId.trim()).filter(Boolean),
    );
    for (const passiveId of uniquePassiveIds) {
      counts.set(passiveId, (counts.get(passiveId) ?? 0) + 1);
    }
  }

  const items = Array.from(counts, ([id, count]) => ({ id, count })).sort(
    (left, right) =>
      comparePriority(left.id, right.id, priorityIndex) ||
      right.count - left.count ||
      left.id.localeCompare(right.id),
  );

  return options.limit == null ? items : items.slice(0, options.limit);
}

function comparePriority(
  leftId: string,
  rightId: string,
  priorityIndex: ReadonlyMap<string, number>,
) {
  const leftPriority = priorityIndex.get(leftId);
  const rightPriority = priorityIndex.get(rightId);
  if (leftPriority == null && rightPriority == null) return 0;
  if (leftPriority == null) return 1;
  if (rightPriority == null) return -1;
  return leftPriority - rightPriority;
}
