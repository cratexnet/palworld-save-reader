export type PassiveSkillTier =
  "negative" | "neutral" | "rank1" | "rank2Or3" | "rank4" | "rank5";

export type PassiveSkillGroup =
  "worldTree" | "prismatic" | "gold" | "common" | "negative";

export interface PassiveSkillPresentation {
  tier: PassiveSkillTier;
  backgroundAsset: string;
  reducedMotionBackgroundAsset: string;
}

const PASSIVE_SKILL_BACKGROUND_ASSETS = [
  "passive-rank-neg3-normal.webp",
  "passive-rank-neg2-normal.webp",
  "passive-rank-neg1-normal.webp",
  "passive-rank-0-normal.webp",
  "passive-rank-1-normal.webp",
  "passive-rank-2-normal.webp",
  "passive-rank-3-normal.webp",
  "passive-rank-4-normal.webp",
  "passive-rank-5-normal.webp",
] as const;

export function createPassiveSkillEffectExcerpt(
  description: string | undefined,
  query: string,
) {
  const lines = String(description ?? "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingIndex = normalizedQuery
    ? lines.findIndex((line) =>
        line.toLocaleLowerCase().includes(normalizedQuery),
      )
    : -1;

  if (matchingIndex <= 0) return lines.slice(0, 2).join("\n");
  return [
    lines[matchingIndex],
    ...lines.slice(0, matchingIndex),
    ...lines.slice(matchingIndex + 1),
  ]
    .slice(0, 2)
    .join("\n");
}

export function resolvePassiveSkillGroup(rank: number): PassiveSkillGroup {
  const normalizedRank = Number.isFinite(rank) ? Math.trunc(rank) : 0;
  if (normalizedRank >= 5) return "worldTree";
  if (normalizedRank >= 4) return "prismatic";
  if (normalizedRank >= 2) return "gold";
  if (normalizedRank >= 0) return "common";
  return "negative";
}

export function resolvePassiveSkillPresentation(
  rank: number,
): PassiveSkillPresentation {
  const normalizedRank = Number.isFinite(rank) ? Math.trunc(rank) : 0;
  const assetRank = Math.min(5, Math.max(-3, normalizedRank));
  const backgroundAsset = PASSIVE_SKILL_BACKGROUND_ASSETS[assetRank + 3];
  const reducedMotionBackgroundAsset =
    assetRank === 4
      ? "passive-rank-4-normal-static.png"
      : assetRank === 5
        ? "passive-rank-5-normal-static.png"
        : backgroundAsset;

  if (assetRank < 0) {
    return { tier: "negative", backgroundAsset, reducedMotionBackgroundAsset };
  }
  if (assetRank >= 5) {
    return { tier: "rank5", backgroundAsset, reducedMotionBackgroundAsset };
  }
  if (assetRank >= 4) {
    return { tier: "rank4", backgroundAsset, reducedMotionBackgroundAsset };
  }
  if (assetRank >= 2) {
    return {
      tier: "rank2Or3",
      backgroundAsset,
      reducedMotionBackgroundAsset,
    };
  }
  if (assetRank >= 1) {
    return { tier: "rank1", backgroundAsset, reducedMotionBackgroundAsset };
  }
  return { tier: "neutral", backgroundAsset, reducedMotionBackgroundAsset };
}
