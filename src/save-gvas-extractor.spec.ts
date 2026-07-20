import { describe, expect, it } from "vitest";
import { extractPalworldOwnedPalsFromGvasPayload } from "./save-gvas-extractor";

describe("palworld GVAS inventory extractor", () => {
  it("extracts owned Pal rows from a UE5 Level.sav GVAS payload", () => {
    const rawCharacter = buildRawCharacterSaveParameter({
      characterId: "Alpaca",
      gender: "EPalGenderType::Female",
      ownerPlayerUidWords: [0, 0, 0, 1],
      passiveIds: ["Legend", "Deffence_down2"],
      slotIndex: 177,
    });
    const payload = gvasPayload(
      intProperty("Version", 1),
      structProperty("Timestamp", "DateTime", uint64(123)),
      intProperty("Revision", 9),
      structProperty(
        "worldSaveData",
        "PalWorldSaveData",
        propertyList(characterSaveParameterMap(rawCharacter)),
      ),
    );

    const rows = extractPalworldOwnedPalsFromGvasPayload(payload);

    expect(rows).toEqual([
      {
        instanceId: "00000002-0000-0000-0000-000000000003",
        characterId: "Alpaca",
        gender: "EPalGenderType::Female",
        passiveIds: ["Legend", "Deffence_down2"],
        slotIndex: 177,
      },
    ]);
  });

  it("includes base workers linked to the player by character container slots", () => {
    const baseWorker = buildRawCharacterSaveParameter({
      characterId: "Anubis",
      gender: "EPalGenderType::Male",
      ownerPlayerUidWords: [0, 0, 0, 0],
      passiveIds: ["CraftSpeed_up3"],
      slotIndex: 4,
    });
    const payload = gvasPayload(
      structProperty(
        "worldSaveData",
        "PalWorldSaveData",
        propertyList(
          characterSaveParameterMap([
            {
              instanceIdWords: [4, 0, 0, 5],
              playerUidWords: [0, 0, 0, 0],
              rawCharacter: baseWorker,
            },
          ]),
          characterContainerSaveData([
            {
              containerIdWords: [6, 0, 0, 7],
              slotNum: 15,
              slots: [
                {
                  slotIndex: 4,
                  playerUidWords: [0, 0, 0, 1],
                  instanceIdWords: [4, 0, 0, 5],
                },
              ],
            },
          ]),
        ),
      ),
    );

    expect(extractPalworldOwnedPalsFromGvasPayload(payload)).toEqual([
      {
        instanceId: "00000004-0000-0000-0000-000000000005",
        characterId: "Anubis",
        gender: "EPalGenderType::Male",
        passiveIds: ["CraftSpeed_up3"],
        containerType: "base",
        slotIndex: 4,
      },
    ]);
  });
});

interface RawCharacterFixtureOptions {
  characterId: string;
  gender: string;
  ownerPlayerUidWords: readonly [number, number, number, number];
  passiveIds: readonly string[];
  slotIndex: number;
}

function gvasPayload(...properties: number[][]) {
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
    ...propertyList(...properties),
    ...int32(0),
  ]);
}

function characterSaveParameterMap(
  input:
    | Uint8Array
    | readonly {
        instanceIdWords: readonly [number, number, number, number];
        playerUidWords: readonly [number, number, number, number];
        rawCharacter: Uint8Array;
      }[],
) {
  const characters =
    input instanceof Uint8Array
      ? [
          {
            instanceIdWords: [2, 0, 0, 3] as const,
            playerUidWords: [0, 0, 0, 1] as const,
            rawCharacter: input,
          },
        ]
      : input;
  const entries = characters.flatMap((character) => [
    propertyList(
      structProperty(
        "PlayerUId",
        "Guid",
        guidFromUint32Words(character.playerUidWords),
      ),
      structProperty(
        "InstanceId",
        "Guid",
        guidFromUint32Words(character.instanceIdWords),
      ),
      strProperty("DebugName", ""),
    ),
    propertyList(byteArrayProperty("RawData", character.rawCharacter)),
  ]);
  return property(
    "CharacterSaveParameterMap",
    "MapProperty",
    [...int32(0), ...int32(characters.length), ...entries.flat()],
    fstring("StructProperty"),
    fstring("StructProperty"),
    optionalGuid(null),
  );
}

function characterContainerSaveData(
  containers: readonly {
    containerIdWords: readonly [number, number, number, number];
    slotNum: number;
    slots: readonly {
      slotIndex: number;
      playerUidWords: readonly [number, number, number, number];
      instanceIdWords: readonly [number, number, number, number];
    }[];
  }[],
) {
  const entries = containers.flatMap((container) => [
    propertyList(
      structProperty(
        "ID",
        "Guid",
        guidFromUint32Words(container.containerIdWords),
      ),
    ),
    propertyList(
      structArrayProperty(
        "Slots",
        "PalCharacterSlotSaveData",
        container.slots.map((slot) =>
          propertyList(
            intProperty("SlotIndex", slot.slotIndex),
            byteArrayProperty(
              "RawData",
              bytes([
                ...guidFromUint32Words(slot.playerUidWords),
                ...guidFromUint32Words(slot.instanceIdWords),
                0,
              ]),
            ),
          ),
        ),
      ),
      intProperty("SlotNum", container.slotNum),
    ),
  ]);
  return property(
    "CharacterContainerSaveData",
    "MapProperty",
    [...int32(0), ...int32(containers.length), ...entries.flat()],
    fstring("StructProperty"),
    fstring("StructProperty"),
    optionalGuid(null),
  );
}

function buildRawCharacterSaveParameter(options: RawCharacterFixtureOptions) {
  return bytes(
    propertyList(
      structProperty(
        "SaveParameter",
        "PalIndividualCharacterSaveParameter",
        propertyList(
          nameProperty("CharacterID", options.characterId),
          enumProperty("Gender", "EPalGenderType", options.gender),
          structProperty(
            "OwnerPlayerUId",
            "Guid",
            guidFromUint32Words(options.ownerPlayerUidWords),
          ),
          arrayProperty(
            "PassiveSkillList",
            "NameProperty",
            int32(options.passiveIds.length),
            ...options.passiveIds.map(fstring),
          ),
          structProperty(
            "SlotId",
            "PalCharacterSlotId",
            propertyList(intProperty("SlotIndex", options.slotIndex)),
          ),
        ),
      ),
    ),
  );
}

function propertyList(...properties: number[][]) {
  return [...properties.flat(), ...fstring("None")];
}

function nameProperty(name: string, value: string) {
  return property(name, "NameProperty", fstring(value), optionalGuid(null));
}

function strProperty(name: string, value: string) {
  return property(name, "StrProperty", fstring(value), optionalGuid(null));
}

function enumProperty(name: string, enumType: string, value: string) {
  return property(
    name,
    "EnumProperty",
    fstring(value),
    fstring(enumType),
    optionalGuid(null),
  );
}

function intProperty(name: string, value: number) {
  return property(name, "IntProperty", int32(value), optionalGuid(null));
}

function byteArrayProperty(name: string, values: Uint8Array) {
  return arrayProperty(
    name,
    "ByteProperty",
    int32(values.byteLength),
    Array.from(values),
  );
}

function arrayProperty(
  name: string,
  innerType: string,
  ...valueParts: number[][]
) {
  return property(
    name,
    "ArrayProperty",
    valueParts.flat(),
    fstring(innerType),
    optionalGuid(null),
  );
}

function structArrayProperty(
  name: string,
  structType: string,
  values: readonly number[][],
) {
  const data = values.flat();
  return arrayProperty(
    name,
    "StructProperty",
    int32(values.length),
    fstring(name),
    fstring("StructProperty"),
    uint64(data.length),
    fstring(structType),
    guidFromUint32Words([0, 0, 0, 0]),
    [0],
    data,
  );
}

function structProperty(name: string, structType: string, value: number[]) {
  return property(
    name,
    "StructProperty",
    value,
    fstring(structType),
    guidFromUint32Words([0, 0, 0, 0]),
    optionalGuid(null),
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

function optionalGuid(value: number[] | null) {
  return value ? [1, ...value] : [0];
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
