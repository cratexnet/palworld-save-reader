import { isCompactOwnedPalsPayload } from "../../src/owned-pals-payload";
import type { PreparedOwnedPalsUpload } from "../../src/prepared-owned-pals-upload";

export const PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY =
  "cratex:palworld-breeding-calculator:session:v1";

export type BreedingCalculatorPreparedOwnedPalsUpload = PreparedOwnedPalsUpload;

export interface PalworldBreedingCalculatorSessionState {
  preparedUpload: BreedingCalculatorPreparedOwnedPalsUpload | null;
  targetSpecies: string | null;
  startingSpecies: string | null;
  selectedPassiveIds: string[];
}

interface StoredCalculatorSessionState {
  v: 1;
  preparedUpload: BreedingCalculatorPreparedOwnedPalsUpload | null;
  targetSpecies: string | null;
  startingSpecies: string | null;
  selectedPassiveIds: string[];
}

export function readPalworldBreedingCalculatorSessionState(
  storage: Storage,
): PalworldBreedingCalculatorSessionState | null {
  try {
    const serialized = storage.getItem(
      PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY,
    );
    if (!serialized) return null;

    const value = JSON.parse(serialized) as unknown;
    if (!isStoredCalculatorSessionState(value)) {
      storage.removeItem(PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      preparedUpload: value.preparedUpload,
      targetSpecies: value.targetSpecies,
      startingSpecies: value.startingSpecies,
      selectedPassiveIds: value.selectedPassiveIds,
    };
  } catch {
    try {
      storage.removeItem(PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY);
    } catch {
      // Storage can be disabled by browser privacy settings.
    }
    return null;
  }
}

export function writePalworldBreedingCalculatorSessionState(
  storage: Storage,
  state: PalworldBreedingCalculatorSessionState,
) {
  try {
    const stored: StoredCalculatorSessionState = {
      v: 1,
      preparedUpload: state.preparedUpload,
      targetSpecies: state.targetSpecies,
      startingSpecies: state.startingSpecies,
      selectedPassiveIds: [...state.selectedPassiveIds],
    };
    storage.setItem(
      PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY,
      JSON.stringify(stored),
    );
  } catch {
    // Session handoff is best-effort; calculator operation must remain available.
  }
}

function isStoredCalculatorSessionState(
  value: unknown,
): value is StoredCalculatorSessionState {
  if (!isPlainObject(value) || value.v !== 1) return false;
  if (!isNullableString(value.targetSpecies)) return false;
  if (!isNullableString(value.startingSpecies)) return false;
  if (
    !Array.isArray(value.selectedPassiveIds) ||
    value.selectedPassiveIds.some((item) => typeof item !== "string")
  ) {
    return false;
  }
  return (
    value.preparedUpload === null ||
    isStoredPreparedUpload(value.preparedUpload)
  );
}

function isStoredPreparedUpload(
  value: unknown,
): value is BreedingCalculatorPreparedOwnedPalsUpload {
  return isCompactOwnedPalsPayload(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
