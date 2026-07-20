import type { PalworldOodleDecoder } from "./save-decompression";

export interface OozWasmModule {
  decompress(compressed: Uint8Array, rawSize: number): Uint8Array;
}

export type OozWasmModuleLoader = () => Promise<OozWasmModule>;

export function createOozWasmPalworldOodleDecoder(
  oozWasm: OozWasmModule,
): PalworldOodleDecoder {
  return (compressed, header) =>
    oozWasm.decompress(compressed, header.uncompressedBytes);
}

export async function loadOozWasmPalworldOodleDecoder(
  loadOozWasm: OozWasmModuleLoader = () =>
    import("../vendor/palworld-ooz/index.js"),
) {
  return createOozWasmPalworldOodleDecoder(await loadOozWasm());
}
