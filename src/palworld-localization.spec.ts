import { describe, expect, it } from "vitest";
import {
  findPalworldInternalIdByDisplayText,
  getPalworldDisplayName,
  toPalworldLocalizedNameLocale,
} from "./palworld-localization";
import type { PalworldGameData } from "./game-data-contract";

describe("Palworld localization adapter", () => {
  it("maps site locales to Palworld localized name keys without changing site locale codes", () => {
    expect(toPalworldLocalizedNameLocale("zh-CN")).toBe("zh-Hans");
    expect(toPalworldLocalizedNameLocale("zh-TW")).toBe("zh-Hant");
    expect(toPalworldLocalizedNameLocale("zh-HK")).toBe("zh-Hant");
    expect(toPalworldLocalizedNameLocale("pt")).toBe("pt-BR");
    expect(toPalworldLocalizedNameLocale("pt-BR")).toBe("pt-BR");
    expect(toPalworldLocalizedNameLocale("ja")).toBe("ja");
  });

  it("falls back to English when the site locale has no Palworld localized name", () => {
    expect(
      getPalworldDisplayName("Anubis", createTestGameData(), "zh-CN"),
    ).toBe("Simplified Anubis");
    expect(getPalworldDisplayName("Anubis", createTestGameData(), "ar")).toBe(
      "Anubis",
    );
    expect(
      getPalworldDisplayName("NoEnglish", createTestGameData(), "ar"),
    ).toBe("Base Name");
    expect(
      getPalworldDisplayName("InternalOnly", createTestGameData(), "ar"),
    ).toBe("InternalOnly");
  });

  it("resolves internal ids from localized, English, base, and internal display text", () => {
    const gameData = createTestGameData();

    expect(
      findPalworldInternalIdByDisplayText(
        "Simplified Anubis",
        gameData,
        "zh-CN",
      ),
    ).toBe("Anubis");
    expect(
      findPalworldInternalIdByDisplayText("anubis", gameData, "zh-CN"),
    ).toBe("Anubis");
    expect(
      findPalworldInternalIdByDisplayText("base name", gameData, "ar"),
    ).toBe("NoEnglish");
    expect(
      findPalworldInternalIdByDisplayText("InternalOnly", gameData, "ar"),
    ).toBe("InternalOnly");
    expect(
      findPalworldInternalIdByDisplayText("missing", gameData, "zh-CN"),
    ).toBeNull();
  });
});

function createTestGameData(): PalworldGameData {
  return {
    version: "test",
    palsByInternal: {
      Anubis: {
        name: "Anubis",
        localizedNames: {
          en: "Anubis",
          "zh-Hans": "Simplified Anubis",
          "zh-Hant": "Traditional Anubis",
          ja: "Japanese Anubis",
        },
      },
      NoEnglish: {
        name: "Base Name",
        localizedNames: {
          ja: "Japanese Base Name",
        },
      },
      InternalOnly: {},
    },
  };
}
