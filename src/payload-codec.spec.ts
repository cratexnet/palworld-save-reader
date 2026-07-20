import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { CompactOwnedPalsPayload } from "./owned-pals-payload";
import {
  encodeOwnedPalsPayloadUpload,
  PALWORLD_OWNED_PALS_UPLOAD_CONTENT_ENCODING,
  PALWORLD_OWNED_PALS_UPLOAD_CONTENT_TYPE,
} from "./payload-codec";

describe("palworld owned pals upload payload codec", () => {
  it("gzip-encodes compact payloads with stable upload metadata", () => {
    const payload: CompactOwnedPalsPayload = {
      v: 1,
      pals: Array.from({ length: 120 }, (_, index) => ({
        i: `pal-${index}`,
        s: index % 2 === 0 ? "FlyingManta" : "BOSS_IceHorse",
        g: index % 2 === 0 ? "M" : "F",
        p: ["Legend", "MoveSpeed_up_3"],
        l: String(index),
      })),
    };

    const encoded = encodeOwnedPalsPayloadUpload(payload);

    expect(encoded.contentType).toBe(PALWORLD_OWNED_PALS_UPLOAD_CONTENT_TYPE);
    expect(encoded.contentEncoding).toBe(
      PALWORLD_OWNED_PALS_UPLOAD_CONTENT_ENCODING,
    );
    expect(encoded.body.slice(0, 2)).toEqual(new Uint8Array([0x1f, 0x8b]));
    expect(encoded.compressedBytes).toBe(encoded.body.byteLength);
    expect(encoded.compressedBytes).toBeLessThan(encoded.uncompressedBytes);
  });

  it("keeps server-side upload decoding out of the browser source", () => {
    const source = readFileSync(resolve("src/payload-codec.ts"), "utf8");

    expect(source).not.toContain("gunzip");
    expect(source).not.toContain("decodeOwnedPalsPayloadUpload");
    expect(source).not.toContain("PalworldOwnedPalsUploadTooLargeError");
  });
});
