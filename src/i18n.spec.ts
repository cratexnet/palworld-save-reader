import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ENGLISH_COMMON_MESSAGES,
  getAvailableLocales,
  I18nProvider,
  LANGUAGE_DISPLAY_NAMES,
  loadPageMessages,
  loadRuntimeLanguagePack,
  normalizeLocale,
  PALWORLD_BREEDING_CALCULATOR_LOCALES,
  readPageLocale,
  type RuntimeLanguagePack,
  useLocale,
  useTranslations,
} from "../app/src/i18n";

const EXPECTED_LOCALES = [
  "en",
  "zh-TW",
  "zh-CN",
  "ja",
  "ko",
  "th",
  "id",
  "vi",
  "fr",
  "de",
  "es",
  "es-MX",
  "it",
  "pl",
  "pt-BR",
  "ru",
  "tr",
] as const;

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ENGLISH_LOCALE_PATH = resolve(TEST_DIR, "../app/src/locales/en.json");

describe("standalone app localization", () => {
  it("keeps the hosted locale contract in CrateX.app language order", () => {
    expect(PALWORLD_BREEDING_CALCULATOR_LOCALES).toEqual(EXPECTED_LOCALES);
    expect(Object.keys(LANGUAGE_DISPLAY_NAMES).sort()).toEqual(
      [...EXPECTED_LOCALES].sort(),
    );
  });

  it("normalizes browser, site, and game locale aliases without changing public Chinese codes", () => {
    expect(normalizeLocale("zh-Hans")).toBe("zh-CN");
    expect(normalizeLocale("zh-Hant")).toBe("zh-TW");
    expect(normalizeLocale("ja-JP")).toBe("ja");
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("pt_BR")).toBe("pt-BR");
    expect(normalizeLocale("es-MX")).toBe("es-MX");
    expect(normalizeLocale("nl")).toBe("en");
  });

  it("defaults a public build to English and accepts an explicit hosted locale list", () => {
    expect(getAvailableLocales("")).toEqual(["en"]);
    expect(getAvailableLocales(EXPECTED_LOCALES.join(","))).toEqual(
      EXPECTED_LOCALES,
    );
  });

  it("detects the first available browser locale when lang is absent", () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { search: "" },
        navigator: { languages: ["nl-NL", "zh-CN", "en-US"] },
      },
    });

    try {
      expect(readPageLocale(EXPECTED_LOCALES)).toBe("zh-CN");
    } finally {
      restoreGlobal("window", originalWindow);
    }
  });

  it("uses the validated shell locale before query and browser preferences", () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        querySelector: (selector: string) =>
          selector === 'meta[name="palworld-breeding-calculator-locale"]'
            ? { getAttribute: () => "de" }
            : null,
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { search: "?lang=zh-CN" },
        navigator: { languages: ["ja-JP"] },
      },
    });

    try {
      expect(readPageLocale(EXPECTED_LOCALES)).toBe("de");
    } finally {
      restoreGlobal("document", originalDocument);
      restoreGlobal("window", originalWindow);
    }
  });

  it("bundles only English messages and falls back to them without a deployment pack", async () => {
    const english = JSON.parse(readFileSync(ENGLISH_LOCALE_PATH, "utf8")) as {
      meta_title: string;
    };

    expect((await loadPageMessages("en")).meta_title).toBe(english.meta_title);
    expect((await loadPageMessages("zh-CN")).meta_title).toBe(
      english.meta_title,
    );
  });

  it("fills missing nested runtime translations from bundled English without replacing remote data", async () => {
    const english = flattenStrings(
      JSON.parse(readFileSync(ENGLISH_LOCALE_PATH, "utf8")),
    );
    const remotePack = {
      v: 1,
      locale: "de",
      messages: {
        meta_title: "Remote calculator",
        meta_description: "Remote description",
        calculator: {
          query_mode_target_tab: "Remote target breeding",
        },
      },
      common: {
        clear: "Remote clear",
        close: "Remote close",
        search: { select: "Remote select" },
      },
      pals: { SheepBall: "Remote Lamball" },
      passiveSkills: {
        Legend: {
          name: "Remote Legend",
          description: "Remote passive description",
        },
      },
    };
    const calculatorPartialPack = await loadRuntimeLanguagePack("de", {
      baseUrl: "/games/palworld/breeding/language-packs/v1",
      fetch: (async () => Response.json(remotePack)) as unknown as typeof fetch,
    });

    let calculatorMarkup = "";
    expect(() => {
      calculatorMarkup = renderLanguagePackTranslations(calculatorPartialPack);
    }).not.toThrow();
    expect(calculatorMarkup).toContain("Remote target breeding");
    expect(calculatorMarkup).toContain(
      english["calculator.passive_placeholder"],
    );
    expect(calculatorPartialPack.locale).toBe("de");
    expect(calculatorPartialPack.pals).toEqual(remotePack.pals);
    expect(calculatorPartialPack.passiveSkills).toEqual(
      remotePack.passiveSkills,
    );

    const commonPartialPack = await loadRuntimeLanguagePack("de", {
      baseUrl: "/games/palworld/breeding/language-packs/v1",
      fetch: (async () =>
        Response.json({
          ...remotePack,
          common: {
            clear: remotePack.common.clear,
            close: remotePack.common.close,
            search: {},
          },
        })) as unknown as typeof fetch,
    });
    const commonMarkup = renderLanguagePackTranslations(commonPartialPack);

    expect(commonMarkup).toContain(remotePack.common.clear);
    expect(commonMarkup).toContain(ENGLISH_COMMON_MESSAGES.search.select);
    expect(commonPartialPack.locale).toBe("de");
    expect(commonPartialPack.pals).toEqual(remotePack.pals);
    expect(commonPartialPack.passiveSkills).toEqual(remotePack.passiveSkills);
  });

  it("keeps critical English guidance accurate and user-facing", () => {
    const strings = flattenStrings(
      JSON.parse(readFileSync(ENGLISH_LOCALE_PATH, "utf8")),
    );

    expect(strings["upload.title"]).toBe("Import save file (optional)");
    expect(strings["upload.reread_action"]).toBe("Reread save");
    expect(strings["hero.subtitle"]).toContain("Level.sav");
    expect(strings["save_locations.description"]).toContain("Level.sav");
    expect(strings["hero.subtitle"]).not.toMatch(/cop(?:y|ied)/iu);
    expect(strings["save_locations.description"]).not.toMatch(/cop(?:y|ied)/iu);
    expect(strings["error.api_unreachable"]).not.toMatch(/\bAPI\b|server/iu);
    expect(strings["error.api_server"]).not.toMatch(/\bAPI\b|server/iu);
    expect(
      new Set([
        strings["error.decompression"],
        strings["error.parser_failed"],
        strings["error.parser_timeout"],
      ]).size,
    ).toBe(3);
    expect(strings["calculator.query_mode_target_tab"]).toBe("Target breeding");
    expect(strings["calculator.query_mode_parents_tab"]).toBe("Parent lookup");
    expect(strings["calculator.import_save_optional"]).toBe(
      "Import save (optional)",
    );
    expect(strings["error.target_required"]).toBe("Choose a target Pal.");
    expect(strings["calculator.starting_parent"]).toBe(
      "Starting parent (optional)",
    );
    expect(strings["calculator.starting_parent_auto"]).toBe(
      "Auto-select from save",
    );
    expect(strings["calculator.passive_placeholder"]).toBe(
      "Search passive skill name or effect",
    );
    expect(strings["upload.action_suffix"]).toBe(
      "to show how many of each Pal you own in query results:",
    );
    expect(strings["calculator.passive_locked"]).toBe(
      "Import a save to choose up to 4 target passive skills. The calculator will use your owned Pals to calculate inheritance routes.",
    );
    expect(strings["calculator.passive_ready"]).not.toMatch(
      /checkmark|check mark/iu,
    );
  });

  it("keeps A7 readiness and requirement copy actionable without claiming inventory items or currency", () => {
    const strings = flattenStrings(
      JSON.parse(readFileSync(ENGLISH_LOCALE_PATH, "utf8")),
    );

    expect(strings["results.inventory_groups_label"]).toBe("Route readiness");
    expect(strings["results.priority_routes"]).toBe("Priority routes");
    expect(strings["results.priority_route_count"]).toBe(
      "Showing the top {shown} of {total} routes",
    );
    expect(strings["results.back_to_routes"]).toBe("Back to route list");
    expect(strings["results.groups.parents_owned"]).toBe("Owned");
    expect(strings["results.groups.needs_supplement"]).toBe("Need to add");
    expect(strings["results.excluded_by_policy"]).toBe(
      "{count} candidate breeding formulas with at least 3 blockers were excluded.",
    );
    expect(strings["results.search_truncated"]).toContain("{count}");
    expect(strings["results.search_truncated_empty"]).toBe(
      "Search reached the computation limit before finding a displayable route. Results are incomplete; try fewer passive skills or choose a starting parent.",
    );
    expect(strings["routes.parents_owned_status"]).toContain("Ready now");
    expect(strings["routes.needs_supplement_status"]).toContain("{count}");
    expect(strings["routes.requirements_title"]).toContain("required");
    expect(strings["routes.gender_reverse_item"]).toContain("{quantity}");
    expect(strings["routes.gender_reverse_target"]).toContain("{gender}");
    expect(strings["routes.passive_implant_item"]).toContain("{passive}");
    expect(strings["routes.implant_purchase"]).toMatch(
      /\{vendor\}[\s\S]*\{cost\}[\s\S]*\{currency\}/u,
    );
    expect(strings["routes.requirements_title"]).not.toMatch(
      /\bowned|already have\b/iu,
    );
  });
});

function renderLanguagePackTranslations(pack: RuntimeLanguagePack) {
  function TranslationProbe() {
    const locale = useLocale();
    const calculatorT = useTranslations("palworld-breeding-calculator");
    const commonT = useTranslations("common");
    return createElement(
      "span",
      null,
      [
        locale,
        calculatorT("calculator.query_mode_target_tab"),
        calculatorT("calculator.passive_placeholder"),
        commonT("clear"),
        commonT("search.select"),
      ].join("|"),
    );
  }

  return renderToStaticMarkup(
    createElement(I18nProvider, {
      locale: pack.locale,
      messages: pack.messages,
      common: pack.common,
      children: createElement(TranslationProbe),
    }),
  );
}

function restoreGlobal(name: "window" | "document", value: unknown) {
  if (value === undefined) {
    Reflect.deleteProperty(globalThis, name);
  } else {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
    });
  }
}

function flattenStrings(
  value: unknown,
  prefix = "",
  output: Record<string, string> = {},
): Record<string, string> {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Expected translation object at ${prefix || "root"}`);
  }
  for (const [key, nestedValue] of Object.entries(value)) {
    flattenStrings(nestedValue, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}
