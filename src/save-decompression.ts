import { unzlibSync } from "fflate";
import {
  parsePalworldSavHeader,
  type PalworldSavHeader,
} from "./save-file-header";

export class PalworldSavDecompressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PalworldSavDecompressionError";
  }
}

export type PalworldOodleDecoder = (
  compressed: Uint8Array,
  header: PalworldSavHeader,
) => Uint8Array;

export interface PalworldSavDecompressionOptions {
  oodleDecoder?: PalworldOodleDecoder;
}

export interface PalworldSavDecompressionResult {
  header: PalworldSavHeader;
  payload: Uint8Array;
}

export function decompressPalworldSavPayload(
  data: Uint8Array,
  options: PalworldSavDecompressionOptions = {},
): PalworldSavDecompressionResult {
  const header = parsePalworldSavHeader(data);
  const compressed = readCompressedPayload(data, header);
  const payload =
    header.compression === "oodle"
      ? decompressOodlePayload(compressed, header, options)
      : decompressZlibPayload(compressed);

  if (payload.byteLength !== header.uncompressedBytes) {
    throw new PalworldSavDecompressionError(
      `Palworld save decompressed to ${payload.byteLength} bytes, expected ${header.uncompressedBytes}.`,
    );
  }

  return {
    header,
    payload,
  };
}

function readCompressedPayload(data: Uint8Array, header: PalworldSavHeader) {
  const endOffset = header.dataOffset + header.compressedBytes;
  if (endOffset > data.byteLength) {
    throw new PalworldSavDecompressionError(
      `Palworld save payload is truncated: expected ${header.compressedBytes} compressed bytes.`,
    );
  }
  return data.subarray(header.dataOffset, endOffset);
}

function decompressOodlePayload(
  compressed: Uint8Array,
  header: PalworldSavHeader,
  options: PalworldSavDecompressionOptions,
) {
  if (!options.oodleDecoder) {
    throw new PalworldSavDecompressionError(
      "Palworld PlM saves require an Oodle decoder.",
    );
  }
  return options.oodleDecoder(compressed, header);
}

function decompressZlibPayload(compressed: Uint8Array) {
  try {
    return unzlibSync(compressed);
  } catch (error) {
    throw new PalworldSavDecompressionError(
      error instanceof Error
        ? `Could not decompress Palworld zlib payload: ${error.message}`
        : "Could not decompress Palworld zlib payload.",
    );
  }
}
