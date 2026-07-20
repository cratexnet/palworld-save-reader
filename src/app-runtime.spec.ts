import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildCrateXGamesCategoryHref,
  buildPalworldBreedingCalculatorStandaloneHref,
  resolveBreedingRoutesApiBaseUrlFromLocation,
  shouldManagePalworldCalculatorDocumentMetadata,
} from "../app/src/runtime";

describe("standalone app runtime", () => {
  it("preserves metadata owned by a canonical localized shell", () => {
    expect(shouldManagePalworldCalculatorDocumentMetadata(null)).toBe(true);
    expect(shouldManagePalworldCalculatorDocumentMetadata("zh-CN")).toBe(false);

    const appSource = readFileSync(resolve("app/src/App.tsx"), "utf8");
    expect(appSource).toContain(
      "shouldManagePalworldCalculatorDocumentMetadata",
    );
    expect(appSource).toContain(
      'meta[name="palworld-breeding-calculator-locale"]',
    );
  });

  it("styles the localized shell as a stable hero first frame", () => {
    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");

    expect(styles).toContain(".palworld-shell-fallback");
    expect(styles).toContain(".palworld-floating-header__brand");
    expect(styles).toContain(".palworld-language-control");
    expect(styles).toContain(".palworld-shell-fallback__language");
    expect(styles).toContain(".palworld-shell-fallback__data-placeholder");
    expect(styles).not.toContain(".palworld-shell-fallback__content");
  });

  it("keeps long localized hero copy clear of the header while the planner overlaps the artwork", () => {
    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const heroCopy = pageSource.slice(
      pageSource.indexOf('className="palworld-hero-copy"'),
      pageSource.indexOf('{t("hero.title")}'),
    );
    const calculatorPanelStart = pageSource.indexOf(
      'data-testid="palworld-calculator-panel"',
    );
    const calculatorPanel = pageSource.slice(
      calculatorPanelStart,
      pageSource.indexOf("<Tabs.Root", calculatorPanelStart),
    );

    expect(heroCopy).toContain('minH={{ base: 0, md: "19.5rem" }}');
    expect(heroCopy).toContain('maxW="62rem"');
    expect(heroCopy).toContain('md: "2.5rem"');
    expect(heroCopy).toContain('lg: "3rem"');
    expect(heroCopy).not.toContain('xl: "3.5rem"');
    expect(calculatorPanel).toContain('mt={{ base: 0, md: "-7rem" }}');
    expect(calculatorPanel).toContain('position="relative"');
    expect(calculatorPanel).toContain("zIndex={2}");
    expect(styles).toContain("min-height: 19.5rem;");
    expect(styles).toContain("max-width: 62rem;");
    expect(styles).toContain("font-size: 2.5rem;");
    expect(styles).toContain("@media (min-width: 62rem)");
    expect(styles).not.toContain("font-size: 3.5rem;");
  });

  it("publishes the standalone app and GPL copy under the contracted app path", () => {
    const viteConfig = readFileSync(resolve("app/vite.config.ts"), "utf8");
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(viteConfig).toContain('base: "/games/palworld/breeding/app/"');
    expect(pageSource).toContain('href="/games/palworld/breeding/app/COPYING"');
  });

  it("uses the standalone preview origin so Vite can proxy local API calls", () => {
    expect(
      resolveBreedingRoutesApiBaseUrlFromLocation({}, "http://localhost:4323"),
    ).toBe("http://localhost:4323");
    expect(
      resolveBreedingRoutesApiBaseUrlFromLocation({}, "http://127.0.0.1:5173"),
    ).toBe("http://127.0.0.1:5173");
  });

  it("links each game locale back to the corresponding CrateX.app games category", () => {
    expect(buildCrateXGamesCategoryHref("zh-CN")).toBe("/zh-CN/cat/games");
    expect(buildCrateXGamesCategoryHref("pt-BR")).toBe("/pt/cat/games");
    expect(buildCrateXGamesCategoryHref("es-MX")).toBe("/es/cat/games");
  });

  it("builds canonical lang-query URLs for language navigation", () => {
    expect(buildPalworldBreedingCalculatorStandaloneHref("zh-CN")).toBe(
      "/games/palworld/breeding?lang=zh-CN",
    );
    expect(buildPalworldBreedingCalculatorStandaloneHref("pt-BR")).toBe(
      "/games/palworld/breeding?lang=pt-BR",
    );
    expect(
      buildPalworldBreedingCalculatorStandaloneHref(
        "ja",
        "#v=1&view=target&child=Anubis",
      ),
    ).toBe("/games/palworld/breeding?lang=ja#v=1&view=target&child=Anubis");
  });

  it("navigates language changes through canonical lang-query pages", () => {
    const appSource = readFileSync(resolve("app/src/App.tsx"), "utf8");
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(appSource).toContain(
      "buildPalworldBreedingCalculatorStandaloneHref(",
    );
    expect(appSource).toContain("window.location.hash");
    expect(appSource).toContain("window.location.assign");
    expect(appSource).toContain("onLocaleChange");
    expect(appSource).not.toContain("postMessage");
    expect(pageSource).not.toContain('.get("apiBaseUrl")');
  });

  it("shares only versioned planner query state", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const chakraSystemSource = readFileSync(
      resolve("app/src/chakra-system.ts"),
      "utf8",
    );

    expect(pageSource).toContain(
      "buildCalculatorShareHash(calculatorShareState)",
    );
    expect(pageSource).toContain("window.history.replaceState");
    expect(pageSource).toContain('data-testid="share-calculator-link"');
    expect(pageSource).toContain('typeof navigator.share === "function"');
    expect(pageSource).toContain("navigator.clipboard.writeText");
    expect(pageSource).not.toContain("navigator.maxTouchPoints");
    expect(pageSource).not.toContain("(pointer: coarse)");
    expect(pageSource).not.toContain("preparedUpload:");
    expect(chakraSystemSource).toContain("toastSlotRecipe");
  });

  it("keeps the standalone document title branded", () => {
    const i18nSource = readFileSync(resolve("app/src/i18n.tsx"), "utf8");

    expect(i18nSource).toContain("`${messages.meta_title} | CrateX.app`");
  });

  it("ships only the standalone page layout", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(pageSource).not.toContain("displayMode");
    expect(pageSource).not.toContain("embeddedTheme");
    expect(pageSource).toContain('<Box className="palworld-hero">');
    expect(pageSource).toContain('as="footer"');
    expect(pageSource).toContain('minH="100dvh"');
    expect(pageSource).toContain('bg="var(--palworld-canvas)"');
  });

  it("preserves sanitized planner state between embedded and standalone views", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("readPalworldBreedingCalculatorSessionState");
    expect(pageSource).toContain("writePalworldBreedingCalculatorSessionState");
    expect(pageSource).toContain("window.sessionStorage");
    expect(pageSource).toContain("restoredSession?.preparedUpload");
  });

  it("keeps the static application shell out of search indexes", () => {
    const indexSource = readFileSync(resolve("app/index.html"), "utf8");

    expect(indexSource).toContain(
      '<meta name="robots" content="noindex, follow" />',
    );
  });
});
