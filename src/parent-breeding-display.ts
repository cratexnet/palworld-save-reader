import type { PalworldParentBreedingOutcome } from "./breeding-routes-api-contract";

export function dedupeParentBreedingOutcomes(
  outcomes: readonly PalworldParentBreedingOutcome[],
) {
  const seen = new Set<string>();
  return outcomes.filter((outcome) => {
    const key = [
      outcome.parentSpecies,
      outcome.partnerSpecies,
      outcome.child,
    ].join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
