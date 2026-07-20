import { createPalworldV1CatalogGameData } from "./data/palworld-v1-catalog";
import { PalworldBrowserWorkbenchError } from "./browser-workbench-error";
import type { PalworldGameData } from "./game-data-contract";
import {
  createPalworldBreedingRoutesFetchInput as createBreedingRoutesFetchRequest,
  type PalworldBreedingRoutesFetchInput,
  type PalworldBreedingRoutesFetchRequest,
} from "./breeding-routes-fetch-request";
import {
  createPreparedOwnedPalsUploadWithGameData,
  type PreparedOwnedPalsUpload,
} from "./prepared-owned-pals-upload";
import type { PalworldSavDecompressionOptions } from "./save-decompression";

export { PALWORLD_BREEDING_ROUTES_PATH } from "./breeding-routes-fetch-request";
export type {
  PalworldBreedingRoutesFetchInput,
  PalworldBreedingRoutesFetchRequest,
} from "./breeding-routes-fetch-request";
export { PalworldBrowserWorkbenchError } from "./browser-workbench-error";
export type { PreparedOwnedPalsUpload } from "./prepared-owned-pals-upload";

export interface CreatePreparedOwnedPalsUploadFromSaveInput extends PalworldSavDecompressionOptions {
  saveBytes: Uint8Array;
  gameData?: PalworldGameData;
}

export function createPalworldBreedingRoutesFetchInput(
  input: PalworldBreedingRoutesFetchInput,
): PalworldBreedingRoutesFetchRequest {
  if (!input.targetSpecies.trim()) {
    throw new PalworldBrowserWorkbenchError(
      "Target species is required.",
      "invalid_request",
    );
  }
  return createBreedingRoutesFetchRequest(input);
}

export function createPreparedOwnedPalsUploadFromSaveBytes(
  input: CreatePreparedOwnedPalsUploadFromSaveInput,
): PreparedOwnedPalsUpload {
  return createPreparedOwnedPalsUploadWithGameData({
    ...input,
    gameData: input.gameData ?? createPalworldV1CatalogGameData(),
  });
}
