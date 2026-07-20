import { describe, expect, it } from "vitest";
import {
  createOozWasmPalworldOodleDecoder,
  loadOozWasmPalworldOodleDecoder,
  type OozWasmModule,
} from "./ooz-wasm-decoder";
import type { PalworldSavHeader } from "./save-file-header";

const OODLE_HEADER = {
  magic: "PlM",
  saveType: 0x31,
  compression: "oodle",
  compressedBytes: 3,
  uncompressedBytes: 5,
  dataOffset: 12,
} satisfies PalworldSavHeader;

describe("ooz-wasm Palworld Oodle decoder", () => {
  it("passes compressed bytes and expected raw size to ooz-wasm", () => {
    const calls: { compressed: Uint8Array; rawSize: number }[] = [];
    const decoded = new Uint8Array([9, 8, 7, 6, 5]);
    const oozWasm = {
      decompress(compressed, rawSize) {
        calls.push({ compressed, rawSize });
        return decoded;
      },
    } satisfies OozWasmModule;

    const compressed = new Uint8Array([1, 2, 3]);
    const decoder = createOozWasmPalworldOodleDecoder(oozWasm);

    expect(decoder(compressed, OODLE_HEADER)).toBe(decoded);
    expect(calls).toEqual([{ compressed, rawSize: 5 }]);
  });

  it("loads ooz-wasm lazily before creating the decoder", async () => {
    let loaded = false;
    const decoded = new Uint8Array([1, 3, 5, 7, 9]);
    const loadOozWasm = async () => {
      loaded = true;
      return {
        decompress: () => decoded,
      } satisfies OozWasmModule;
    };

    const decoder = await loadOozWasmPalworldOodleDecoder(loadOozWasm);

    expect(loaded).toBe(true);
    expect(decoder(new Uint8Array([2, 4]), OODLE_HEADER)).toBe(decoded);
  });
});
