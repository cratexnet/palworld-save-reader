import { describe, expect, it } from "vitest";
import {
  comparePalworldBreedingRoutes,
  summarizePalworldBreedingRoute,
} from "./breeding-route-summary";
import type {
  PalworldBreedingRoute,
  PalworldBreedingRouteComplexity,
  PalworldBreedingRouteRequirement,
} from "./breeding-routes-api-contract";

describe("Palworld breeding route summary", () => {
  it("uses the parents_owned group and backend complexity as the readiness truth", () => {
    const route = routeFixture({
      group: "parents_owned",
      requirements: [],
      complexity: complexityFixture(),
      // Legacy fields may disagree while v4 payloads are being phased out.
      missingPassives: ["CoolTimeReduction_Up_1"],
      implantPassives: ["CoolTimeReduction_Up_1"],
      unavailableParentCount: 3,
    });

    expect(summarizePalworldBreedingRoute(route)).toEqual({
      blockerCount: 0,
      coveredPassiveCount: 2,
      deterministicItemActionCount: 0,
      extraPassiveCount: 0,
      group: "parents_owned",
      implantPassiveCount: 0,
      isComplete: true,
      isExecutable: true,
      missingParentRequirementCount: 0,
      missingPassiveCount: 0,
      sourceCount: 2,
      stepCount: 1,
      unavailableParentCount: 0,
      unresolvedPassiveCount: 0,
    });
  });

  it("keeps deterministic item actions in needs_supplement instead of calling them executable", () => {
    const requirement: PalworldBreedingRouteRequirement = {
      type: "use_item",
      itemId: "passive_implant",
      quantity: 1,
      target: {
        type: "passive",
        passiveId: "CoolTimeReduction_Up_1",
      },
      offers: [
        {
          vendor: "bounty_shop",
          currency: "successful_bounty_token",
          cost: 7,
          sourceUrl: "https://example.test/bounty-shop",
        },
      ],
    };
    const route = routeFixture({
      group: "needs_supplement",
      requirements: [requirement],
      complexity: complexityFixture({
        deterministicItemActionCount: 1,
        blockerCount: 1,
      }),
      missingPassives: [],
      implantPassives: [],
    });

    expect(summarizePalworldBreedingRoute(route)).toMatchObject({
      blockerCount: 1,
      deterministicItemActionCount: 1,
      group: "needs_supplement",
      implantPassiveCount: 1,
      isComplete: false,
      isExecutable: false,
      missingPassiveCount: 1,
      unresolvedPassiveCount: 0,
    });
  });

  it("reports structured missing parent and passive blockers", () => {
    const requirements: PalworldBreedingRouteRequirement[] = [
      {
        type: "missing_parent",
        species: "BlueDragon",
        requiredGender: "Male",
        quantity: 1,
      },
      { type: "missing_passive", passiveId: "Legend" },
    ];
    const route = routeFixture({
      group: "needs_supplement",
      requirements,
      complexity: complexityFixture({
        missingParentRequirementCount: 1,
        unresolvedPassiveCount: 1,
        blockerCount: 2,
      }),
    });

    expect(summarizePalworldBreedingRoute(route)).toMatchObject({
      blockerCount: 2,
      isExecutable: false,
      missingParentRequirementCount: 1,
      missingPassiveCount: 1,
      unavailableParentCount: 1,
      unresolvedPassiveCount: 1,
    });
  });

  it("keeps excluded_by_policy routes non-executable", () => {
    const route = routeFixture({
      group: "excluded_by_policy",
      requirements: [
        {
          type: "missing_parent",
          species: "BlueDragon",
          requiredGender: "Any",
          quantity: 1,
        },
      ],
      complexity: complexityFixture({
        plannedStageCount: 4,
        missingParentRequirementCount: 1,
        blockerCount: 1,
      }),
    });

    expect(summarizePalworldBreedingRoute(route)).toMatchObject({
      group: "excluded_by_policy",
      isComplete: false,
      isExecutable: false,
      stepCount: 4,
    });
  });

  it("keeps formula routes ready without inventory requirements", () => {
    const route = routeFixture({
      group: "formula",
      requirements: [],
      complexity: complexityFixture({ plannedStageCount: 2 }),
      missingPassives: ["Legend"],
      unavailableParentCount: 2,
    });

    expect(summarizePalworldBreedingRoute(route)).toMatchObject({
      blockerCount: 0,
      group: "formula",
      isComplete: true,
      isExecutable: true,
      stepCount: 2,
    });
  });

  it("sorts by route group and blocker count before stable tie-breakers", () => {
    const owned = routeFixture({
      group: "parents_owned",
      requirements: [],
      complexity: complexityFixture({ plannedStageCount: 3 }),
    });
    const oneSupplement = routeFixture({
      group: "needs_supplement",
      requirements: [{ type: "missing_passive", passiveId: "MoveSpeed_up_3" }],
      complexity: complexityFixture({
        unresolvedPassiveCount: 1,
        blockerCount: 1,
      }),
    });
    const twoSupplements = routeFixture({
      group: "needs_supplement",
      requirements: [
        { type: "missing_passive", passiveId: "MoveSpeed_up_3" },
        { type: "missing_passive", passiveId: "Legend" },
      ],
      complexity: complexityFixture({
        unresolvedPassiveCount: 2,
        blockerCount: 2,
      }),
      steps: [],
    });
    const excluded = routeFixture({
      group: "excluded_by_policy",
      requirements: [],
      complexity: complexityFixture(),
    });

    expect(
      [excluded, twoSupplements, owned, oneSupplement].sort(
        comparePalworldBreedingRoutes,
      ),
    ).toEqual([owned, oneSupplement, twoSupplements, excluded]);
  });

  it("uses planned stages, acquisition difficulty, passive noise, and source count as stable tie-breakers", () => {
    const easiest = routeFixture({
      complexity: complexityFixture({
        acquisitionDifficulty: {
          specialParentCount: 0,
          highestMinimumWildLevel: 8,
          totalMinimumWildLevel: 12,
          totalRarity: 3,
        },
      }),
      extraPassiveCount: 0,
      sources: [sourceFixture("a"), sourceFixture("b")],
    });
    const extraSource = routeFixture({
      complexity: complexityFixture({
        acquisitionDifficulty: {
          specialParentCount: 0,
          highestMinimumWildLevel: 8,
          totalMinimumWildLevel: 12,
          totalRarity: 3,
        },
      }),
      extraPassiveCount: 0,
      sources: [sourceFixture("a"), sourceFixture("b"), sourceFixture("c")],
    });
    const noisier = routeFixture({
      complexity: complexityFixture({
        acquisitionDifficulty: {
          specialParentCount: 0,
          highestMinimumWildLevel: 8,
          totalMinimumWildLevel: 12,
          totalRarity: 3,
        },
      }),
      extraPassiveCount: 1,
    });
    const harder = routeFixture({
      complexity: complexityFixture({
        acquisitionDifficulty: {
          specialParentCount: 1,
          highestMinimumWildLevel: 0,
          totalMinimumWildLevel: 0,
          totalRarity: 1,
        },
      }),
      extraPassiveCount: 0,
    });

    expect(
      [harder, noisier, extraSource, easiest].sort(
        comparePalworldBreedingRoutes,
      ),
    ).toEqual([easiest, extraSource, noisier, harder]);
  });
});

function routeFixture(
  overrides: Partial<PalworldBreedingRoute> = {},
): PalworldBreedingRoute {
  return {
    target: "Anubis",
    depth: 1,
    passiveCoverage: ["Legend", "MoveSpeed_up_3"],
    missingPassives: [],
    implantPassives: [],
    extraPassiveCount: 0,
    unavailableParentCount: 0,
    sources: [sourceFixture("a"), sourceFixture("b")],
    steps: [stepFixture("Anubis", "BlueDragon", "BirdDragon")],
    requirements: [],
    complexity: complexityFixture(),
    group: "parents_owned",
    ...overrides,
  };
}

function complexityFixture(
  overrides: Partial<PalworldBreedingRouteComplexity> = {},
): PalworldBreedingRouteComplexity {
  return {
    plannedStageCount: 1,
    missingParentRequirementCount: 0,
    unresolvedPassiveCount: 0,
    deterministicItemActionCount: 0,
    blockerCount: 0,
    ...overrides,
  };
}

function stepFixture(child: string, parent1: string, parent2: string) {
  return {
    child,
    parent1: {
      species: parent1,
      requiredGender: "Any" as const,
      availability: "owned" as const,
    },
    parent2: {
      species: parent2,
      requiredGender: "Any" as const,
      availability: "owned" as const,
    },
  };
}

function sourceFixture(id: string): PalworldBreedingRoute["sources"][number] {
  return {
    id,
    species: id === "a" ? "BlueDragon" : "BirdDragon",
    gender: id === "a" ? "Male" : "Female",
    passiveIds: id === "a" ? ["Legend"] : ["MoveSpeed_up_3"],
  };
}
