import { describe, expect, it } from "vitest";
import { summarizePalworldOwnedPassiveSkills } from "./owned-passive-summary";
import type { CompactOwnedPalsPayload } from "./owned-pals-payload";

describe("Palworld owned passive summary", () => {
  it("counts distinct owned Pals per passive and sorts by count then id", () => {
    const payload: CompactOwnedPalsPayload = {
      v: 1,
      pals: [
        {
          i: "a",
          s: "Anubis",
          p: ["Legend", "Legend", "MoveSpeed_up_3"],
        },
        {
          i: "b",
          s: "BlueDragon",
          p: ["MoveSpeed_up_3", "PAL_ALLAttack_up3"],
        },
        {
          i: "c",
          s: "BirdDragon",
          p: ["Legend", "PAL_ALLAttack_up3"],
        },
        {
          i: "d",
          s: "SheepBall",
          p: [],
        },
      ],
    };

    expect(summarizePalworldOwnedPassiveSkills(payload)).toEqual([
      { id: "Legend", count: 2 },
      { id: "MoveSpeed_up_3", count: 2 },
      { id: "PAL_ALLAttack_up3", count: 2 },
    ]);
  });

  it("caps the result after sorting", () => {
    const payload: CompactOwnedPalsPayload = {
      v: 1,
      pals: [
        { i: "a", s: "A", p: ["B", "A"] },
        { i: "b", s: "B", p: ["A"] },
        { i: "c", s: "C", p: ["C"] },
      ],
    };

    expect(summarizePalworldOwnedPassiveSkills(payload, { limit: 2 })).toEqual([
      { id: "A", count: 2 },
      { id: "B", count: 1 },
    ]);
  });

  it("can prioritize useful passives before count-based sorting", () => {
    const payload: CompactOwnedPalsPayload = {
      v: 1,
      pals: [
        { i: "a", s: "A", p: ["Deffence_down1", "Legend"] },
        { i: "b", s: "B", p: ["Deffence_down1", "MoveSpeed_up_3"] },
        { i: "c", s: "C", p: ["Deffence_down1", "PAL_ALLAttack_up3"] },
      ],
    };

    expect(
      summarizePalworldOwnedPassiveSkills(payload, {
        priorityIds: ["Legend", "PAL_ALLAttack_up3", "MoveSpeed_up_3"],
      }),
    ).toEqual([
      { id: "Legend", count: 1 },
      { id: "PAL_ALLAttack_up3", count: 1 },
      { id: "MoveSpeed_up_3", count: 1 },
      { id: "Deffence_down1", count: 3 },
    ]);
  });
});
