import type { EncodedOwnedPalsUploadPayload } from "./payload-codec";

export const PALWORLD_BREEDING_ROUTES_PATH =
  "/v1/games/palworld/breeding-routes";
export const PALWORLD_PARENT_BREEDING_OUTCOMES_PATH =
  "/v1/games/palworld/breeding-outcomes";

export interface PalworldBreedingRoutesFetchInput {
  apiBaseUrl: string;
  encoded: EncodedOwnedPalsUploadPayload;
  mode?: "formula";
  targetSpecies: string;
  startingSpecies?: string | null;
  passiveIds?: readonly string[];
}

export interface PalworldBreedingRoutesFetchRequest {
  url: string;
  init: RequestInit;
}

export interface PalworldParentBreedingOutcomesFetchInput {
  apiBaseUrl: string;
  parentSpecies: string;
  partnerSpecies?: string | null;
}

export function createPalworldBreedingRoutesFetchInput(
  input: PalworldBreedingRoutesFetchInput,
): PalworldBreedingRoutesFetchRequest {
  const targetSpecies = input.targetSpecies.trim();
  if (!targetSpecies) {
    throw new Error("Target species is required.");
  }

  const url = new URL(
    PALWORLD_BREEDING_ROUTES_PATH,
    `${input.apiBaseUrl.replace(/\/+$/u, "")}/`,
  );
  url.searchParams.set("targetSpecies", targetSpecies);
  const startingSpecies = input.startingSpecies?.trim();
  if (startingSpecies) url.searchParams.set("sourceSpecies", startingSpecies);
  if (input.mode === "formula") url.searchParams.set("mode", input.mode);
  for (const passiveId of input.passiveIds ?? []) {
    const trimmed = passiveId.trim();
    if (trimmed) url.searchParams.append("passive", trimmed);
  }
  return {
    url: url.toString(),
    init: {
      method: "POST",
      redirect: "error",
      headers: {
        "Content-Type": input.encoded.contentType,
        "Content-Encoding": input.encoded.contentEncoding,
      },
      body: toRequestBody(input.encoded.body),
    },
  };
}

export function createPalworldParentBreedingOutcomesFetchInput(
  input: PalworldParentBreedingOutcomesFetchInput,
): PalworldBreedingRoutesFetchRequest {
  const parentSpecies = input.parentSpecies.trim();
  if (!parentSpecies) {
    throw new Error("Parent species is required.");
  }

  const url = new URL(
    PALWORLD_PARENT_BREEDING_OUTCOMES_PATH,
    `${input.apiBaseUrl.replace(/\/+$/u, "")}/`,
  );
  url.searchParams.set("parentSpecies", parentSpecies);
  const partnerSpecies = input.partnerSpecies?.trim();
  if (partnerSpecies) url.searchParams.set("partnerSpecies", partnerSpecies);

  return {
    url: url.toString(),
    init: { method: "GET", redirect: "error" },
  };
}

function toRequestBody(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}
