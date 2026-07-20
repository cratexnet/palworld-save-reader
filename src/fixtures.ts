import type { PalworldGameData } from "./game-data-contract";

export function createPalworldBreedingFixture() {
  const gameData: PalworldGameData = {
    version: "test-data",
    palsByInternal: {
      A: { name: "Parent A" },
      B: { name: "Parent B" },
      SheepBall: { name: "Lamball" },
    },
  };

  return { gameData };
}
