import { describe, expect, it } from "vitest";
import {
  createPalworldFormulaRouteSignature,
  createPalworldRouteChildChainSignature,
  createPalworldRouteExecutionSignature,
} from "./breeding-route-identity";
import type { PalworldBreedingRoute } from "./breeding-routes-api-contract";

describe("Palworld formula route identity", () => {
  it("ignores parent order, inventory identity, availability, and passive sources", () => {
    const left = route([
      step("C", parent("A", "Male", "owned", "save-a"), parent("B")),
    ]);
    const right = route(
      [step("C", parent("B", "Any", "missing"), parent("A", "Male"))],
      ["save-b"],
    );

    expect(createPalworldFormulaRouteSignature(left)).toBe(
      createPalworldFormulaRouteSignature(right),
    );
  });

  it("keeps gender assignments and the ordered child chain distinct", () => {
    const maleA = route([
      step("C", parent("A", "Male"), parent("B", "Female")),
    ]);
    const femaleA = route([
      step("C", parent("A", "Female"), parent("B", "Male")),
    ]);
    const differentChain = route([
      step("D", parent("A", "Male"), parent("B", "Female")),
      step("C", parent("D"), parent("E")),
    ]);

    expect(createPalworldFormulaRouteSignature(maleA)).not.toBe(
      createPalworldFormulaRouteSignature(femaleA),
    );
    expect(createPalworldFormulaRouteSignature(maleA)).not.toBe(
      createPalworldFormulaRouteSignature(differentChain),
    );
    expect(createPalworldRouteChildChainSignature(differentChain)).toBe("D>C");
  });
});

describe("Palworld route execution identity", () => {
  it("normalizes parent, passive, and requirement ordering without using source identity", () => {
    const left = {
      ...route(
        [step("C", parent("A", "Male", "owned", "save-a"), parent("B"))],
        ["save-a"],
      ),
      passiveCoverage: ["Y", "X"],
      missingPassives: ["Z"],
      requirements: [
        { type: "missing_passive", passiveId: "Z" },
        {
          type: "missing_parent",
          species: "D",
          requiredGender: "Female",
          quantity: 1,
        },
      ],
    } satisfies PalworldBreedingRoute;
    const right = {
      ...left,
      sources: [
        {
          id: "save-b",
          species: "A",
          gender: "",
          passiveIds: ["save-b"],
        },
      ],
      steps: [step("C", parent("B"), parent("A", "Male", "owned", "save-b"))],
      passiveCoverage: ["X", "Y"],
      requirements: [...left.requirements].reverse(),
    } satisfies PalworldBreedingRoute;

    expect(createPalworldRouteExecutionSignature(left)).toBe(
      createPalworldRouteExecutionSignature(right),
    );
  });

  it("distinguishes passive requirements and visible execution complexity", () => {
    const base = route([step("C", parent("A"), parent("B"))]);
    const missingX = {
      ...base,
      missingPassives: ["X"],
      requirements: [{ type: "missing_passive", passiveId: "X" }],
    } satisfies PalworldBreedingRoute;
    const missingY = {
      ...base,
      missingPassives: ["Y"],
      requirements: [{ type: "missing_passive", passiveId: "Y" }],
    } satisfies PalworldBreedingRoute;
    const extraAction = {
      ...missingX,
      complexity: {
        ...missingX.complexity,
        deterministicItemActionCount: 1,
      },
    };

    expect(createPalworldRouteExecutionSignature(missingX)).not.toBe(
      createPalworldRouteExecutionSignature(missingY),
    );
    expect(createPalworldRouteExecutionSignature(missingX)).not.toBe(
      createPalworldRouteExecutionSignature(extraAction),
    );
  });

  it("normalizes reversal targets with parent order", () => {
    const base = route([step("C", parent("A", "Male"), parent("B", "Female"))]);
    const reversal = {
      ...base,
      requirements: [genderReverseRequirement(0, 1, "A", "Male")],
    } satisfies PalworldBreedingRoute;
    const swapped = {
      ...reversal,
      steps: [step("C", parent("B", "Female"), parent("A", "Male"))],
      requirements: [genderReverseRequirement(0, 2, "A", "Male")],
    } satisfies PalworldBreedingRoute;

    expect(createPalworldRouteExecutionSignature(reversal)).toBe(
      createPalworldRouteExecutionSignature(swapped),
    );
  });
});

function parent(
  species: string,
  requiredGender: "Any" | "Male" | "Female" = "Any",
  availability: "owned" | "missing" | "intermediate" = "intermediate",
  sourceId?: string,
) {
  return { species, requiredGender, availability, sourceId } as const;
}

function step(
  child: string,
  parent1: ReturnType<typeof parent>,
  parent2: ReturnType<typeof parent>,
) {
  return { child, parent1, parent2 };
}

function genderReverseRequirement(
  stepIndex: number,
  parentPosition: 1 | 2,
  species: string,
  requiredGender: "Any" | "Male" | "Female",
) {
  return {
    type: "use_item",
    itemId: "PalGenderReverse",
    quantity: 1,
    target: {
      type: "parent",
      stepIndex,
      parentPosition,
      species,
      requiredGender,
    },
    offers: [
      {
        vendor: "bounty_shop",
        currency: "successful_bounty_token",
        cost: 5,
        sourceUrl: "https://example.com",
      },
    ],
  } as const;
}

function route(
  steps: PalworldBreedingRoute["steps"],
  sourceIds: readonly string[] = [],
): PalworldBreedingRoute {
  return {
    target: steps.at(-1)?.child ?? "",
    depth: steps.length,
    passiveCoverage: sourceIds,
    missingPassives: [],
    extraPassiveCount: 0,
    unavailableParentCount: 0,
    requirements: [],
    complexity: {
      plannedStageCount: steps.length,
      missingParentRequirementCount: 0,
      unresolvedPassiveCount: 0,
      deterministicItemActionCount: 0,
      blockerCount: 0,
    },
    group: "formula",
    sources: sourceIds.map((id) => ({
      id,
      species: "A",
      gender: "",
      passiveIds: [id],
    })),
    steps,
  };
}
