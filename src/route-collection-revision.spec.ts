import { describe, expect, it } from "vitest";
import type {
  PalworldBreedingRoute,
  PalworldBreedingRoutesResponse,
} from "./breeding-routes-api-contract";
import { createPalworldRouteCollectionRevision } from "./route-collection-revision";

const createRoute = (
  sourceId: string,
  group: PalworldBreedingRoute["group"],
): PalworldBreedingRoute => ({
  target: "Target",
  depth: 1,
  passiveCoverage: [],
  missingPassives: [],
  implantPassives: [],
  extraPassiveCount: 0,
  unavailableParentCount: 0,
  sources: [
    {
      id: `${sourceId}-a`,
      species: "A",
      gender: "Male",
      passiveIds: [],
    },
    {
      id: `${sourceId}-b`,
      species: "B",
      gender: "Female",
      passiveIds: [],
    },
  ],
  steps: [
    {
      child: "Target",
      parent1: {
        species: "A",
        requiredGender: "Any",
        availability: "owned",
        sourceId: `${sourceId}-a`,
      },
      parent2: {
        species: "B",
        requiredGender: "Any",
        availability: "owned",
        sourceId: `${sourceId}-b`,
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
  group,
});

const createGenderReversalRoute = (
  route: PalworldBreedingRoute,
): PalworldBreedingRoute => ({
  ...route,
  unavailableParentCount: 1,
  sources: route.sources.map((source) =>
    source.species === "A" ? { ...source, gender: "Female" } : source,
  ),
  steps: [
    {
      ...route.steps[0]!,
      parent1: {
        ...route.steps[0]!.parent1,
        requiredGender: "Male",
        availability: "owned_incompatible",
      },
    },
  ],
  requirements: [
    {
      type: "use_item",
      itemId: "PalGenderReverse",
      quantity: 1,
      target: {
        type: "parent",
        stepIndex: 0,
        parentPosition: 1,
        species: "A",
        requiredGender: "Male",
        sourceId: route.steps[0]!.parent1.sourceId,
      },
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
  complexity: {
    ...route.complexity,
    deterministicItemActionCount: 1,
    blockerCount: 1,
  },
  group: "needs_supplement",
});

const createResponse = (): PalworldBreedingRoutesResponse => ({
  v: 7,
  payloadVersion: 1,
  dataVersion: "test",
  targetSpecies: "Target",
  startingSpecies: null,
  desiredPassiveIds: [],
  desiredPassiveAcquisitions: [],
  inventoryCount: 4,
  routes: [
    createRoute("source-a", "parents_owned"),
    createRoute("source-b", "parents_owned"),
  ],
  recommendedRouteIndexes: [0],
  directRouteIndexes: [0, 1],
  routesByDepth: { depth1: [0, 1], depth2: [], depth3: [] },
  routesByGroup: {
    formula: [],
    parentsOwned: [0, 1],
    needsSupplement: [],
    excludedByPolicy: [],
  },
  ownedTargetSources: [],
  searchMeta: {
    domainMaxDepth: 3,
    searchComplete: true,
    stopReason: null,
    consideredRouteCount: 2,
    returnedRouteCount: 2,
    excludedByPolicyCount: 0,
    routeLimit: 50,
    hasMoreRoutes: false,
  },
});

describe("createPalworldRouteCollectionRevision", () => {
  it("is stable across repeated calls and structurally equal plans", () => {
    const response = createResponse();
    const revision = createPalworldRouteCollectionRevision(response);

    expect(createPalworldRouteCollectionRevision(response)).toBe(revision);
    expect(createPalworldRouteCollectionRevision(createResponse())).toBe(
      revision,
    );
  });

  it("changes when route groups, source IDs, or recommendation indexes change", () => {
    const base = createResponse();
    const changedGroup: PalworldBreedingRoutesResponse = {
      ...base,
      routes: [createGenderReversalRoute(base.routes[0]!), base.routes[1]!],
      routesByGroup: {
        ...base.routesByGroup,
        parentsOwned: [1],
        needsSupplement: [0],
      },
    };
    const changedSource: PalworldBreedingRoutesResponse = {
      ...base,
      routes: [createRoute("source-c", "parents_owned"), base.routes[1]!],
    };
    const changedRecommendation: PalworldBreedingRoutesResponse = {
      ...base,
      recommendedRouteIndexes: [1],
    };

    for (const response of [
      changedGroup,
      changedSource,
      changedRecommendation,
    ]) {
      expect(response.targetSpecies).toBe(base.targetSpecies);
      expect(response.inventoryCount).toBe(base.inventoryCount);
      expect(response.searchMeta.consideredRouteCount).toBe(
        base.searchMeta.consideredRouteCount,
      );
    }

    const revisions = [
      base,
      changedGroup,
      changedSource,
      changedRecommendation,
    ].map(createPalworldRouteCollectionRevision);

    expect(new Set(revisions).size).toBe(4);
  });

  it("covers plan inputs, complete routes, alternatives, and every index projection", () => {
    const base = createResponse();
    const changedRoute = {
      ...base.routes[0]!,
      passiveCoverage: ["Legend"],
    };
    const changedAlternatives = {
      ...base.routes[0]!,
      alternativeCount: 1,
      alternativeSourceIdSets: [["alternative-a", "alternative-b"]],
      hasMoreAlternatives: false,
    };
    const variants: PalworldBreedingRoutesResponse[] = [
      { ...base, targetSpecies: "OtherTarget" },
      { ...base, startingSpecies: "A" },
      { ...base, inventoryCount: base.inventoryCount + 1 },
      { ...base, desiredPassiveIds: ["Legend"] },
      {
        ...base,
        desiredPassiveAcquisitions: [
          { passiveId: "Legend", status: "missing" },
        ],
      },
      {
        ...base,
        searchMeta: {
          ...base.searchMeta,
          consideredRouteCount: base.searchMeta.consideredRouteCount + 1,
        },
      },
      { ...base, routes: [changedRoute, base.routes[1]!] },
      { ...base, routes: [changedAlternatives, base.routes[1]!] },
      { ...base, recommendedRouteIndexes: [1] },
      { ...base, directRouteIndexes: [1] },
      {
        ...base,
        routesByDepth: { depth1: [1, 0], depth2: [], depth3: [] },
      },
      {
        ...base,
        routesByGroup: {
          ...base.routesByGroup,
          parentsOwned: [1, 0],
        },
      },
      {
        ...base,
        ownedTargetSources: [base.routes[0]!.sources[0]!],
      },
    ];
    const baseRevision = createPalworldRouteCollectionRevision(base);

    expect(baseRevision).toMatch(/^v7-[a-z0-9]+-[a-z0-9]+$/u);
    for (const variant of variants) {
      expect(createPalworldRouteCollectionRevision(variant)).not.toBe(
        baseRevision,
      );
    }
  });
});
