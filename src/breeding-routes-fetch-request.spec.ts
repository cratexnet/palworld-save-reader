import { describe, expect, it } from "vitest";
import {
  createPalworldBreedingRoutesFetchInput,
  createPalworldParentBreedingOutcomesFetchInput,
} from "./breeding-routes-fetch-request";

describe("Palworld planner fetch request", () => {
  it("sends the selected starting species when present", () => {
    const request = createPalworldBreedingRoutesFetchInput({
      apiBaseUrl: "https://api.cratex.app",
      encoded: {
        body: new Uint8Array([1, 2, 3]),
        contentType: "application/vnd.cratex.palworld-owned-pals+json;v=1",
        contentEncoding: "gzip",
        uncompressedBytes: 3,
        compressedBytes: 3,
      },
      targetSpecies: "Anubis",
      startingSpecies: "YakushimaMonster001_Blue",
      passiveIds: [],
    });

    expect(request.url).toContain("sourceSpecies=YakushimaMonster001_Blue");
    expect(request.init.redirect).toBe("error");
  });

  it("marks hypothetical formula planning explicitly", () => {
    const request = createPalworldBreedingRoutesFetchInput({
      apiBaseUrl: "https://api.cratex.app",
      encoded: {
        body: new Uint8Array([1, 2, 3]),
        contentType: "application/vnd.cratex.palworld-owned-pals+json;v=1",
        contentEncoding: "gzip",
        uncompressedBytes: 3,
        compressedBytes: 3,
      },
      mode: "formula",
      targetSpecies: "WingGolem",
      startingSpecies: "SheepBall",
      passiveIds: [],
    });

    expect(request.url).toBe(
      "https://api.cratex.app/v1/games/palworld/breeding-routes?targetSpecies=WingGolem&sourceSpecies=SheepBall&mode=formula",
    );
  });

  it("builds a cacheable parent-outcomes GET without a request body", () => {
    const request = createPalworldParentBreedingOutcomesFetchInput({
      apiBaseUrl: "https://api.cratex.app/",
      parentSpecies: "Anubis",
      partnerSpecies: "SheepBall",
    });

    expect(request.url).toBe(
      "https://api.cratex.app/v1/games/palworld/breeding-outcomes?parentSpecies=Anubis&partnerSpecies=SheepBall",
    );
    expect(request.init).toEqual({ method: "GET", redirect: "error" });
  });
});
