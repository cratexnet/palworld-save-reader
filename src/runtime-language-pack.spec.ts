import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as i18n from "../app/src/i18n";
import { createPalworldV1CatalogGameData } from "./data/palworld-v1-catalog";
import * as palLocalization from "./palworld-localization";

describe("runtime language packs", () => {
  it("loads the hosted English pack when a deployment base is configured", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        v: 1,
        locale: "en",
        messages: {
          meta_title: "Palworld Breeding Calculator",
          meta_description: "Hosted English description",
        },
        common: {
          clear: "Clear",
          close: "Close",
          search: { select: "Select" },
        },
        pals: {},
        passiveSkills: {},
      }),
    );

    const pack = await i18n.loadRuntimeLanguagePack("en", {
      baseUrl: "/games/palworld/breeding/language-packs/v1",
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/games/palworld/breeding/language-packs/v1/en.json",
      { credentials: "same-origin" },
    );
    expect(pack.messages.meta_title).toBe("Palworld Breeding Calculator");
  });

  it("loads non-English UI messages from the deployment language-pack base", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        v: 1,
        locale: "de",
        messages: {
          meta_title: "German planner",
          meta_description: "German planner description",
        },
        common: {
          clear: "Clear in German",
          close: "Close in German",
          search: { select: "Select in German" },
        },
        pals: {},
        passiveSkills: {},
      }),
    );
    const loadRuntimeLanguagePack = (
      i18n as unknown as {
        loadRuntimeLanguagePack: (
          locale: string,
          options: { baseUrl: string; fetch: typeof fetch },
        ) => Promise<{ messages: { meta_title: string } }>;
      }
    ).loadRuntimeLanguagePack;

    expect(typeof loadRuntimeLanguagePack).toBe("function");
    const pack = await loadRuntimeLanguagePack("de", {
      baseUrl: "/games/palworld/breeding/language-packs/v1",
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/games/palworld/breeding/language-packs/v1/de.json",
      { credentials: "same-origin" },
    );
    expect(pack.messages.meta_title).toBe("German planner");
  });

  it("falls back to the bundled English UI when a deployment pack cannot be fetched", async () => {
    const pack = await i18n.loadRuntimeLanguagePack("de", {
      baseUrl: "/games/palworld/breeding/language-packs/v1",
      fetch: vi.fn(async () => {
        throw new TypeError("Network unavailable");
      }) as unknown as typeof fetch,
    });

    expect(pack.locale).toBe("en");
    expect(pack.messages.meta_title).toBe("Palworld Breeding Calculator");
  });

  it("applies game-name translations without bundling them in the catalog", () => {
    const gameData = createPalworldV1CatalogGameData();
    const applyRuntimeGameLocalizations = (
      palLocalization as unknown as {
        applyRuntimeGameLocalizations: (
          gameData: ReturnType<typeof createPalworldV1CatalogGameData>,
          pack: {
            locale: string;
            pals: Record<string, string>;
            passiveSkills: Record<
              string,
              { name: string; description?: string }
            >;
          },
        ) => void;
      }
    ).applyRuntimeGameLocalizations;

    expect(typeof applyRuntimeGameLocalizations).toBe("function");
    applyRuntimeGameLocalizations(gameData, {
      locale: "de",
      pals: { SheepBall: "German Lamball" },
      passiveSkills: {
        Legend: {
          name: "German Legend",
          description: "German description",
        },
      },
    });

    expect(gameData.palsByInternal.SheepBall?.localizedNames?.de).toBe(
      "German Lamball",
    );
    expect(gameData.passiveSkillsByInternal?.Legend?.localizedNames?.de).toBe(
      "German Legend",
    );
    expect(
      gameData.passiveSkillsByInternal?.Legend?.localizedDescriptions?.de,
    ).toBe("German description");
  });

  it("routes passive labels through the runtime-localized game data", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const safePassiveLabelSource = pageSource.slice(
      pageSource.indexOf("function safePassiveLabel("),
      pageSource.indexOf("function safePalLabel("),
    );

    expect(safePassiveLabelSource).toMatch(
      /getPalworldPassiveSkillDisplayName\(\s*id,\s*locale,\s*gameData,?\s*\)/u,
    );
  });
});
