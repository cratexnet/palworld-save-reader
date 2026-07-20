/// <reference lib="webworker" />

import { createPalworldV1CatalogGameData } from "../../src/data/palworld-v1-catalog";
import { loadOozWasmPalworldOodleDecoder } from "../../src/ooz-wasm-decoder";
import {
  createPreparedOwnedPalsUploadWithGameData,
  type PreparedOwnedPalsUpload,
} from "../../src/prepared-owned-pals-upload";

interface ParseSaveRequest {
  saveBuffer: ArrayBuffer;
}

type ParseSaveResponse =
  | { ok: true; prepared: PreparedOwnedPalsUpload }
  | {
      ok: false;
      error: { name: string; message: string; code?: string };
    };

const gameData = createPalworldV1CatalogGameData();

self.addEventListener(
  "message",
  async (event: MessageEvent<ParseSaveRequest>) => {
    try {
      const saveBytes = new Uint8Array(event.data.saveBuffer);
      let prepared: PreparedOwnedPalsUpload;
      try {
        prepared = createPreparedOwnedPalsUploadWithGameData({
          saveBytes,
          gameData,
        });
      } catch (error) {
        if (getErrorCode(error) !== "unsupported_oodle_decoder") throw error;
        const oodleDecoder = await loadOozWasmPalworldOodleDecoder();
        prepared = createPreparedOwnedPalsUploadWithGameData({
          saveBytes,
          oodleDecoder,
          gameData,
        });
      }
      self.postMessage({ ok: true, prepared } satisfies ParseSaveResponse);
    } catch (error) {
      self.postMessage({
        ok: false,
        error: serializeError(error),
      } satisfies ParseSaveResponse);
    }
  },
);

function getErrorCode(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  const code = (error as Error & { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "Error", message: String(error) };
  }
  return {
    name: error.name,
    message: error.message,
    ...(getErrorCode(error) ? { code: getErrorCode(error) } : {}),
  };
}
