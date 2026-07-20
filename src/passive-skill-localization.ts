import { createPalworldV1CatalogGameData } from "./data/palworld-v1-catalog";
import type {
  PalworldGameData,
  PalworldPassiveSkillDefinition,
} from "./game-data-contract";
import { toPalworldLocalizedNameLocale } from "./palworld-localization";

export interface PalworldPassiveSkillOption {
  id: string;
  value: string;
  label: string;
  description?: string;
  rank: number;
}

const defaultGameData = createPalworldV1CatalogGameData();

export function listPalworldPassiveSkillOptions(
  siteLocale: string,
  gameData: PalworldGameData = defaultGameData,
): PalworldPassiveSkillOption[] {
  return Object.entries(gameData.passiveSkillsByInternal ?? {})
    .map(([id, passiveSkill], catalogOrder) => ({
      id,
      value: getPalworldPassiveSkillDisplayName(id, siteLocale, gameData),
      label: getPalworldPassiveSkillDisplayName(id, siteLocale, gameData),
      description: getPalworldPassiveSkillDescription(id, siteLocale, gameData),
      rank: passiveSkill.rank,
      catalogOrder,
    }))
    .sort((left, right) => {
      const rankDiff = right.rank - left.rank;
      if (rankDiff !== 0) return rankDiff;
      return (
        left.catalogOrder - right.catalogOrder ||
        left.id.localeCompare(right.id, "en")
      );
    })
    .map(({ catalogOrder: _catalogOrder, ...option }) => option);
}

export function getPalworldPassiveSkillDisplayName(
  internalId: string,
  siteLocale: string,
  gameData: PalworldGameData = defaultGameData,
) {
  const passiveSkill = gameData.passiveSkillsByInternal?.[internalId];
  if (!passiveSkill) return internalId;
  return getPassiveSkillLocalizedValue(
    internalId,
    passiveSkill,
    "localizedNames",
    "name",
    siteLocale,
  );
}

function getPalworldPassiveSkillDescription(
  internalId: string,
  siteLocale: string,
  gameData: PalworldGameData,
) {
  const passiveSkill = gameData.passiveSkillsByInternal?.[internalId];
  if (!passiveSkill) return undefined;
  const localizedDescription = getPassiveSkillLocalizedValue(
    internalId,
    passiveSkill,
    "localizedDescriptions",
    "description",
    siteLocale,
  );
  return resolvePassiveDescriptionPlaceholders(
    localizedDescription,
    passiveSkill.description ?? localizedDescription,
  );
}

function resolvePassiveDescriptionPlaceholders(
  localizedDescription: string,
  resolvedEnglishDescription: string,
) {
  if (!localizedDescription.includes("{EffectValue")) {
    return localizedDescription;
  }

  const fallbackLines = resolvedEnglishDescription.split(/\r?\n/u);
  const resolved = localizedDescription
    .split(/\r?\n/u)
    .map((line, index) => {
      const fallbackNumber =
        fallbackLines[index]?.match(/[+-]?(\d+(?:\.\d+)?)/u)?.[1];
      return fallbackNumber
        ? line.replace(/\{EffectValue[1-4]\}/gu, fallbackNumber)
        : line;
    })
    .join("\n");

  return resolved.includes("{EffectValue")
    ? resolvedEnglishDescription
    : resolved;
}

function getPassiveSkillLocalizedValue(
  internalId: string,
  passiveSkill: PalworldPassiveSkillDefinition,
  localizedKey: "localizedNames" | "localizedDescriptions",
  fallbackKey: "name" | "description",
  siteLocale: string,
) {
  const localizedValues = passiveSkill[localizedKey] ?? {};
  return (
    localizedValues[toPalworldLocalizedNameLocale(siteLocale)] ??
    localizedValues.en ??
    passiveSkill[fallbackKey] ??
    internalId
  );
}
