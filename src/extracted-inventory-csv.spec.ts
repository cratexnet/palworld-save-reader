import { describe, expect, it } from "vitest";
import { parsePalworldOwnedPalsCsv } from "./extracted-inventory-csv";
import { createCompactOwnedPalsPayloadFromExtractRows } from "./extracted-inventory-payload";
import { createPalworldBreedingFixture } from "./fixtures";

describe("palworld extracted inventory CSV parser", () => {
  it("parses owned-Pal CSV exports into extracted rows", () => {
    const csv = [
      "\uFEFFinstance_id,character_id,nickname,level,gender,passive_ids,slot_index",
      "slot-a,A,,12,Male,Legend;MoveSpeed_up_3,10",
      'slot-b,B,"quoted, name",8,Female,Stamina_Up_3,11',
    ].join("\n");

    expect(parsePalworldOwnedPalsCsv(csv)).toEqual([
      {
        instanceId: "slot-a",
        characterId: "A",
        gender: "Male",
        passiveIds: "Legend;MoveSpeed_up_3",
        slotIndex: "10",
      },
      {
        instanceId: "slot-b",
        characterId: "B",
        gender: "Female",
        passiveIds: "Stamina_Up_3",
        slotIndex: "11",
      },
    ]);
  });

  it("feeds parsed CSV rows into the compact payload builder", () => {
    const fixture = createPalworldBreedingFixture();
    const rows = parsePalworldOwnedPalsCsv(
      [
        "instance_id,character_id,gender,passive_ids,slot_index",
        "slot-a,a,Male,Legend,10",
        "slot-b,SalesPerson_Wander,,MoveSpeed_up_3,11",
      ].join("\n"),
    );

    const result = createCompactOwnedPalsPayloadFromExtractRows({
      gameData: fixture.gameData,
      rows,
    });

    expect(result.payload).toEqual({
      v: 1,
      pals: [
        {
          i: "pal-1",
          s: "A",
          g: "M",
          p: ["Legend"],
          l: "10",
        },
      ],
    });
    expect(result.skippedRows).toEqual([
      {
        index: 1,
        characterId: "SalesPerson_Wander",
        reason: "unrecognized_species",
      },
    ]);
  });

  it("rejects CSV text without required inventory columns", () => {
    expect(() => parsePalworldOwnedPalsCsv("id,name\n1,foo")).toThrow(
      "required column",
    );
  });
});
