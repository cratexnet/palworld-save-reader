import { describe, expect, it } from "vitest";
import {
  getPalworldPassiveSkillDisplayName,
  listPalworldPassiveSkillOptions,
} from "./passive-skill-localization";

describe("Palworld passive skill localization", () => {
  it("uses the public English catalog by default", () => {
    expect(getPalworldPassiveSkillDisplayName("PAL_ALLAttack_up3", "en")).toBe(
      "Demon God",
    );
    expect(
      getPalworldPassiveSkillDisplayName("CoolTimeReduction_Up_1", "en"),
    ).toBe("Serenity");
    expect(getPalworldPassiveSkillDisplayName("Vampire", "en")).toBe(
      "Vampiric",
    );
  });

  it("keeps stamina passive ids mapped to the correct English names", () => {
    expect(getPalworldPassiveSkillDisplayName("Stamina_Up_1", "en")).toBe(
      "Infinite Stamina",
    );
    expect(getPalworldPassiveSkillDisplayName("Stamina_Up_2", "en")).toBe(
      "Fit as a Fiddle",
    );
    expect(getPalworldPassiveSkillDisplayName("Stamina_Up_3", "en")).toBe(
      "Eternal Engine",
    );
  });

  it("lists all passive skill options for the planner input", () => {
    const options = listPalworldPassiveSkillOptions("en");
    const vampire = options.find((option) => option.id === "Vampire");
    const salvation = options.find((option) => option.id === "Salvation");
    const cooldown = options.find(
      (option) => option.id === "CoolTimeReduction_Up_1",
    );
    const dimensionalLeap = options.find(
      (option) => option.id === "WorldTree_MoveSpeed",
    );
    const idiosyncratic = options.find(
      (option) => option.id === "MutationPal_Mutant",
    );

    expect(options.length).toBe(115);
    expect(vampire).toMatchObject({ label: "Vampiric", value: "Vampiric" });
    expect(salvation).toMatchObject({ label: "Savior", value: "Savior" });
    expect(cooldown).toMatchObject({ label: "Serenity", value: "Serenity" });
    expect(dimensionalLeap).toMatchObject({
      label: "Dimensional Leap",
      value: "Dimensional Leap",
      rank: 5,
    });
    expect(idiosyncratic?.description).toContain("Defense +25%");
    expect(idiosyncratic?.description).not.toContain("{EffectValue");
  });

  it("does not expose unresolved effect placeholders in the public catalog", () => {
    const unresolved = listPalworldPassiveSkillOptions("en").filter((option) =>
      option.description?.includes("{EffectValue"),
    );
    expect(unresolved).toEqual([]);
  });

  it("orders ranks descending and preserves the pinned Rank 4 source order", () => {
    const options = listPalworldPassiveSkillOptions("en");
    const ranks = options.map((option) => option.rank);
    const rank4Ids = options
      .filter((option) => option.rank === 4)
      .map((option) => option.id);

    expect(ranks).toEqual([...ranks].sort((left, right) => right - left));
    expect(rank4Ids.slice(0, 16)).toEqual([
      "CraftSpeed_up3",
      "Deffence_up3",
      "Rare",
      "Legend",
      "Witch",
      "EternalFlame",
      "Invader",
      "PAL_ALLAttack_up3",
      "PAL_FullStomach_Down_3",
      "PAL_Sanity_Down_3",
      "MoveSpeed_up_3",
      "Stamina_Up_3",
      "Vampire",
      "Nushi",
      "SwimSpeed_up_3",
      "Salvation",
    ]);
  });
});
