#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import {
  createPreparedOwnedPalsUploadFromSaveBytes,
  encodeOwnedPalsPayloadUpload,
  PALWORLD_V1_METADATA,
} from "palworld-save-reader/public-client";
import { loadOozWasmPalworldOodleDecoder } from "palworld-save-reader/ooz-wasm";

const savePath = process.argv[2];

if (!savePath) {
  console.error(
    "Usage: pnpm build && node scripts/smoke-real-save.mjs <path-to-Level.sav>",
  );
  process.exit(64);
}

const saveBytes = new Uint8Array(await readFile(savePath));
const oodleDecoder = await loadOozWasmPalworldOodleDecoder();
const prepared = createPreparedOwnedPalsUploadFromSaveBytes({
  saveBytes,
  oodleDecoder,
});
const encoded = encodeOwnedPalsPayloadUpload(prepared);

console.log(
  JSON.stringify(
    {
      status: "parsed",
      dataVersion: PALWORLD_V1_METADATA.gameDataVersion,
      payloadVersion: prepared.v,
      compactPals: prepared.pals.length,
      containsRawInstanceId: prepared.pals.some(
        (pal) => !/^pal-\d+$/u.test(pal.i),
      ),
      upload: {
        contentType: encoded.contentType,
        contentEncoding: encoded.contentEncoding,
        uncompressedBytes: encoded.uncompressedBytes,
        compressedBytes: encoded.compressedBytes,
      },
    },
    null,
    2,
  ),
);
