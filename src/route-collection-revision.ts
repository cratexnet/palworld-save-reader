import type { PalworldBreedingRoutesResponse } from "./breeding-routes-api-contract";

export function createPalworldRouteCollectionRevision(
  response: PalworldBreedingRoutesResponse,
) {
  const serialized = stableSerialize({
    v: response.v,
    payloadVersion: response.payloadVersion,
    dataVersion: response.dataVersion,
    targetSpecies: response.targetSpecies,
    startingSpecies: response.startingSpecies,
    desiredPassiveIds: response.desiredPassiveIds,
    desiredPassiveAcquisitions: response.desiredPassiveAcquisitions,
    inventoryCount: response.inventoryCount,
    routes: response.routes,
    recommendedRouteIndexes: response.recommendedRouteIndexes,
    directRouteIndexes: response.directRouteIndexes,
    routesByDepth: response.routesByDepth,
    routesByGroup: response.routesByGroup,
    ownedTargetSources: response.ownedTargetSources,
    searchMeta: response.searchMeta,
  });

  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `v7-${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}`;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry) => entry[1] !== undefined)
    .sort((left, right) => left[0].localeCompare(right[0], "en"));
  return `{${entries
    .map(
      ([key, entryValue]) =>
        `${JSON.stringify(key)}:${stableSerialize(entryValue)}`,
    )
    .join(",")}}`;
}
