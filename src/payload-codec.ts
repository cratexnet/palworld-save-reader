import { gzipSync } from "fflate";
import type { CompactOwnedPalsPayload } from "./owned-pals-payload";

export const PALWORLD_OWNED_PALS_UPLOAD_CONTENT_TYPE =
  "application/vnd.cratex.palworld-owned-pals+json;v=1";
export const PALWORLD_OWNED_PALS_UPLOAD_CONTENT_ENCODING = "gzip";

export interface EncodedOwnedPalsUploadPayload {
  body: Uint8Array;
  contentType: typeof PALWORLD_OWNED_PALS_UPLOAD_CONTENT_TYPE;
  contentEncoding: typeof PALWORLD_OWNED_PALS_UPLOAD_CONTENT_ENCODING;
  uncompressedBytes: number;
  compressedBytes: number;
}

const textEncoder = new TextEncoder();

export function encodeOwnedPalsPayloadUpload(
  payload: CompactOwnedPalsPayload,
): EncodedOwnedPalsUploadPayload {
  const uncompressed = textEncoder.encode(JSON.stringify(payload));
  const body = gzipSync(uncompressed, { mtime: 0 });

  return {
    body,
    contentType: PALWORLD_OWNED_PALS_UPLOAD_CONTENT_TYPE,
    contentEncoding: PALWORLD_OWNED_PALS_UPLOAD_CONTENT_ENCODING,
    uncompressedBytes: uncompressed.byteLength,
    compressedBytes: body.byteLength,
  };
}
