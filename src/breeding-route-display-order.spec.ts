import { describe, expect, it } from "vitest";
import { orderBreedingStepParentsForDisplay } from "../app/src/breeding-route-display-order";
import type {
  PalworldBreedingRouteParent,
  PalworldBreedingStep,
} from "./breeding-routes-api-contract";

function parent(species: string): PalworldBreedingRouteParent {
  return {
    species,
    requiredGender: "Any",
    availability: "unknown",
  };
}

function step(parent1: string, parent2: string): PalworldBreedingStep {
  return {
    child: "FeatherOstrich",
    parent1: parent(parent1),
    parent2: parent(parent2),
  };
}

describe("breeding route display order", () => {
  it("places the selected starting species before its first partner", () => {
    const routeStep = step("GrassMammoth", "SheepBall");

    const [firstParent, secondParent] = orderBreedingStepParentsForDisplay(
      routeStep,
      "SheepBall",
    );

    expect(firstParent.species).toBe("SheepBall");
    expect(secondParent.species).toBe("GrassMammoth");
    expect(routeStep.parent1.species).toBe("GrassMammoth");
    expect(routeStep.parent2.species).toBe("SheepBall");
  });

  it("preserves the route order when the preferred species is absent", () => {
    const routeStep = step("GrassMammoth", "SheepBall");

    const [firstParent, secondParent] = orderBreedingStepParentsForDisplay(
      routeStep,
      "Lamball",
    );

    expect(firstParent.species).toBe("GrassMammoth");
    expect(secondParent.species).toBe("SheepBall");
  });
});
