import { describe, expect, it } from "vitest";
import { extractPalworldOwnedPalsFromLevelSaveJson } from "./save-json-extractor";
import { decodePalworldRawCharacterSaveParameter } from "./save-raw-character-decoder";

describe("palworld raw character decoder", () => {
  it("decodes SaveParameter fields needed for owned Pal inventory extraction", () => {
    const rawValues = buildRawCharacterSaveParameter({
      characterId: "Alpaca",
      gender: "EPalGenderType::Female",
      ownerPlayerUidWords: [0, 0, 0, 1],
      passiveIds: ["Legend", "Deffence_down2"],
      slotIndex: 177,
    });

    const decoded = decodePalworldRawCharacterSaveParameter(rawValues);

    expect(decoded).toMatchObject({
      SaveParameter: {
        type: "StructProperty",
        value: {
          CharacterID: {
            type: "NameProperty",
            value: "Alpaca",
          },
          Gender: {
            type: "EnumProperty",
            value: "EPalGenderType::Female",
          },
          OwnerPlayerUId: {
            type: "StructProperty",
            value: "00000000-0000-0000-0000-000000000001",
          },
          SlotId: {
            type: "StructProperty",
            value: {
              SlotIndex: {
                type: "IntProperty",
                value: 177,
              },
            },
          },
        },
      },
    });
  });

  it("feeds decoded RawData into the Level.sav JSON extractor", () => {
    const rawValues = buildRawCharacterSaveParameter({
      characterId: "Alpaca",
      gender: "EPalGenderType::Female",
      ownerPlayerUidWords: [0, 0, 0, 1],
      passiveIds: ["Legend", "Deffence_down2"],
      slotIndex: 177,
    });
    const levelSaveJson = {
      properties: {
        worldSaveData: {
          value: {
            CharacterSaveParameterMap: {
              value: [
                {
                  key: {
                    InstanceId: {
                      type: "StructProperty",
                      value: "9297a2b4-48e2-e000-6973-bfbe8332e4ef",
                    },
                  },
                  value: {
                    RawData: {
                      value: {
                        values: Array.from(rawValues),
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    };

    const rows = extractPalworldOwnedPalsFromLevelSaveJson(levelSaveJson, {
      decodeRawCharacter: decodePalworldRawCharacterSaveParameter,
    });

    expect(rows).toEqual([
      {
        instanceId: "9297a2b4-48e2-e000-6973-bfbe8332e4ef",
        characterId: "Alpaca",
        gender: "EPalGenderType::Female",
        passiveIds: ["Legend", "Deffence_down2"],
        slotIndex: 177,
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
  return property(name, "NameProperty", fstring(value));
}

function enumProperty(name: string, enumType: string, value: string) {
  return property(name, "EnumProperty", fstring(value), fstring(enumType));
}

function intProperty(name: string, value: number) {
  return property(name, "IntProperty", int32(value));
}

function arrayProperty(
  name: string,
  innerType: string,
  ...valueParts: number[][]
) {
  return property(name, "ArrayProperty", valueParts.flat(), fstring(innerType));
}

function structProperty(name: string, structType: string, value: number[]) {
  return property(
    name,
    "StructProperty",
    value,
    fstring(structType),
    guidFromUint32Words([0, 0, 0, 0]),
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
    ...int64(value.length),
    ...metadata.flat(),
    0,
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

function int32(value: number) {
  return [value, value >> 8, value >> 16, value >> 24].map(
    (byte) => byte & 0xff,
  );
}

function int64(value: number) {
  return [...int32(value), 0, 0, 0, 0];
}

function bytes(values: number[]) {
  return Uint8Array.from(values);
}
