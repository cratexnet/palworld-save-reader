import { PALWORLD_V1_METADATA } from "./data/palworld-v1-catalog";
import {
  PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION,
  type PalworldBreedingRoutesResponse,
  type PalworldBreedingRoute,
  type PalworldParentBreedingOutcome,
} from "./breeding-routes-api-contract";

const STATIC_SHARD_VERSION = 1 as const;
const MAX_STATIC_SHARD_CACHE_ENTRIES = 32;
export const DEFAULT_STATIC_DATA_BASE_URL =
  "https://cratex.app/games/palworld/breeding/data/v2";

type FetchStaticShard = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface TargetBreedingShardV1 {
  v: typeof STATIC_SHARD_VERSION;
  dataVersion: string;
  targetSpecies: string;
  routes: readonly PalworldBreedingRoute[];
}

export interface ParentBreedingShardV1 {
  v: typeof STATIC_SHARD_VERSION;
  dataVersion: string;
  parentSpecies: string;
  outcomes: readonly PalworldParentBreedingOutcome[];
}

export interface PalworldBreedingStaticDataClient {
  loadTargetShard(targetSpecies: string): Promise<TargetBreedingShardV1>;
  loadParentShard(
    parentSpecies: string,
    partnerSpecies?: string | null,
  ): Promise<ParentBreedingShardV1>;
}

export function createPalworldBreedingStaticDataClient(input: {
  baseUrl: string;
  dataVersion: string;
  fetch?: FetchStaticShard;
}): PalworldBreedingStaticDataClient {
  const baseUrl = requiredValue(input.baseUrl, "Static-data base URL").replace(
    /\/+$/u,
    "",
  );
  const dataVersion = requiredValue(input.dataVersion, "Data version");
  const fetchShard = input.fetch ?? fetch;
  const cache = new Map<string, Promise<unknown>>();

  const loadShard = <T>(
    url: string,
    validate: (value: unknown) => T,
  ): Promise<T> => {
    const cached = cache.get(url);
    if (cached) {
      cache.delete(url);
      cache.set(url, cached);
      return cached as Promise<T>;
    }

    const pending = fetchShard(url, {
      method: "GET",
      redirect: "error",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Palworld breeding static-data request failed with HTTP ${response.status}.`,
          );
        }
        return response.json() as Promise<unknown>;
      })
      .then(validate);

    cache.set(url, pending);
    if (cache.size > MAX_STATIC_SHARD_CACHE_ENTRIES) {
      const oldestUrl = cache.keys().next().value;
      if (oldestUrl) cache.delete(oldestUrl);
    }
    void pending.catch(() => {
      if (cache.get(url) === pending) cache.delete(url);
    });
    return pending;
  };

  return {
    loadTargetShard(targetSpecies) {
      const requestedSpecies = requiredValue(targetSpecies, "Target species");
      const url = shardUrl(baseUrl, dataVersion, "targets", requestedSpecies);
      return loadShard(url, (value) =>
        validateTargetShard(value, dataVersion, requestedSpecies),
      );
    },

    async loadParentShard(parentSpecies, partnerSpecies) {
      const requestedSpecies = requiredValue(parentSpecies, "Parent species");
      const url = shardUrl(baseUrl, dataVersion, "parents", requestedSpecies);
      const shard = await loadShard(url, (value) =>
        validateParentShard(value, dataVersion, requestedSpecies),
      );
      const partner = partnerSpecies?.trim();
      if (!partner) return shard;
      return {
        ...shard,
        outcomes: shard.outcomes.filter(
          (outcome) => outcome.partnerSpecies === partner,
        ),
      };
    },
  };
}

export function createFormulaPlanFromTargetShard(
  shard: TargetBreedingShardV1,
  startingSpecies?: string | null,
): PalworldBreedingRoutesResponse {
  const starting = startingSpecies?.trim() || null;
  const routes = starting
    ? shard.routes.filter((route) =>
        route.steps.some(
          (step) =>
            step.parent1.species === starting ||
            step.parent2.species === starting,
        ),
      )
    : shard.routes;
  const routeIndexes = routes.map((_, index) => index);

  return {
    v: PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION,
    payloadVersion: 1,
    dataVersion: shard.dataVersion,
    targetSpecies: shard.targetSpecies,
    startingSpecies: starting,
    desiredPassiveIds: [],
    desiredPassiveAcquisitions: [],
    inventoryCount: 0,
    routes,
    recommendedRouteIndexes: routeIndexes.slice(0, 3),
    directRouteIndexes: routeIndexes,
    routesByDepth: { depth1: routeIndexes, depth2: [], depth3: [] },
    routesByGroup: {
      formula: routeIndexes,
      parentsOwned: [],
      needsSupplement: [],
      excludedByPolicy: [],
    },
    ownedTargetSources: [],
    searchMeta: {
      domainMaxDepth: 1,
      searchComplete: true,
      stopReason: null,
      consideredRouteCount: routes.length,
      returnedRouteCount: routes.length,
      excludedByPolicyCount: routes.filter(
        (route) => route.group === "excluded_by_policy",
      ).length,
      routeLimit: routes.length,
      hasMoreRoutes: false,
    },
  };
}

type ImportMetaWithStaticDataEnv = ImportMeta & {
  env?: { VITE_PALWORLD_BREEDING_DATA_BASE_URL?: string };
};

const staticDataBaseUrl =
  (
    import.meta as ImportMetaWithStaticDataEnv
  ).env?.VITE_PALWORLD_BREEDING_DATA_BASE_URL?.trim().replace(/\/+$/u, "") ||
  DEFAULT_STATIC_DATA_BASE_URL;
const defaultStaticDataClient = createPalworldBreedingStaticDataClient({
  baseUrl: staticDataBaseUrl,
  dataVersion: PALWORLD_V1_METADATA.gameDataVersion,
});

export const loadTargetShard = defaultStaticDataClient.loadTargetShard;
export const loadParentShard = defaultStaticDataClient.loadParentShard;

function validateTargetShard(
  value: unknown,
  dataVersion: string,
  targetSpecies: string,
): TargetBreedingShardV1 {
  if (
    !isRecord(value) ||
    value.v !== STATIC_SHARD_VERSION ||
    value.dataVersion !== dataVersion ||
    value.targetSpecies !== targetSpecies ||
    !Array.isArray(value.routes) ||
    !value.routes.every(isBreedingRoute)
  ) {
    throw new Error("Invalid Palworld target breeding shard.");
  }
  return value as unknown as TargetBreedingShardV1;
}

function validateParentShard(
  value: unknown,
  dataVersion: string,
  parentSpecies: string,
): ParentBreedingShardV1 {
  if (
    !isRecord(value) ||
    value.v !== STATIC_SHARD_VERSION ||
    value.dataVersion !== dataVersion ||
    value.parentSpecies !== parentSpecies ||
    !Array.isArray(value.outcomes) ||
    !value.outcomes.every(isParentBreedingOutcome)
  ) {
    throw new Error("Invalid Palworld parent breeding shard.");
  }
  return value as unknown as ParentBreedingShardV1;
}

function shardUrl(
  baseUrl: string,
  dataVersion: string,
  kind: "targets" | "parents",
  species: string,
) {
  return `${baseUrl}/${encodeURIComponent(dataVersion)}/${kind}/${encodeURIComponent(species)}.json`;
}

function requiredValue(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAllowedString(
  value: unknown,
  allowed: readonly string[],
): value is string {
  return typeof value === "string" && allowed.includes(value);
}

function isBreedingRoute(value: unknown): value is PalworldBreedingRoute {
  if (!isRecord(value)) return false;
  return (
    typeof value.target === "string" &&
    Number.isInteger(value.depth) &&
    Number(value.depth) >= 1 &&
    Number(value.depth) <= 3 &&
    isStringArray(value.passiveCoverage) &&
    isStringArray(value.missingPassives) &&
    (value.implantPassives === undefined ||
      isStringArray(value.implantPassives)) &&
    isNonNegativeInteger(value.extraPassiveCount) &&
    isNonNegativeInteger(value.unavailableParentCount) &&
    (value.acquisitionDifficulty === undefined ||
      isAcquisitionDifficulty(value.acquisitionDifficulty)) &&
    Array.isArray(value.sources) &&
    value.sources.every(isBreedingRouteSource) &&
    Array.isArray(value.steps) &&
    value.steps.length > 0 &&
    value.steps.every(
      (step) =>
        isRecord(step) &&
        typeof step.child === "string" &&
        isBreedingRouteParent(step.parent1) &&
        isBreedingRouteParent(step.parent2),
    ) &&
    Array.isArray(value.requirements) &&
    value.requirements.every(isBreedingRouteRequirement) &&
    isRouteComplexity(value.complexity) &&
    isAllowedString(value.group, [
      "formula",
      "parents_owned",
      "needs_supplement",
      "excluded_by_policy",
    ]) &&
    (value.alternativeCount === undefined ||
      isNonNegativeInteger(value.alternativeCount)) &&
    (value.alternativeSourceIdSets === undefined ||
      (Array.isArray(value.alternativeSourceIdSets) &&
        value.alternativeSourceIdSets.length <= 9 &&
        value.alternativeSourceIdSets.every(
          (sourceIds) => isStringArray(sourceIds) && sourceIds.length > 0,
        ))) &&
    (value.hasMoreAlternatives === undefined ||
      typeof value.hasMoreAlternatives === "boolean")
  );
}

function isBreedingRouteSource(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.species === "string" &&
    isAllowedString(value.gender, ["", "Male", "Female"]) &&
    isStringArray(value.passiveIds) &&
    (value.slot === undefined || typeof value.slot === "string")
  );
}

function isBreedingRouteParent(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    typeof value.species === "string" &&
    isAllowedString(value.requiredGender, ["Any", "Male", "Female"]) &&
    isAllowedString(value.availability, [
      "owned",
      "owned_incompatible",
      "missing",
      "intermediate",
      "unknown",
    ]) &&
    (value.sourceId === undefined || typeof value.sourceId === "string")
  );
}

function isBreedingRouteRequirement(value: unknown) {
  if (!isRecord(value)) return false;
  if (value.type === "missing_passive") {
    return typeof value.passiveId === "string";
  }
  if (value.type === "missing_parent") {
    return (
      typeof value.species === "string" &&
      isAllowedString(value.requiredGender, ["Any", "Male", "Female"]) &&
      isNonNegativeInteger(value.quantity)
    );
  }
  if (value.type !== "use_item") return false;
  return (
    isAllowedString(value.itemId, ["PalGenderReverse", "passive_implant"]) &&
    value.quantity === 1 &&
    isUseItemTarget(value.target, value.itemId) &&
    Array.isArray(value.offers) &&
    value.offers.length > 0 &&
    value.offers.every(
      (offer) =>
        isRecord(offer) &&
        isAllowedString(offer.vendor, ["bounty_shop", "arena_shop"]) &&
        isAllowedString(offer.currency, [
          "successful_bounty_token",
          "battle_ticket",
        ]) &&
        isNonNegativeInteger(offer.cost) &&
        typeof offer.sourceUrl === "string",
    )
  );
}

function isUseItemTarget(value: unknown, itemId: unknown) {
  if (!isRecord(value)) return false;
  if (itemId === "passive_implant") {
    return value.type === "passive" && typeof value.passiveId === "string";
  }
  return (
    itemId === "PalGenderReverse" &&
    value.type === "parent" &&
    isNonNegativeInteger(value.stepIndex) &&
    (value.parentPosition === 1 || value.parentPosition === 2) &&
    typeof value.species === "string" &&
    isAllowedString(value.requiredGender, ["Any", "Male", "Female"]) &&
    (value.sourceId === undefined || typeof value.sourceId === "string")
  );
}

function isRouteComplexity(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    [
      value.plannedStageCount,
      value.missingParentRequirementCount,
      value.unresolvedPassiveCount,
      value.deterministicItemActionCount,
      value.blockerCount,
    ].every(isNonNegativeInteger) &&
    (value.acquisitionDifficulty === undefined ||
      isAcquisitionDifficulty(value.acquisitionDifficulty))
  );
}

function isAcquisitionDifficulty(value: unknown) {
  if (!isRecord(value)) return false;
  return [
    value.specialParentCount,
    value.highestMinimumWildLevel,
    value.totalMinimumWildLevel,
    value.totalRarity,
  ].every(isNonNegativeInteger);
}

function isParentBreedingOutcome(
  value: unknown,
): value is PalworldParentBreedingOutcome {
  if (!isRecord(value)) return false;
  return (
    typeof value.child === "string" &&
    typeof value.parentSpecies === "string" &&
    typeof value.partnerSpecies === "string" &&
    isAllowedString(value.parentRequiredGender, ["Any", "Male", "Female"]) &&
    isAllowedString(value.partnerRequiredGender, ["Any", "Male", "Female"])
  );
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
