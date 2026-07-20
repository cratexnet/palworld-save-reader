import { describe, expect, it } from "vitest";
import type { PalworldParentBreedingOutcome } from "./breeding-routes-api-contract";
import { dedupeParentBreedingOutcomes } from "./parent-breeding-display";

const maleParentOutcome: PalworldParentBreedingOutcome = {
  parentSpecies: "SheepBall",
  partnerSpecies: "Anubis",
  child: "ClioneTwins",
  parentRequiredGender: "Male",
  partnerRequiredGender: "Female",
};

describe("parent breeding display", () => {
  it("deduplicates formulas that differ only by swapped required genders", () => {
    const femaleParentOutcome: PalworldParentBreedingOutcome = {
      ...maleParentOutcome,
      parentRequiredGender: "Female",
      partnerRequiredGender: "Male",
    };
    const differentChild: PalworldParentBreedingOutcome = {
      ...maleParentOutcome,
      child: "Carbunclo",
    };

    expect(
      dedupeParentBreedingOutcomes([
        maleParentOutcome,
        femaleParentOutcome,
        differentChild,
      ]),
    ).toEqual([maleParentOutcome, differentChild]);
  });
});
