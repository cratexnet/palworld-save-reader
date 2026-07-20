import { describe, expect, it } from "vitest";
import {
  createPalworldV1CatalogGameData,
  PALWORLD_V1_METADATA,
} from "./palworld-v1-catalog";

describe("Palworld 1.0 data snapshot", () => {
  it("exposes the pinned English 1.0 catalog without loading formulas eagerly", () => {
    const catalog = createPalworldV1CatalogGameData();

    expect(PALWORLD_V1_METADATA).toMatchObject({
      sourceName: "tylercamp/palcalc",
      sourceCommit: "431b217b0f78bbef400baaa3aea20c8e99e9444c",
      sourceDataVersion: "v26",
      sourceLicense: "MIT",
      gameVersion: "1.0.0",
      gameDataVersion: "palworld-1.0-v26-20260711",
      compatibility: "Palworld 1.0.x",
      verifiedAgainstGameVersion: "1.0.1",
      palCount: 299,
      passiveSkillCount: 115,
    });
    expect(Object.keys(catalog.palsByInternal)).toHaveLength(299);
    expect(Object.keys(catalog.passiveSkillsByInternal ?? {})).toHaveLength(
      115,
    );
    expect(catalog.palsByInternal.BluePlatypus).toMatchObject({
      name: "Fuack",
      paldeckCode: "5",
      rarity: 1,
      minWildLevel: 6,
    });
    expect(catalog.palsByInternal.WindChimes_Ice).toMatchObject({
      name: "Hangyu Cryst",
      paldeckCode: "38B",
    });
    expect(catalog.palsByInternal.BlueDragon).toMatchObject({
      name: "Azurobe",
      paldeckCode: "41",
    });
    expect(catalog.palsByInternal.WorldTreeDragon).toMatchObject({
      name: "Astralym",
      paldeckCode: "204",
    });
    expect(catalog.passiveSkillsByInternal?.WorldTree_MoveSpeed).toMatchObject({
      name: "Dimensional Leap",
      rank: 5,
      description: expect.stringContaining("Movement Speed +50%"),
    });
    expect(catalog.palsByInternal.YakushimaMonster001).toMatchObject({
      name: "Green Slime",
    });
    expect(
      catalog.palsByInternal.YakushimaMonster001.paldeckCode,
    ).toBeUndefined();
    expect(catalog.palsByInternal.PlantSlime_Flower).toBeUndefined();
  });
});
