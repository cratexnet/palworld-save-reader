import type {
  PalworldOwnedGender,
  PalworldRequiredGender,
} from "./game-data-contract";

export const PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION = 7;
export const PALWORLD_PARENT_BREEDING_RESPONSE_VERSION = 1;
export const PALWORLD_BREEDING_ROUTES_RESULT_LIMIT = 50;

export type PalworldPassiveImplantVendor = "bounty_shop" | "arena_shop";
export type PalworldPassiveImplantCurrency =
  "successful_bounty_token" | "battle_ticket";

export interface PalworldPassiveImplantAcquisition {
  passiveId: string;
  vendor: PalworldPassiveImplantVendor;
  currency: PalworldPassiveImplantCurrency;
  cost: number;
  sourceUrl: string;
}

export interface PalworldMerchantOffer {
  vendor: PalworldPassiveImplantVendor;
  currency: PalworldPassiveImplantCurrency;
  cost: number;
  sourceUrl: string;
}

export type PalworldMerchantOffers = readonly [
  PalworldMerchantOffer,
  ...PalworldMerchantOffer[],
];

export type PalworldDesiredPassiveAcquisition =
  | { passiveId: string; status: "owned" }
  | {
      passiveId: string;
      status: "implant";
      vendor: PalworldPassiveImplantVendor;
      currency: PalworldPassiveImplantCurrency;
      cost: number;
    }
  | { passiveId: string; status: "missing" };

export type PalworldBreedingParentAvailability =
  "owned" | "owned_incompatible" | "missing" | "intermediate" | "unknown";

export interface PalworldBreedingRouteParent {
  species: string;
  requiredGender: PalworldRequiredGender;
  availability: PalworldBreedingParentAvailability;
  sourceId?: string;
}

export interface PalworldBreedingStep {
  child: string;
  parent1: PalworldBreedingRouteParent;
  parent2: PalworldBreedingRouteParent;
}

export interface PalworldBreedingRouteSource {
  id: string;
  species: string;
  gender: PalworldOwnedGender;
  passiveIds: readonly string[];
  slot?: string;
}

export interface PalworldBreedingRouteAcquisitionDifficulty {
  specialParentCount: number;
  highestMinimumWildLevel: number;
  totalMinimumWildLevel: number;
  totalRarity: number;
}

export interface PalworldBreedingRouteParentItemTarget {
  type: "parent";
  stepIndex: number;
  parentPosition: 1 | 2;
  species: string;
  requiredGender: PalworldRequiredGender;
  sourceId?: string;
}

export interface PalworldBreedingRoutePassiveItemTarget {
  type: "passive";
  passiveId: string;
}

export type PalworldBreedingRouteRequirement =
  | {
      type: "missing_parent";
      species: string;
      requiredGender: PalworldRequiredGender;
      quantity: number;
    }
  | { type: "missing_passive"; passiveId: string }
  | {
      type: "use_item";
      itemId: "PalGenderReverse";
      quantity: 1;
      target: PalworldBreedingRouteParentItemTarget;
      offers: PalworldMerchantOffers;
    }
  | {
      type: "use_item";
      itemId: "passive_implant";
      quantity: 1;
      target: PalworldBreedingRoutePassiveItemTarget;
      offers: PalworldMerchantOffers;
    };

export interface PalworldBreedingRouteComplexity {
  plannedStageCount: number;
  missingParentRequirementCount: number;
  unresolvedPassiveCount: number;
  deterministicItemActionCount: number;
  blockerCount: number;
  acquisitionDifficulty?: PalworldBreedingRouteAcquisitionDifficulty;
}

export type PalworldBreedingRouteGroup =
  "formula" | "parents_owned" | "needs_supplement" | "excluded_by_policy";

export interface PalworldBreedingRoute {
  target: string;
  depth: number;
  passiveCoverage: readonly string[];
  missingPassives: readonly string[];
  implantPassives?: readonly string[];
  extraPassiveCount: number;
  unavailableParentCount: number;
  acquisitionDifficulty?: PalworldBreedingRouteAcquisitionDifficulty;
  sources: readonly PalworldBreedingRouteSource[];
  steps: readonly PalworldBreedingStep[];
  requirements: readonly PalworldBreedingRouteRequirement[];
  complexity: PalworldBreedingRouteComplexity;
  group: PalworldBreedingRouteGroup;
  alternativeCount?: number;
  alternativeSourceIdSets?: readonly (readonly string[])[];
  hasMoreAlternatives?: boolean;
}

export interface PalworldBreedingRouteIndexesByDepth {
  depth1: readonly number[];
  depth2: readonly number[];
  depth3: readonly number[];
}

export interface PalworldBreedingRouteIndexesByGroup {
  formula: readonly number[];
  parentsOwned: readonly number[];
  needsSupplement: readonly number[];
  excludedByPolicy: readonly number[];
}

export interface PalworldBreedingRoutesSearchMeta {
  domainMaxDepth: number;
  searchComplete: boolean;
  stopReason: string | null;
  consideredRouteCount: number;
  returnedRouteCount: number;
  excludedByPolicyCount: number;
  routeLimit: number;
  hasMoreRoutes: boolean;
}

export interface PalworldBreedingRoutesResponse {
  v: typeof PALWORLD_BREEDING_ROUTES_RESPONSE_VERSION;
  payloadVersion: number;
  dataVersion: string;
  targetSpecies: string | null;
  startingSpecies: string | null;
  desiredPassiveIds: readonly string[];
  desiredPassiveAcquisitions: readonly PalworldDesiredPassiveAcquisition[];
  inventoryCount: number;
  routes: readonly PalworldBreedingRoute[];
  recommendedRouteIndexes: readonly number[];
  directRouteIndexes: readonly number[];
  routesByDepth: PalworldBreedingRouteIndexesByDepth;
  routesByGroup: PalworldBreedingRouteIndexesByGroup;
  ownedTargetSources: readonly PalworldBreedingRouteSource[];
  searchMeta: PalworldBreedingRoutesSearchMeta;
}

export interface PalworldParentBreedingOutcome {
  child: string;
  parentSpecies: string;
  partnerSpecies: string;
  parentRequiredGender: PalworldRequiredGender;
  partnerRequiredGender: PalworldRequiredGender;
}

export interface PalworldParentBreedingResponse {
  v: typeof PALWORLD_PARENT_BREEDING_RESPONSE_VERSION;
  dataVersion: string;
  parentSpecies: string;
  partnerSpecies: string | null;
  outcomes: readonly PalworldParentBreedingOutcome[];
}
