import type {
  PalworldGameData,
  PalworldPalDefinition,
} from "./game-data-contract";

export interface PalworldRuntimeLocalizationPack {
  locale: string;
  pals: Record<string, string>;
  passiveSkills: Record<string, { name: string; description?: string }>;
}

export function applyRuntimeGameLocalizations(
  gameData: PalworldGameData,
  pack: PalworldRuntimeLocalizationPack,
) {
  const locale = toPalworldLocalizedNameLocale(pack.locale);

  for (const [internalId, name] of Object.entries(pack.pals)) {
    const pal = gameData.palsByInternal[internalId];
    if (!pal) continue;
    pal.localizedNames = { ...(pal.localizedNames ?? {}), [locale]: name };
  }

  for (const [internalId, translation] of Object.entries(pack.passiveSkills)) {
    const passiveSkill = gameData.passiveSkillsByInternal?.[internalId];
    if (!passiveSkill) continue;
    passiveSkill.localizedNames = {
      ...(passiveSkill.localizedNames ?? {}),
      [locale]: translation.name,
    };
    if (translation.description) {
      passiveSkill.localizedDescriptions = {
        ...(passiveSkill.localizedDescriptions ?? {}),
        [locale]: translation.description,
      };
    }
  }
}

export function toPalworldLocalizedNameLocale(siteLocale: string) {
  const normalized = siteLocale.trim();
  if (normalized === "zh-CN" || normalized === "zh-Hans") return "zh-Hans";
  if (
    normalized === "zh-TW" ||
    normalized === "zh-HK" ||
    normalized === "zh-Hant"
  ) {
    return "zh-Hant";
  }
  if (normalized === "pt") return "pt-BR";
  return normalized;
}

export function getPalworldDisplayName(
  internalId: string,
  gameData: PalworldGameData,
  siteLocale: string,
) {
  const pal = gameData.palsByInternal[internalId];
  if (!pal) return internalId;
  return getPalworldDefinitionDisplayName(internalId, pal, siteLocale);
}

export function findPalworldInternalIdByDisplayText(
  text: string,
  gameData: PalworldGameData,
  siteLocale: string,
) {
  const normalizedText = normalizeSearchText(text);
  if (!normalizedText) return null;

  for (const [internalId, pal] of Object.entries(gameData.palsByInternal)) {
    if (
      nameCandidates(internalId, pal, siteLocale)
        .map(normalizeSearchText)
        .includes(normalizedText)
    ) {
      return internalId;
    }
  }

  return null;
}

function getPalworldDefinitionDisplayName(
  internalId: string,
  pal: PalworldPalDefinition,
  siteLocale: string,
) {
  const localizedNames = pal.localizedNames ?? {};
  return (
    localizedNames[toPalworldLocalizedNameLocale(siteLocale)] ??
    localizedNames.en ??
    pal.name ??
    internalId
  );
}

function nameCandidates(
  internalId: string,
  pal: PalworldPalDefinition,
  siteLocale: string,
) {
  return [
    internalId,
    getPalworldDefinitionDisplayName(internalId, pal, siteLocale),
    pal.name,
    pal.localizedNames?.en,
    ...Object.values(pal.localizedNames ?? {}),
  ].filter((candidate): candidate is string => Boolean(candidate));
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase();
}
