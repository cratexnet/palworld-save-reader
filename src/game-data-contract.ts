export const PALWORLD_GENDER_MALE = "Male";
export const PALWORLD_GENDER_FEMALE = "Female";
export const PALWORLD_GENDER_ANY = "Any";

export type PalworldOwnedGender =
  typeof PALWORLD_GENDER_MALE | typeof PALWORLD_GENDER_FEMALE | "";

export type PalworldRequiredGender =
  | typeof PALWORLD_GENDER_MALE
  | typeof PALWORLD_GENDER_FEMALE
  | typeof PALWORLD_GENDER_ANY;

export interface PalworldPalDefinition {
  paldeckNumber?: number;
  paldeckCode?: string;
  paldeckVariant?: boolean;
  rarity?: number;
  minWildLevel?: number;
  maxWildLevel?: number;
  name?: string;
  localizedNames?: Record<string, string>;
}

export interface PalworldBreedingPair {
  parent1: string;
  parent2: string;
  parent1Gender?: PalworldRequiredGender;
  parent2Gender?: PalworldRequiredGender;
}

export interface PalworldPassiveSkillDefinition {
  name?: string;
  localizedNames?: Record<string, string>;
  description?: string;
  localizedDescriptions?: Record<string, string>;
  rank: number;
  randomInheritanceAllowed: boolean;
  randomInheritanceWeight: number;
}

export interface PalworldGameData {
  version: string;
  palsByInternal: Record<string, PalworldPalDefinition>;
  breedingByChild?: Record<string, readonly PalworldBreedingPair[]>;
  passiveSkillsByInternal?: Record<string, PalworldPassiveSkillDefinition>;
  genderProbability?: Record<
    string,
    Partial<
      Record<
        typeof PALWORLD_GENDER_MALE | typeof PALWORLD_GENDER_FEMALE,
        number
      >
    >
  >;
}

export interface PalworldOwnedPal {
  id: string;
  species: string;
  gender?: PalworldOwnedGender;
  passiveIds: readonly string[];
  slot?: string;
}

export function normalizePalCharacterId(
  characterId: string,
  gameData: PalworldGameData,
): string | null {
  const raw = characterId.trim();
  if (!raw) return null;

  const candidates = raw.startsWith("BOSS_")
    ? [raw, raw.slice("BOSS_".length)]
    : [raw];

  for (const candidate of candidates) {
    if (gameData.palsByInternal[candidate]) return candidate;
  }

  const lowerToInternal = new Map(
    Object.keys(gameData.palsByInternal).map((internal) => [
      internal.toLowerCase(),
      internal,
    ]),
  );

  for (const candidate of candidates) {
    const match = lowerToInternal.get(candidate.toLowerCase());
    if (match) return match;
  }

  return null;
}
