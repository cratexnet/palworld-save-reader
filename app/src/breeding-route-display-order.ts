import type {
  PalworldBreedingRouteParent,
  PalworldBreedingStep,
} from "../../src/breeding-routes-api-contract";

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
