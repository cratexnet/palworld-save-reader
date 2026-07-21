import { describe, expect, it } from "vitest";
import { parsePalworldBreedingRoutesResponse } from "./breeding-routes-response";

const validResponse = {
  v: 7,
  payloadVersion: 1,
  dataVersion: "test",
  targetSpecies: "Anubis",
  startingSpecies: null,
  desiredPassiveIds: [],
  desiredPassiveAcquisitions: [],
  inventoryCount: 1,
  routes: [
    {
      target: "Anubis",
      depth: 1,
      passiveCoverage: [],
      missingPassives: [],
      implantPassives: [],
      extraPassiveCount: 0,
      unavailableParentCount: 0,
      sources: [],
      steps: [
        {
          child: "Anubis",
          parent1: {
            species: "A",
            requiredGender: "Any",
            availability: "unknown",
          },
          parent2: {
            species: "B",
            requiredGender: "Any",
            availability: "unknown",
          },
        },
      ],
      requirements: [],
      complexity: {
        plannedStageCount: 1,
        missingParentRequirementCount: 0,
        unresolvedPassiveCount: 0,
        deterministicItemActionCount: 0,
        blockerCount: 0,
      },
      group: "formula",
    },
  ],
  recommendedRouteIndexes: [0],
  directRouteIndexes: [0],
  routesByDepth: { depth1: [0], depth2: [], depth3: [] },
  routesByGroup: {
    formula: [0],
    parentsOwned: [],
    needsSupplement: [],
    excludedByPolicy: [],
  },
  ownedTargetSources: [],
  searchMeta: {
    domainMaxDepth: 3,
    searchComplete: true,
    stopReason: null,
    consideredRouteCount: 1,
    returnedRouteCount: 1,
    excludedByPolicyCount: 0,
    routeLimit: 50,
    hasMoreRoutes: false,
  },
};

const validInventoryResponse = {
  ...validResponse,
  inventoryCount: 100,
  routes: [
    {
      ...validResponse.routes[0],
      sources: [
        {
          id: "primary-a",
          species: "A",
          gender: "Male",
          passiveIds: [],
        },
        {
          id: "primary-b",
          species: "B",
          gender: "Female",
          passiveIds: [],
        },
      ],
      steps: [
        {
          child: "Anubis",
          parent1: {
            species: "A",
            requiredGender: "Any",
            availability: "owned",
            sourceId: "primary-a",
          },
          parent2: {
            species: "B",
            requiredGender: "Any",
            availability: "owned",
            sourceId: "primary-b",
          },
        },
      ],
      group: "parents_owned",
    },
  ],
  routesByGroup: {
    formula: [],
    parentsOwned: [0],
    needsSupplement: [],
    excludedByPolicy: [],
  },
};

const alternativeSourceIds = (index: number) => [
  `alternative-a-${index}`,
  `alternative-b-${index}`,
];

const genderReverseRequirement = (target: {
  stepIndex: number;
  parentPosition: 1 | 2;
  species: string;
  requiredGender: "Any" | "Male" | "Female";
  sourceId?: string;
}) => ({
  type: "use_item",
  itemId: "PalGenderReverse",
  quantity: 1,
  target: { type: "parent", ...target },
  offers: [
    {
      vendor: "arena_shop",
      currency: "battle_ticket",
      cost: 5,
      sourceUrl: "https://example.com",
    },
  ],
});

function createValidGenderReverseResponse() {
  const inventoryRoute = validInventoryResponse.routes[0];
  return {
    ...validInventoryResponse,
    routes: [
      {
        ...inventoryRoute,
        unavailableParentCount: 1,
        sources: inventoryRoute.sources.map((source) =>
          source.id === "primary-a" ? { ...source, gender: "Female" } : source,
        ),
        steps: [
          {
            ...inventoryRoute.steps[0],
            parent1: {
              ...inventoryRoute.steps[0]?.parent1,
              requiredGender: "Male",
              availability: "owned_incompatible",
            },
          },
        ],
        requirements: [
          genderReverseRequirement({
            stepIndex: 0,
            parentPosition: 1,
            species: "A",
            requiredGender: "Male",
            sourceId: "primary-a",
          }),
        ],
        complexity: {
          ...inventoryRoute.complexity,
          deterministicItemActionCount: 1,
          blockerCount: 1,
        },
        group: "needs_supplement",
      },
    ],
    routesByGroup: {
      formula: [],
      parentsOwned: [],
      needsSupplement: [0],
      excludedByPolicy: [],
    },
  };
}

function createValidMissingParentResponse() {
  const inventoryRoute = validInventoryResponse.routes[0];
  const missingParent = {
    species: "Missing",
    requiredGender: "Male",
    availability: "missing",
  } as const;
  return {
    ...validInventoryResponse,
    routes: [
      {
        ...inventoryRoute,
        unavailableParentCount: 2,
        sources: [],
        steps: [
          {
            ...inventoryRoute.steps[0],
            parent1: missingParent,
            parent2: missingParent,
          },
        ],
        requirements: [
          {
            type: "missing_parent",
            species: "Missing",
            requiredGender: "Male",
            quantity: 2,
          },
        ],
        complexity: {
          ...inventoryRoute.complexity,
          missingParentRequirementCount: 2,
          blockerCount: 2,
        },
        group: "needs_supplement",
      },
    ],
    routesByGroup: {
      formula: [],
      parentsOwned: [],
      needsSupplement: [0],
      excludedByPolicy: [],
    },
  };
}

describe("Palworld breeding routes response parser", () => {
  it("accepts an indexed v7 route pool", () => {
    expect(parsePalworldBreedingRoutesResponse(validResponse)).toBe(
      validResponse,
    );
  });

  it("accepts nine returned alternative source groups with more available", () => {
    const response = {
      ...validInventoryResponse,
      routes: [
        {
          ...validInventoryResponse.routes[0],
          alternativeCount: 9,
          alternativeSourceIdSets: Array.from({ length: 9 }, (_, index) =>
            alternativeSourceIds(index),
          ),
          hasMoreAlternatives: true,
        },
      ],
    };

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
  });

  it.each([1, 8, 9])(
    "accepts %i returned alternative source groups without overflow",
    (alternativeCount) => {
      const response = {
        ...validInventoryResponse,
        routes: [
          {
            ...validInventoryResponse.routes[0],
            alternativeCount,
            alternativeSourceIdSets: Array.from(
              { length: alternativeCount },
              (_, index) => alternativeSourceIds(index),
            ),
            hasMoreAlternatives: false,
          },
        ],
      };

      expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
    },
  );

  it("accepts an alternative that uses more unique sources than the primary route", () => {
    const response = {
      ...validInventoryResponse,
      routes: [
        {
          ...validInventoryResponse.routes[0],
          alternativeCount: 1,
          alternativeSourceIdSets: [
            ["primary-a", "primary-b", "alternative-c"],
          ],
          hasMoreAlternatives: false,
        },
      ],
    };

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
  });

  it("accepts a PalGenderReverse target that exactly matches its route parent", () => {
    const response = createValidGenderReverseResponse();

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
  });

  it("accepts missing-parent aggregation and rejects stale ready classification", () => {
    const response = createValidMissingParentResponse();
    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);

    const staleReady = {
      ...response,
      routes: [
        {
          ...response.routes[0]!,
          unavailableParentCount: 0,
          requirements: [],
          complexity: {
            ...response.routes[0]!.complexity,
            missingParentRequirementCount: 0,
            blockerCount: 0,
          },
          group: "parents_owned",
        },
      ],
      routesByGroup: {
        formula: [],
        parentsOwned: [0],
        needsSupplement: [],
        excludedByPolicy: [],
      },
    };
    expect(() => parsePalworldBreedingRoutesResponse(staleReady)).toThrow(
      "error.api_unreachable",
    );
  });

  it("accepts three blockers as a route that needs supplementation", () => {
    const base = createValidMissingParentResponse();
    const baseRoute = base.routes[0]!;
    const route = {
      ...baseRoute,
      missingPassives: ["Legend"],
      requirements: [
        ...baseRoute.requirements,
        { type: "missing_passive", passiveId: "Legend" },
      ],
      complexity: {
        ...baseRoute.complexity,
        unresolvedPassiveCount: 1,
        blockerCount: 3,
      },
    };
    const response = {
      ...base,
      desiredPassiveIds: ["Legend"],
      routes: [route],
    };

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
  });

  it("accepts four blockers only in the excluded policy group", () => {
    const base = createValidMissingParentResponse();
    const baseRoute = base.routes[0]!;
    const route = {
      ...baseRoute,
      missingPassives: ["Legend", "Swift"],
      requirements: [
        ...baseRoute.requirements,
        { type: "missing_passive", passiveId: "Legend" },
        { type: "missing_passive", passiveId: "Swift" },
      ],
      complexity: {
        ...baseRoute.complexity,
        unresolvedPassiveCount: 2,
        blockerCount: 4,
      },
      group: "excluded_by_policy",
    };
    const response = {
      ...base,
      desiredPassiveIds: ["Legend", "Swift"],
      routes: [route],
      routesByGroup: {
        ...base.routesByGroup,
        needsSupplement: [],
        excludedByPolicy: [0],
      },
    };

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
  });

  it("rejects duplicate requirements and contradictory availability/source pairs", () => {
    const duplicateRequirement = structuredClone(
      createValidMissingParentResponse(),
    );
    duplicateRequirement.routes[0]!.requirements.push(
      structuredClone(duplicateRequirement.routes[0]!.requirements[0]!),
    );

    const ownedWithoutSource = structuredClone(validInventoryResponse);
    Reflect.deleteProperty(
      ownedWithoutSource.routes[0]!.steps[0]!.parent1,
      "sourceId",
    );

    const intermediateWithSource = structuredClone(validInventoryResponse);
    intermediateWithSource.routes[0]!.steps[0]!.parent1.availability =
      "intermediate";

    for (const invalid of [
      duplicateRequirement,
      ownedWithoutSource,
      intermediateWithSource,
    ]) {
      expect(() => parsePalworldBreedingRoutesResponse(invalid)).toThrow(
        "error.api_unreachable",
      );
    }
  });

  it("accepts one missing-passive blocker and rejects acquisition mismatch", () => {
    const route = validInventoryResponse.routes[0];
    const response = {
      ...validInventoryResponse,
      routes: [
        {
          ...route,
          missingPassives: ["Legend"],
          requirements: [{ type: "missing_passive", passiveId: "Legend" }],
          complexity: {
            ...route.complexity,
            unresolvedPassiveCount: 1,
            blockerCount: 1,
          },
          group: "needs_supplement",
        },
      ],
      routesByGroup: {
        formula: [],
        parentsOwned: [],
        needsSupplement: [0],
        excludedByPolicy: [],
      },
    };
    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);

    const mismatched = {
      ...response,
      routes: [
        {
          ...response.routes[0]!,
          acquisitionDifficulty: {
            specialParentCount: 1,
            highestMinimumWildLevel: 10,
            totalMinimumWildLevel: 10,
            totalRarity: 1,
          },
        },
      ],
    };
    expect(() => parsePalworldBreedingRoutesResponse(mismatched)).toThrow(
      "error.api_unreachable",
    );
  });

  it("rejects malformed route objects before rendering", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        routes: [{}],
      }),
    ).toThrow("error.api_unreachable");
  });

  it("rejects malformed deterministic-item targets", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        routes: [
          {
            ...validResponse.routes[0],
            requirements: [
              {
                type: "use_item",
                itemId: "PalGenderReverse",
                quantity: 1,
                target: {},
                offers: [
                  {
                    vendor: "arena_shop",
                    currency: "battle_ticket",
                    cost: 5,
                    sourceUrl: "https://example.com",
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toThrow("error.api_unreachable");
  });

  it.each([
    {
      label: "depth and steps",
      route: { ...validResponse.routes[0], depth: 2 },
    },
    {
      label: "steps and planned stage count",
      route: {
        ...validResponse.routes[0],
        complexity: {
          ...validResponse.routes[0].complexity,
          plannedStageCount: 2,
        },
      },
    },
  ])("rejects contradictory route $label", ({ route }) => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        routes: [route],
      }),
    ).toThrow("error.api_unreachable");
  });

  it.each([
    {
      label: "route target and final child",
      response: {
        ...validResponse,
        routes: [
          {
            ...validResponse.routes[0],
            steps: [
              {
                ...validResponse.routes[0].steps[0],
                child: "DifferentTarget",
              },
            ],
          },
        ],
      },
    },
    {
      label: "response target and route target",
      response: {
        ...validResponse,
        routes: [
          {
            ...validResponse.routes[0],
            target: "DifferentTarget",
            steps: [
              {
                ...validResponse.routes[0].steps[0],
                child: "DifferentTarget",
              },
            ],
          },
        ],
      },
    },
  ])("rejects contradictory $label", ({ response }) => {
    expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
      "error.api_unreachable",
    );
  });

  it("rejects a PalGenderReverse target with an out-of-range step index", () => {
    const response = structuredClone(createValidGenderReverseResponse());
    response.routes[0]!.requirements[0]!.target.stepIndex = 99;

    expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
      "error.api_unreachable",
    );
  });

  it("rejects a PalGenderReverse target with mismatched parent species", () => {
    const response = structuredClone(createValidGenderReverseResponse());
    response.routes[0]!.requirements[0]!.target.species = "DifferentParent";

    expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
      "error.api_unreachable",
    );
  });

  it.each([
    {
      label: "required gender",
      mutate: (
        response: ReturnType<typeof createValidGenderReverseResponse>,
      ) => {
        response.routes[0]!.requirements[0]!.target.requiredGender = "Female";
      },
    },
    {
      label: "source ID",
      mutate: (
        response: ReturnType<typeof createValidGenderReverseResponse>,
      ) => {
        response.routes[0]!.requirements[0]!.target.sourceId = "primary-b";
      },
    },
  ])(
    "rejects a PalGenderReverse target with mismatched $label",
    ({ mutate }) => {
      const response = structuredClone(createValidGenderReverseResponse());
      mutate(response);

      expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
        "error.api_unreachable",
      );
    },
  );

  it.each([
    {
      label: "missing source ID",
      mutate: (response: typeof validInventoryResponse) => {
        response.routes[0]!.steps[0]!.parent1.sourceId = "missing";
      },
    },
    {
      label: "mismatched source species",
      mutate: (response: typeof validInventoryResponse) => {
        response.routes[0]!.sources[0]!.species = "DifferentParent";
      },
    },
  ])("rejects a parent with a $label", ({ mutate }) => {
    const response = structuredClone(validInventoryResponse);
    mutate(response);

    expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
      "error.api_unreachable",
    );
  });

  it("accepts matching passive implant semantics and rejects a different target", () => {
    const route = validInventoryResponse.routes[0];
    const response = {
      ...validInventoryResponse,
      routes: [
        {
          ...route,
          missingPassives: ["Legend"],
          implantPassives: ["Legend"],
          requirements: [
            {
              type: "use_item",
              itemId: "passive_implant",
              quantity: 1,
              target: { type: "passive", passiveId: "Legend" },
              offers: [
                {
                  vendor: "arena_shop",
                  currency: "battle_ticket",
                  cost: 50,
                  sourceUrl: "https://example.com",
                },
              ],
            },
          ],
          complexity: {
            ...route.complexity,
            deterministicItemActionCount: 1,
            blockerCount: 1,
          },
          group: "needs_supplement",
        },
      ],
      routesByGroup: {
        formula: [],
        parentsOwned: [],
        needsSupplement: [0],
        excludedByPolicy: [],
      },
    };

    expect(parsePalworldBreedingRoutesResponse(response)).toBe(response);
    const mismatched = structuredClone(response);
    mismatched.routes[0]!.requirements[0]!.target.passiveId = "Different";
    expect(() => parsePalworldBreedingRoutesResponse(mismatched)).toThrow(
      "error.api_unreachable",
    );
  });

  it("rejects more than nine alternative source combinations", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validInventoryResponse,
        routes: [
          {
            ...validInventoryResponse.routes[0],
            alternativeCount: 10,
            alternativeSourceIdSets: Array.from({ length: 10 }, (_, index) =>
              alternativeSourceIds(index),
            ),
            hasMoreAlternatives: true,
          },
        ],
      }),
    ).toThrow("error.api_unreachable");
  });

  it.each([
    {
      label: "count does not equal returned source groups",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 3,
        alternativeSourceIdSets: [alternativeSourceIds(1)],
        hasMoreAlternatives: false,
      },
    },
    {
      label: "has-more flag is set before the nine-group cap",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 2,
        alternativeSourceIdSets: [
          alternativeSourceIds(1),
          alternativeSourceIds(2),
        ],
        hasMoreAlternatives: true,
      },
    },
    {
      label: "alternative source groups are duplicated",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 2,
        alternativeSourceIdSets: [
          alternativeSourceIds(1),
          [...alternativeSourceIds(1)].reverse(),
        ],
        hasMoreAlternatives: false,
      },
    },
    {
      label: "an alternative repeats the primary source group",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 1,
        alternativeSourceIdSets: [["primary-b", "primary-a"]],
        hasMoreAlternatives: false,
      },
    },
    {
      label: "only some alternative fields are present",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 0,
      },
    },
    {
      label: "an alternative contains duplicate source IDs",
      route: {
        ...validInventoryResponse.routes[0],
        alternativeCount: 1,
        alternativeSourceIdSets: [["alternative-a", "alternative-a"]],
        hasMoreAlternatives: false,
      },
    },
  ])("rejects inconsistent alternatives when $label", ({ route }) => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validInventoryResponse,
        routes: [route],
      }),
    ).toThrow("error.api_unreachable");
  });

  it.each([5, 6])("rejects stale response version %i", (version) => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({ ...validResponse, v: version }),
    ).toThrow("error.api_unreachable");
  });

  it("rejects route references outside the shared pool", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        recommendedRouteIndexes: [1],
      }),
    ).toThrow("error.api_unreachable");
  });

  it.each([
    {
      label: "duplicate recommendation index",
      response: { ...validResponse, recommendedRouteIndexes: [0, 0] },
    },
    {
      label: "incorrect depth projection",
      response: {
        ...validResponse,
        routesByDepth: { depth1: [], depth2: [0], depth3: [] },
      },
    },
    {
      label: "incorrect group projection",
      response: {
        ...validResponse,
        routesByGroup: {
          formula: [],
          parentsOwned: [0],
          needsSupplement: [],
          excludedByPolicy: [],
        },
      },
    },
  ])("rejects an indexed pool with $label", ({ response }) => {
    expect(() => parsePalworldBreedingRoutesResponse(response)).toThrow(
      "error.api_unreachable",
    );
  });

  it("rejects API responses that raise the route budget", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        searchMeta: { ...validResponse.searchMeta, routeLimit: 51 },
      }),
    ).toThrow("error.api_unreachable");
  });

  it("rejects inconsistent returned-route metadata", () => {
    expect(() =>
      parsePalworldBreedingRoutesResponse({
        ...validResponse,
        searchMeta: { ...validResponse.searchMeta, returnedRouteCount: 2 },
      }),
    ).toThrow("error.api_unreachable");
  });
});
