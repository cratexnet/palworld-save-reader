import { describe, expect, it } from "vitest";
import type {
  PalworldBreedingRoute,
  PalworldParentBreedingOutcome,
} from "./breeding-routes-api-contract";
import {
  createFormulaPlanFromTargetShard,
  createPalworldBreedingStaticDataClient,
  DEFAULT_STATIC_DATA_BASE_URL,
} from "./static-breeding-data";

const dataVersion = "palworld-1.0-v26-20260711";

describe("Palworld breeding static-data client", () => {
  it("uses the public hosted shard origin in a clean checkout", () => {
    expect(DEFAULT_STATIC_DATA_BASE_URL).toBe(
      "https://cratex.app/games/palworld/breeding/data/v2",
    );
  });

  it("builds exact target and parent URLs and deduplicates concurrent reads", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    let releaseTarget: (() => void) | undefined;
    const targetGate = new Promise<void>((resolve) => {
      releaseTarget = resolve;
    });
    const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      requests.push({ url, init });
      if (url.includes("/targets/")) await targetGate;
      return jsonResponse(shardForUrl(url));
    };
    const client = createPalworldBreedingStaticDataClient({
      baseUrl: "https://cratex.app/games/palworld/breeding/data/v1/",
      dataVersion,
      fetch: fetcher,
    });

    const firstTarget = client.loadTargetShard("Anubis");
    const secondTarget = client.loadTargetShard("Anubis");
    releaseTarget?.();
    await expect(
      Promise.all([firstTarget, secondTarget]),
    ).resolves.toHaveLength(2);
    await client.loadParentShard("SheepBall");

    expect(requests).toEqual([
      {
        url: `https://cratex.app/games/palworld/breeding/data/v1/${dataVersion}/targets/Anubis.json`,
        init: { method: "GET", redirect: "error", credentials: "same-origin" },
      },
      {
        url: `https://cratex.app/games/palworld/breeding/data/v1/${dataVersion}/parents/SheepBall.json`,
        init: { method: "GET", redirect: "error", credentials: "same-origin" },
      },
    ]);
  });

  it("validates schema, data version, and requested species before caching", async () => {
    const invalidBodies = [
      { v: 2, dataVersion, targetSpecies: "Anubis", routes: [] },
      { v: 1, dataVersion: "stale", targetSpecies: "Anubis", routes: [] },
      { v: 1, dataVersion, targetSpecies: "SheepBall", routes: [] },
      { v: 1, dataVersion, targetSpecies: "Anubis", routes: {} },
    ];

    for (const body of invalidBodies) {
      let fetchCount = 0;
      const client = createPalworldBreedingStaticDataClient({
        baseUrl: "/games/palworld/breeding/data/v1",
        dataVersion,
        fetch: async () => {
          fetchCount += 1;
          return jsonResponse(
            fetchCount === 1
              ? body
              : {
                  v: 1,
                  dataVersion,
                  targetSpecies: "Anubis",
                  routes: [],
                },
          );
        },
      });

      await expect(client.loadTargetShard("Anubis")).rejects.toThrow(
        /Invalid Palworld target breeding shard/u,
      );
      await expect(client.loadTargetShard("Anubis")).resolves.toMatchObject({
        targetSpecies: "Anubis",
      });
      expect(fetchCount).toBe(2);
    }
  });

  it("rejects malformed target route entries before caching", async () => {
    const route = formulaRoute("Anubis", "SheepBall", "NightLady");
    const invalidRoutes: unknown[] = [
      {},
      { ...route, steps: [{}] },
      {
        ...route,
        steps: [{ ...route.steps[0], parent1: {} }],
      },
      { ...route, requirements: [{}] },
      { ...route, group: ["formula"] },
    ];

    for (const invalidRoute of invalidRoutes) {
      const client = createPalworldBreedingStaticDataClient({
        baseUrl: "/games/palworld/breeding/data/v1",
        dataVersion,
        fetch: async () =>
          jsonResponse({
            v: 1,
            dataVersion,
            targetSpecies: "Anubis",
            routes: [invalidRoute],
          }),
      });

      await expect(client.loadTargetShard("Anubis")).rejects.toThrow(
        /Invalid Palworld target breeding shard/u,
      );
    }
  });

  it("rejects malformed parent outcome entries before caching", async () => {
    const outcome = parentOutcome("SheepBall", "NightLady", "Anubis");
    const invalidOutcomes: unknown[] = [
      {},
      { ...outcome, partnerRequiredGender: "Either" },
      { ...outcome, partnerRequiredGender: ["Any"] },
    ];

    for (const invalidOutcome of invalidOutcomes) {
      const client = createPalworldBreedingStaticDataClient({
        baseUrl: "/games/palworld/breeding/data/v1",
        dataVersion,
        fetch: async () =>
          jsonResponse({
            v: 1,
            dataVersion,
            parentSpecies: "SheepBall",
            outcomes: [invalidOutcome],
          }),
      });

      await expect(client.loadParentShard("SheepBall")).rejects.toThrow(
        /Invalid Palworld parent breeding shard/u,
      );
    }
  });

  it("filters target and parent queries locally", async () => {
    const targetRoutes = [
      formulaRoute("Anubis", "SheepBall", "NightLady"),
      formulaRoute("Anubis", "Kitsunebi", "Penguin"),
    ];
    const parentOutcomes = [
      parentOutcome("SheepBall", "NightLady", "Anubis"),
      parentOutcome("SheepBall", "Kitsunebi", "Penguin"),
    ];
    let fetchCount = 0;
    const client = createPalworldBreedingStaticDataClient({
      baseUrl: "/games/palworld/breeding/data/v1",
      dataVersion,
      fetch: async (input) => {
        fetchCount += 1;
        const url = input.toString();
        return jsonResponse(
          url.includes("/targets/")
            ? {
                v: 1,
                dataVersion,
                targetSpecies: "Anubis",
                routes: targetRoutes,
              }
            : {
                v: 1,
                dataVersion,
                parentSpecies: "SheepBall",
                outcomes: parentOutcomes,
              },
        );
      },
    });

    const targetShard = await client.loadTargetShard("Anubis");
    const plan = createFormulaPlanFromTargetShard(targetShard, "SheepBall");
    const filteredParent = await client.loadParentShard(
      "SheepBall",
      "NightLady",
    );
    const unfilteredParent = await client.loadParentShard("SheepBall");

    expect(plan).toMatchObject({
      v: 7,
      payloadVersion: 1,
      dataVersion,
      targetSpecies: "Anubis",
      startingSpecies: "SheepBall",
      desiredPassiveIds: [],
      desiredPassiveAcquisitions: [],
      inventoryCount: 0,
      ownedTargetSources: [],
      searchMeta: {
        domainMaxDepth: 1,
        searchComplete: true,
        stopReason: null,
        consideredRouteCount: 1,
        returnedRouteCount: 1,
        excludedByPolicyCount: 0,
        routeLimit: 1,
        hasMoreRoutes: false,
      },
    });
    expect(plan.routes).toEqual([targetRoutes[0]]);
    expect(plan.recommendedRouteIndexes).toEqual([0]);
    expect(plan.directRouteIndexes).toEqual([0]);
    expect(plan.routesByDepth.depth1).toEqual([0]);
    expect(plan.routesByDepth.depth2).toEqual([]);
    expect(plan.routesByDepth.depth3).toEqual([]);
    expect(plan.routesByGroup.formula).toEqual([0]);
    expect(filteredParent.outcomes).toEqual([parentOutcomes[0]]);
    expect(unfilteredParent.outcomes).toEqual(parentOutcomes);
    expect(fetchCount).toBe(2);
  });

  it("keeps all direct formulas in the separate no-save lookup", () => {
    const routes = Array.from({ length: 60 }, (_, index) =>
      formulaRoute("Anubis", `ParentA${index}`, `ParentB${index}`),
    );
    const plan = createFormulaPlanFromTargetShard({
      v: 1,
      dataVersion,
      targetSpecies: "Anubis",
      routes,
    });

    expect(plan.routes).toHaveLength(60);
    expect(plan.directRouteIndexes).toHaveLength(60);
    expect(plan.searchMeta).toMatchObject({
      returnedRouteCount: 60,
      routeLimit: 60,
      hasMoreRoutes: false,
    });
  });

  it("refreshes recency and evicts the least recently used entry at 33", async () => {
    const fetchCounts = new Map<string, number>();
    const client = createPalworldBreedingStaticDataClient({
      baseUrl: "/games/palworld/breeding/data/v1",
      dataVersion,
      fetch: async (input) => {
        const url = input.toString();
        fetchCounts.set(url, (fetchCounts.get(url) ?? 0) + 1);
        return jsonResponse(shardForUrl(url));
      },
    });

    await client.loadTargetShard("Pal1");
    for (let index = 2; index <= 32; index += 1) {
      await client.loadTargetShard(`Pal${index}`);
    }
    await client.loadTargetShard("Pal1");
    await client.loadTargetShard("Pal33");
    await client.loadTargetShard("Pal2");

    expect(fetchCounts.get(targetUrl("Pal1"))).toBe(1);
    expect(fetchCounts.get(targetUrl("Pal2"))).toBe(2);
  });

  it("evicts non-2xx and rejected requests so retries fetch again", async () => {
    let responseAttempts = 0;
    const responseClient = createPalworldBreedingStaticDataClient({
      baseUrl: "/games/palworld/breeding/data/v1",
      dataVersion,
      fetch: async (input) => {
        responseAttempts += 1;
        if (responseAttempts === 1) return new Response(null, { status: 503 });
        return jsonResponse(shardForUrl(input.toString()));
      },
    });

    await expect(responseClient.loadTargetShard("Anubis")).rejects.toThrow(
      /503/u,
    );
    await expect(
      responseClient.loadTargetShard("Anubis"),
    ).resolves.toMatchObject({ targetSpecies: "Anubis" });
    expect(responseAttempts).toBe(2);

    let rejectionAttempts = 0;
    const rejectionClient = createPalworldBreedingStaticDataClient({
      baseUrl: "/games/palworld/breeding/data/v1",
      dataVersion,
      fetch: async (input) => {
        rejectionAttempts += 1;
        if (rejectionAttempts === 1) throw new Error("network unavailable");
        return jsonResponse(shardForUrl(input.toString()));
      },
    });

    await expect(rejectionClient.loadTargetShard("Anubis")).rejects.toThrow(
      /network unavailable/u,
    );
    await expect(
      rejectionClient.loadTargetShard("Anubis"),
    ).resolves.toMatchObject({ targetSpecies: "Anubis" });
    expect(rejectionAttempts).toBe(2);
  });
});

function targetUrl(species: string) {
  return `/games/palworld/breeding/data/v1/${dataVersion}/targets/${species}.json`;
}

function shardForUrl(url: string) {
  const fileName = url.split("/").at(-1) ?? "";
  const species = decodeURIComponent(fileName.replace(/\.json$/u, ""));
  if (url.includes("/parents/")) {
    return {
      v: 1,
      dataVersion,
      parentSpecies: species,
      outcomes: [],
    };
  }
  return { v: 1, dataVersion, targetSpecies: species, routes: [] };
}

function formulaRoute(
  target: string,
  parent1: string,
  parent2: string,
): PalworldBreedingRoute {
  return {
    target,
    depth: 1,
    passiveCoverage: [],
    missingPassives: [],
    extraPassiveCount: 0,
    unavailableParentCount: 0,
    sources: [],
    requirements: [],
    complexity: {
      plannedStageCount: 1,
      missingParentRequirementCount: 0,
      unresolvedPassiveCount: 0,
      deterministicItemActionCount: 0,
      blockerCount: 0,
    },
    group: "formula",
    steps: [
      {
        child: target,
        parent1: {
          species: parent1,
          requiredGender: "Any",
          availability: "unknown",
        },
        parent2: {
          species: parent2,
          requiredGender: "Any",
          availability: "unknown",
        },
      },
    ],
  };
}

function parentOutcome(
  parentSpecies: string,
  partnerSpecies: string,
  child: string,
): PalworldParentBreedingOutcome {
  return {
    child,
    parentSpecies,
    partnerSpecies,
    parentRequiredGender: "Any",
    partnerRequiredGender: "Any",
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
