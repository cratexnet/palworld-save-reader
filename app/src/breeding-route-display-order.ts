import type {
  PalworldBreedingRouteParent,
  PalworldBreedingStep,
} from "../../src/breeding-routes-api-contract";

export function selectRecommendedRoutesForDisplay<T>(
  mode: "formula" | "inventory" | null | undefined,
  routes: readonly T[] | null | undefined,
  recommendedIndexes: readonly number[] | null | undefined,
): T[] {
  if (mode !== "inventory") return [];

  const recommendedIndex = recommendedIndexes?.[0];
  if (recommendedIndex === undefined) return [];

  const recommendedRoute = routes?.[recommendedIndex];
  return recommendedRoute === undefined ? [] : [recommendedRoute];
}

export function orderBreedingStepParentsForDisplay(
  step: PalworldBreedingStep,
  preferredParentSpecies: string | null | undefined,
): readonly [PalworldBreedingRouteParent, PalworldBreedingRouteParent] {
  if (
    preferredParentSpecies &&
    step.parent1.species !== preferredParentSpecies &&
    step.parent2.species === preferredParentSpecies
  ) {
    return [step.parent2, step.parent1];
  }

  return [step.parent1, step.parent2];
}
