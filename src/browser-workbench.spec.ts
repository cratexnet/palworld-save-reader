import { describe, expect, it } from "vitest";
import { zlibSync } from "fflate";
import {
  createPalworldBreedingRoutesFetchInput,
  createPreparedOwnedPalsUploadFromSaveBytes,
} from "./browser-workbench";
import { encodeOwnedPalsPayloadUpload } from "./payload-codec";

describe("browser workbench helpers", () => {
  it("prepares only the compact owned-Pals payload from local save bytes", () => {
    const payload = emptyGvasPayload();
    const saveBytes = wrappedSav({
      magic: "PlZ",
      compressed: zlibSync(payload),
      uncompressedBytes: payload.byteLength,
    });

    const prepared = createPreparedOwnedPalsUploadFromSaveBytes({
      saveBytes,
    });

    expect(prepared).toEqual({
      v: 1,
      pals: [],
    });
  });

  it("builds the planner fetch input without exposing raw save bytes", () => {
    const prepared = createPreparedOwnedPalsUploadFromSaveBytes({
      saveBytes: wrappedSav({
        magic: "PlZ",
        compressed: zlibSync(emptyGvasPayload()),
        uncompressedBytes: emptyGvasPayload().byteLength,
      }),
    });
    const encoded = encodeOwnedPalsPayloadUpload(prepared);

    const request = createPalworldBreedingRoutesFetchInput({
      apiBaseUrl: "https://api.example.test/",
      encoded,
      targetSpecies: "Anubis",
      passiveIds: ["Legend", "MoveSpeed_up_3"],
    });

    const url = new URL(request.url);
    expect(url.origin).toBe("https://api.example.test");
    expect(url.pathname).toBe("/v1/games/palworld/breeding-routes");
    expect(url.searchParams.get("targetSpecies")).toBe("Anubis");
    expect(url.searchParams.getAll("passive")).toEqual([
      "Legend",
      "MoveSpeed_up_3",
    ]);
    expect(url.searchParams.has("maxDepth")).toBe(false);
    expect(url.searchParams.has("limitPerDepth")).toBe(false);
    expect(request.init).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": encoded.contentType,
        "Content-Encoding": encoded.contentEncoding,
      },
    });
    expect(request.init.body).toBeInstanceOf(ArrayBuffer);
    expect((request.init.body as ArrayBuffer).byteLength).toBe(
      encoded.compressedBytes,
    );
  });
});

function wrappedSav(input: {
  magic: "PlM" | "PlZ";
  saveType?: number;
  compressed: Uint8Array;
  uncompressedBytes: number;
}) {
  const body = new Uint8Array(12 + input.compressed.byteLength);
  const view = new DataView(body.buffer);
  view.setUint32(0, input.uncompressedBytes, true);
  view.setUint32(4, input.compressed.byteLength, true);
  body.set(new TextEncoder().encode(input.magic), 8);
  body[11] = input.saveType ?? 0x31;
  body.set(input.compressed, 12);
  return body;
}

function emptyGvasPayload() {
  return bytes([
    ...ascii("GVAS"),
    ...int32(3),
    ...int32(522),
    ...int32(1008),
    ...uint16(5),
    ...uint16(1),
    ...uint16(1),
    ...uint32(0),
    ...fstring("++UE5+Release-5.1"),
    ...int32(3),
    ...uint32(0),
    ...fstring("PalWorldBaseInfoSaveGame"),
    ...propertyList(
      structProperty(
        "worldSaveData",
        "PalWorldSaveData",
        propertyList(
          property(
            "CharacterSaveParameterMap",
            "MapProperty",
            [...int32(0), ...int32(0)],
            fstring("StructProperty"),
            fstring("StructProperty"),
            [0],
          ),
        ),
      ),
    ),
    ...int32(0),
  ]);
}

function propertyList(...properties: number[][]) {
  return [...properties.flat(), ...fstring("None")];
}

function structProperty(name: string, structType: string, value: number[]) {
  return property(
    name,
    "StructProperty",
    value,
    fstring(structType),
    guidFromUint32Words([0, 0, 0, 0]),
    [0],
  );
}

function property(
  name: string,
  type: string,
  value: number[],
  ...metadata: number[][]
) {
  return [
    ...fstring(name),
    ...fstring(type),
    ...uint64(value.length),
    ...metadata.flat(),
    ...value,
  ];
}

function guidFromUint32Words(words: readonly [number, number, number, number]) {
  return words.flatMap(int32);
}

function fstring(value: string) {
  const encoded = Array.from(new TextEncoder().encode(value));
  return [...int32(encoded.length + 1), ...encoded, 0];
}

function ascii(value: string) {
  return Array.from(new TextEncoder().encode(value));
}

function int32(value: number) {
  return uint32(value);
}

function uint32(value: number) {
  return [value, value >> 8, value >> 16, value >> 24].map(
    (byte) => byte & 0xff,
  );
}

function uint16(value: number) {
  return [value, value >> 8].map((byte) => byte & 0xff);
}

function uint64(value: number) {
  return [...uint32(value), 0, 0, 0, 0];
}

function bytes(values: number[]) {
  return Uint8Array.from(values);
}
