import {
  PALWORLD_BREEDING_ROUTES_RESULT_LIMIT,
  PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION,
  type PalworldBreedingRoute,
  type PalworldBreedingRouteParent,
  type PalworldBreedingRouteRequirement,
  type PalworldBreedingRouteSource,
  type PalworldBreedingRoutesResponse,
} from "./breeding-routes-api-contract";

export function parsePalworldBreedingRoutesResponse(
  value: unknown,
): PalworldBreedingRoutesResponse {
  if (!isRecord(value)) throw new Error("error.api_unreachable");
  const response = value as Partial<PalworldBreedingRoutesResponse>;
  if (
    response.v !== PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION ||
    !Number.isInteger(response.payloadVersion) ||
    typeof response.dataVersion !== "string" ||
    !isNullableString(response.targetSpecies) ||
    !isNullableString(response.startingSpecies) ||
    !isStringArray(response.desiredPassiveIds) ||
    !Array.isArray(response.desiredPassiveAcquisitions) ||
    !Number.isInteger(response.inventoryCount) ||
    response.inventoryCount! < 0 ||
    !Array.isArray(response.routes) ||
    response.routes.length > PALWORLD_BREEDING_ROUTES_RESULT_LIMIT ||
    !response.routes.every(isBreedingRoute) ||
    !Array.isArray(response.recommendedRouteIndexes) ||
    !Array.isArray(response.directRouteIndexes) ||
    !isRecord(response.routesByDepth) ||
    !isRecord(response.routesByGroup) ||
    !isSearchMeta(response.searchMeta) ||
    !Array.isArray(response.ownedTargetSources) ||
    !response.ownedTargetSources.every(isBreedingRouteSource) ||
    response.searchMeta?.returnedRouteCount !== response.routes.length
  ) {
    throw new Error("error.api_unreachable");
  }

  const parsed = response as PalworldBreedingRoutesResponse;
  const indexGroups = [
    parsed.recommendedRouteIndexes,
    parsed.directRouteIndexes,
    parsed.routesByDepth.depth1,
    parsed.routesByDepth.depth2,
    parsed.routesByDepth.depth3,
    parsed.routesByGroup.formula,
    parsed.routesByGroup.parentsOwned,
    parsed.routesByGroup.needsSupplement,
    parsed.routesByGroup.excludedByPolicy,
  ];
  if (
    indexGroups.some(
      (indexes) =>
        !Array.isArray(indexes) ||
        new Set(indexes).size !== indexes.length ||
        indexes.some(
          (index) =>
            !Number.isInteger(index) ||
            index < 0 ||
            index >= parsed.routes.length,
        ),
    ) ||
    !hasExactRouteProjections(parsed) ||
    !parsed.routes.every((route) =>
      isSemanticallyConsistentRoute(route, parsed.targetSpecies),
    )
  ) {
    throw new Error("error.api_unreachable");
  }
  return parsed;
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
    [
      "formula",
      "parents_owned",
      "needs_supplement",
      "excluded_by_policy",
    ].includes(String(value.group)) &&
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

function isSemanticallyConsistentRoute(
  route: PalworldBreedingRoute,
  responseTarget: string | null,
) {
  if (
    responseTarget === null ||
    route.depth !== route.steps.length ||
    route.complexity.plannedStageCount !== route.steps.length ||
    route.target !== route.steps.at(-1)?.child ||
    route.target !== responseTarget
  ) {
    return false;
  }

  const sourcesById = new Map<string, PalworldBreedingRouteSource>();
  for (const source of route.sources) {
    if (sourcesById.has(source.id)) return false;
    sourcesById.set(source.id, source);
  }

  for (const step of route.steps) {
    for (const parent of [step.parent1, step.parent2]) {
      const requiresSource =
        parent.availability === "owned" ||
        parent.availability === "owned_incompatible";
      if (requiresSource !== (parent.sourceId !== undefined)) return false;
      if (parent.sourceId === undefined) continue;
      const source = sourcesById.get(parent.sourceId);
      if (!source || source.species !== parent.species) return false;
    }
  }

  const implantTargets: string[] = [];
  for (const requirement of route.requirements) {
    if (requirement.type !== "use_item") continue;
    if (requirement.itemId === "passive_implant") {
      implantTargets.push(requirement.target.passiveId);
      continue;
    }

    const target = requirement.target;
    const step = route.steps[target.stepIndex];
    const parent = target.parentPosition === 1 ? step?.parent1 : step?.parent2;
    if (
      !parent ||
      target.species !== parent.species ||
      target.requiredGender !== parent.requiredGender ||
      target.sourceId !== parent.sourceId
    ) {
      return false;
    }
  }

  const implantPassives = route.implantPassives ?? [];
  if (
    !hasUniqueStrings(implantPassives) ||
    !hasUniqueStrings(implantTargets) ||
    !sameStringSet(implantPassives, implantTargets) ||
    implantPassives.some(
      (passiveId) => !route.missingPassives.includes(passiveId),
    )
  ) {
    return false;
  }

  return (
    hasConsistentExecutionClassification(route) &&
    hasConsistentAlternativeMetadata(route)
  );
}

function hasConsistentExecutionClassification(route: PalworldBreedingRoute) {
  const missingParentQuantity = new Map<string, number>();
  for (const step of route.steps) {
    const countForStep = new Map<string, number>();
    for (const parent of [step.parent1, step.parent2]) {
      if (parent.availability !== "missing") continue;
      const key = `${parent.species}\u0000${parent.requiredGender}`;
      countForStep.set(key, (countForStep.get(key) ?? 0) + 1);
    }
    for (const [key, count] of countForStep) {
      missingParentQuantity.set(
        key,
        Math.max(missingParentQuantity.get(key) ?? 0, count),
      );
    }
  }

  const expectedRequirementKeys = new Set<string>();
  const classifiedParents = new Set<string>();
  let hasUnknownParent = false;
  let unavailableParentCount = 0;
  let missingParentRequirementCount = 0;
  let deterministicItemActionCount = 0;
  for (const [stepIndex, step] of route.steps.entries()) {
    for (const [parentIndex, parent] of [
      step.parent1,
      step.parent2,
    ].entries()) {
      if (parent.availability === "unknown") {
        hasUnknownParent = true;
        continue;
      }
      if (
        parent.availability !== "missing" &&
        parent.availability !== "owned_incompatible"
      ) {
        continue;
      }
      unavailableParentCount += 1;

      const parentKey = `${parent.species}\u0000${parent.requiredGender}`;
      if (parent.availability === "missing") {
        const classificationKey = `missing_parent\u0000${parentKey}`;
        if (classifiedParents.has(classificationKey)) continue;
        classifiedParents.add(classificationKey);
        const quantity = missingParentQuantity.get(parentKey) ?? 1;
        missingParentRequirementCount += quantity;
        expectedRequirementKeys.add(
          `missing_parent\u0000${parent.species}\u0000${parent.requiredGender}\u0000${quantity}`,
        );
        continue;
      }

      const classificationKey = `PalGenderReverse\u0000${parentKey}\u0000${parent.sourceId ?? ""}`;
      if (classifiedParents.has(classificationKey)) continue;
      classifiedParents.add(classificationKey);
      deterministicItemActionCount += 1;
      expectedRequirementKeys.add(
        `PalGenderReverse\u0000${stepIndex}\u0000${parentIndex + 1}\u0000${parent.species}\u0000${parent.requiredGender}\u0000${parent.sourceId ?? ""}`,
      );
    }
  }

  let unresolvedPassiveCount = 0;
  for (const passiveId of route.missingPassives) {
    if (route.implantPassives?.includes(passiveId)) {
      expectedRequirementKeys.add(`passive_implant\u0000${passiveId}`);
      continue;
    }
    const key = `missing_passive\u0000${passiveId}`;
    if (!expectedRequirementKeys.has(key)) unresolvedPassiveCount += 1;
    expectedRequirementKeys.add(key);
  }
  deterministicItemActionCount += route.implantPassives?.length ?? 0;

  const actualRequirementKeys = new Set(
    route.requirements.map(normalizedRequirementKey),
  );
  const blockerCount =
    missingParentRequirementCount +
    unresolvedPassiveCount +
    deterministicItemActionCount;
  const expectedGroup = hasUnknownParent
    ? "formula"
    : route.steps.length > 3 || blockerCount >= 3
      ? "excluded_by_policy"
      : blockerCount === 0
        ? "parents_owned"
        : "needs_supplement";
  return (
    actualRequirementKeys.size === route.requirements.length &&
    actualRequirementKeys.size === expectedRequirementKeys.size &&
    [...actualRequirementKeys].every((key) =>
      expectedRequirementKeys.has(key),
    ) &&
    route.unavailableParentCount === unavailableParentCount &&
    route.complexity.missingParentRequirementCount ===
      missingParentRequirementCount &&
    route.complexity.unresolvedPassiveCount === unresolvedPassiveCount &&
    route.complexity.deterministicItemActionCount ===
      deterministicItemActionCount &&
    route.complexity.blockerCount === blockerCount &&
    route.group === expectedGroup &&
    sameAcquisitionDifficulty(
      route.acquisitionDifficulty,
      route.complexity.acquisitionDifficulty,
    )
  );
}

function normalizedRequirementKey(
  requirement: PalworldBreedingRouteRequirement,
) {
  if (requirement.type === "missing_parent") {
    return `missing_parent\u0000${requirement.species}\u0000${requirement.requiredGender}\u0000${requirement.quantity}`;
  }
  if (requirement.type === "missing_passive") {
    return `missing_passive\u0000${requirement.passiveId}`;
  }
  if (requirement.target.type === "passive") {
    return `passive_implant\u0000${requirement.target.passiveId}`;
  }
  return `PalGenderReverse\u0000${requirement.target.stepIndex}\u0000${requirement.target.parentPosition}\u0000${requirement.target.species}\u0000${requirement.target.requiredGender}\u0000${requirement.target.sourceId ?? ""}`;
}

function sameAcquisitionDifficulty(
  left: PalworldBreedingRoute["acquisitionDifficulty"],
  right: PalworldBreedingRoute["acquisitionDifficulty"],
) {
  if (!left || !right) return left === right;
  return (
    left.specialParentCount === right.specialParentCount &&
    left.highestMinimumWildLevel === right.highestMinimumWildLevel &&
    left.totalMinimumWildLevel === right.totalMinimumWildLevel &&
    left.totalRarity === right.totalRarity
  );
}

function hasConsistentAlternativeMetadata(route: PalworldBreedingRoute) {
  const fields = [
    route.alternativeCount,
    route.alternativeSourceIdSets,
    route.hasMoreAlternatives,
  ];
  if (fields.every((field) => field === undefined)) return true;
  if (fields.some((field) => field === undefined)) return false;

  const count = route.alternativeCount!;
  const sourceIdSets = route.alternativeSourceIdSets!;
  const hasMore = route.hasMoreAlternatives!;
  if (
    !isNonNegativeInteger(count) ||
    count > 9 ||
    sourceIdSets.length !== count ||
    (hasMore && count !== 9)
  ) {
    return false;
  }

  const primaryKey = canonicalSourceIdSet(
    route.sources.map((source) => source.id),
  );
  const seen = new Set<string>();
  for (const sourceIds of sourceIdSets) {
    if (sourceIds.length === 0 || !hasUniqueStrings(sourceIds)) {
      return false;
    }
    const key = canonicalSourceIdSet(sourceIds);
    if (key === primaryKey || seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

function hasExactRouteProjections(response: PalworldBreedingRoutesResponse) {
  const indexes = response.routes.map((_, index) => index);
  return (
    sameIndexes(
      response.routesByDepth.depth1,
      indexes.filter((index) => response.routes[index]?.depth === 1),
    ) &&
    sameIndexes(
      response.routesByDepth.depth2,
      indexes.filter((index) => response.routes[index]?.depth === 2),
    ) &&
    sameIndexes(
      response.routesByDepth.depth3,
      indexes.filter((index) => response.routes[index]?.depth === 3),
    ) &&
    sameIndexes(
      response.routesByGroup.formula,
      indexes.filter((index) => response.routes[index]?.group === "formula"),
    ) &&
    sameIndexes(
      response.routesByGroup.parentsOwned,
      indexes.filter(
        (index) => response.routes[index]?.group === "parents_owned",
      ),
    ) &&
    sameIndexes(
      response.routesByGroup.needsSupplement,
      indexes.filter(
        (index) => response.routes[index]?.group === "needs_supplement",
      ),
    ) &&
    sameIndexes(
      response.routesByGroup.excludedByPolicy,
      indexes.filter(
        (index) => response.routes[index]?.group === "excluded_by_policy",
      ),
    )
  );
}

function sameIndexes(actual: readonly number[], expected: readonly number[]) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function hasUniqueStrings(values: readonly string[]) {
  return new Set(values).size === values.length;
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length && left.every((value) => right.includes(value))
  );
}

function canonicalSourceIdSet(sourceIds: readonly string[]) {
  return JSON.stringify(
    [...sourceIds].sort((left, right) => left.localeCompare(right, "en")),
  );
}

function isBreedingRouteSource(
  value: unknown,
): value is PalworldBreedingRouteSource {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.species === "string" &&
    ["", "Male", "Female"].includes(String(value.gender)) &&
    isStringArray(value.passiveIds) &&
    (value.slot === undefined || typeof value.slot === "string")
  );
}

function isBreedingRouteParent(
  value: unknown,
): value is PalworldBreedingRouteParent {
  if (!isRecord(value)) return false;
  return (
    typeof value.species === "string" &&
    ["Any", "Male", "Female"].includes(String(value.requiredGender)) &&
    [
      "owned",
      "owned_incompatible",
      "missing",
      "intermediate",
      "unknown",
    ].includes(String(value.availability)) &&
    (value.sourceId === undefined || typeof value.sourceId === "string")
  );
}

function isBreedingRouteRequirement(
  value: unknown,
): value is PalworldBreedingRouteRequirement {
  if (!isRecord(value)) return false;
  if (value.type === "missing_passive") {
    return typeof value.passiveId === "string";
  }
  if (value.type === "missing_parent") {
    return (
      typeof value.species === "string" &&
      ["Any", "Male", "Female"].includes(String(value.requiredGender)) &&
      isNonNegativeInteger(value.quantity)
    );
  }
  if (value.type !== "use_item") return false;
  return (
    ["PalGenderReverse", "passive_implant"].includes(String(value.itemId)) &&
    value.quantity === 1 &&
    isUseItemTarget(value.target, value.itemId) &&
    Array.isArray(value.offers) &&
    value.offers.length > 0 &&
    value.offers.every(
      (offer) =>
        isRecord(offer) &&
        ["bounty_shop", "arena_shop"].includes(String(offer.vendor)) &&
        ["successful_bounty_token", "battle_ticket"].includes(
          String(offer.currency),
        ) &&
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
    ["Any", "Male", "Female"].includes(String(value.requiredGender)) &&
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

function isSearchMeta(value: unknown) {
  if (!isRecord(value)) return false;
  return (
    isNonNegativeInteger(value.domainMaxDepth) &&
    typeof value.searchComplete === "boolean" &&
    (value.stopReason === null || typeof value.stopReason === "string") &&
    isNonNegativeInteger(value.consideredRouteCount) &&
    isNonNegativeInteger(value.returnedRouteCount) &&
    isNonNegativeInteger(value.excludedByPolicyCount) &&
    value.routeLimit === PALWORLD_BREEDING_ROUTES_RESULT_LIMIT &&
    typeof value.hasMoreRoutes === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}
