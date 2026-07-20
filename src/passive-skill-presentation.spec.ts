import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPassiveSkillEffectExcerpt,
  resolvePassiveSkillGroup,
  resolvePassiveSkillPresentation,
} from "../app/src/passive-skill-presentation";

describe("passive skill presentation", () => {
  it("moves the matching effect line into the visible search excerpt", () => {
    const description = "Attack +15%\nDefense +15%\nWork speed +20%";

    expect(
      createPassiveSkillEffectExcerpt(description, "work speed +20%"),
    ).toBe("Work speed +20%\nAttack +15%");
    expect(createPassiveSkillEffectExcerpt(description, "rare")).toBe(
      "Attack +15%\nDefense +15%",
    );
  });

  it("maps every supported rank to its runtime-captured normal surface", () => {
    const expectedAssets = new Map([
      [-3, "passive-rank-neg3-normal.webp"],
      [-2, "passive-rank-neg2-normal.webp"],
      [-1, "passive-rank-neg1-normal.webp"],
      [0, "passive-rank-0-normal.webp"],
      [1, "passive-rank-1-normal.webp"],
      [2, "passive-rank-2-normal.webp"],
      [3, "passive-rank-3-normal.webp"],
      [4, "passive-rank-4-normal.webp"],
      [5, "passive-rank-5-normal.webp"],
    ]);

    for (const [rank, backgroundAsset] of expectedAssets) {
      expect(resolvePassiveSkillPresentation(rank)).toMatchObject({
        backgroundAsset,
      });
    }

    expect(resolvePassiveSkillPresentation(-99).backgroundAsset).toBe(
      "passive-rank-neg3-normal.webp",
    );
    expect(resolvePassiveSkillPresentation(99).backgroundAsset).toBe(
      "passive-rank-5-normal.webp",
    );
    expect(resolvePassiveSkillPresentation(Number.NaN).backgroundAsset).toBe(
      "passive-rank-0-normal.webp",
    );
    expect(
      resolvePassiveSkillPresentation(4).reducedMotionBackgroundAsset,
    ).toBe("passive-rank-4-normal-static.png");
    expect(
      resolvePassiveSkillPresentation(5).reducedMotionBackgroundAsset,
    ).toBe("passive-rank-5-normal-static.png");
  });

  it("keeps positive, negative, and rank 5 tiers distinct", () => {
    expect(resolvePassiveSkillPresentation(0)).toMatchObject({
      tier: "neutral",
    });
    expect(resolvePassiveSkillPresentation(1)).toMatchObject({
      tier: "rank1",
    });
    expect(resolvePassiveSkillPresentation(2)).toMatchObject({
      tier: "rank2Or3",
    });
    expect(resolvePassiveSkillPresentation(3)).toMatchObject({
      tier: "rank2Or3",
    });
    expect(resolvePassiveSkillPresentation(4)).toMatchObject({
      tier: "rank4",
    });
    expect(resolvePassiveSkillPresentation(5)).toMatchObject({
      tier: "rank5",
    });
    expect(resolvePassiveSkillPresentation(-3)).toMatchObject({
      tier: "negative",
    });
    expect(resolvePassiveSkillPresentation(-1)).toMatchObject({
      tier: "negative",
    });
  });

  it("groups ranks by the five distinct game surfaces", () => {
    expect(resolvePassiveSkillGroup(5)).toBe("worldTree");
    expect(resolvePassiveSkillGroup(4)).toBe("prismatic");
    expect(resolvePassiveSkillGroup(3)).toBe("gold");
    expect(resolvePassiveSkillGroup(2)).toBe("gold");
    expect(resolvePassiveSkillGroup(1)).toBe("common");
    expect(resolvePassiveSkillGroup(0)).toBe("common");
    expect(resolvePassiveSkillGroup(-1)).toBe("negative");
    expect(resolvePassiveSkillGroup(-3)).toBe("negative");
  });

  it("uses the game rank palette instead of custom rarity colors", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("rank1: {");
    expect(pageSource).toContain("rank2Or3: {");
    expect(pageSource).toContain("rank4: {");
    expect(pageSource).toContain("rank5: {");
    expect(pageSource).toContain('accent: "#ff424b"');
    expect(pageSource).toContain('accent: "#d8e1e3"');
    expect(pageSource).toContain('accent: "#ffda1a"');
    expect(pageSource).toContain('accent: "#62f8dd"');
    expect(pageSource).toContain('text: "#f2f6f7"');
    expect(pageSource).toContain('text: "#ffe45a"');
    expect(pageSource).toContain('text: "#69f5df"');
    expect(pageSource).not.toContain('text: "#d1d560"');
    expect(pageSource).not.toContain("common: {");
    expect(pageSource).not.toContain("rare: {");
    expect(pageSource).not.toContain("legendary: {");
    expect(pageSource).not.toContain("mythic: {");
  });

  it("uses the captured surface without drawing a duplicate rank arrow", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("visual.presentation.backgroundAsset");
    expect(pageSource).toContain('passiveSkillSurfaceImage ?? "none"');
    expect(pageSource).not.toContain("visual.presentation.arrowAsset");
    expect(pageSource).not.toContain("visual.presentation.arrowDirection");
    expect(pageSource).not.toContain("as={ArrowDown}");
    expect(pageSource).not.toContain("as={ArrowUp}");
  });

  it("renders passive surfaces without custom effect DOM", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(pageSource).not.toContain("PALWORLD_PRISM_TRIANGLES");
    expect(pageSource).not.toContain("function PassiveSkillEffects");
    expect(pageSource).not.toContain("<PassiveSkillEffects");
    expect(pageSource).not.toContain("palworld-passive-skill__prism");
    expect(pageSource).not.toContain("palworld-passive-skill__curse");
    expect(pageSource).toContain(
      "data-passive-tier={visual.presentation.tier}",
    );
    expect(pageSource).toContain('data-passive-motion="interactive"');
    expect(pageSource).toContain('data-passive-motion="static"');
  });

  it("renders the captured normal surface without tier-specific CSS effects", () => {
    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
    const passiveStyles = styles.slice(
      styles.indexOf(".palworld-passive-choice"),
      styles.indexOf(".palworld-passive-picker-grid"),
    );

    expect(passiveStyles).toContain(
      "background-image: var(--palworld-passive-texture)",
    );
    expect(passiveStyles).toContain("background-repeat: no-repeat");
    expect(passiveStyles).toContain("width: min(297px, 100%)");
    expect(passiveStyles).toContain("aspect-ratio: 264 / 32");
    expect(passiveStyles).not.toContain("background-color: #141c1f");
    expect(passiveStyles).toContain("background-size: contain");
    expect(passiveStyles).not.toContain(
      '.palworld-passive-skill[data-passive-tier="rank4"]::before',
    );
    expect(passiveStyles).not.toContain(
      '.palworld-passive-skill[data-passive-tier="rank5"]::before',
    );
    expect(passiveStyles).not.toContain("palworld-passive-overlay");
    expect(passiveStyles).not.toContain("palworld-passive-rank5-texture");
    expect(passiveStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(passiveStyles).toContain(
      "background-image: var(--palworld-passive-texture-reduced-motion)",
    );
    expect(passiveStyles).not.toContain("brightness(1.1)");
    expect(passiveStyles).toContain(
      '.palworld-passive-skill[data-passive-tier="neutral"]::after',
    );
    expect(passiveStyles).toContain(
      '.palworld-passive-skill[data-passive-tier="rank1"]::after',
    );
    expect(passiveStyles).toContain(
      "box-shadow: inset 0 0 0 1px rgb(255 255 255)",
    );

    const emptySlotStart = passiveStyles.indexOf(".palworld-passive-slot-add");
    const emptySlotStyles = passiveStyles.slice(
      emptySlotStart,
      passiveStyles.indexOf("\n}", emptySlotStart) + 2,
    );
    expect(emptySlotStyles).toContain("height: auto");
    expect(emptySlotStyles).toContain("min-height: 0");
    expect(emptySlotStyles).toContain("aspect-ratio: 264 / 32");
  });

  it("renders one selection frame only for selected choices", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const pickerOptionSource = pageSource.slice(
      pageSource.indexOf("function renderOption(option: SearchOption)"),
      pageSource.indexOf("function renderTierGroup("),
    );
    const selectedPassiveSource = pageSource.slice(
      pageSource.indexOf("function SelectedPassiveSkill("),
      pageSource.indexOf("function genderLabel("),
    );

    expect(pickerOptionSource).toMatch(
      /\{selected \? \(\s*<span[\s\S]*?palworld-passive-skill__selection-frame/u,
    );
    expect(selectedPassiveSource).not.toContain(
      'className="palworld-passive-skill__selection-frame"',
    );
    expect(selectedPassiveSource).toContain(
      'data-disabled={disabled ? "" : undefined}',
    );

    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
    const passiveStyles = styles.slice(
      styles.indexOf(".palworld-passive-choice"),
      styles.indexOf(".palworld-passive-picker-grid"),
    );
    const selectionFrameStyles = passiveStyles.slice(
      passiveStyles.indexOf(".palworld-passive-skill__selection-frame"),
      passiveStyles.indexOf(".palworld-passive-skill__content"),
    );
    expect(passiveStyles).toContain(".palworld-passive-skill__selection-frame");
    expect(selectionFrameStyles).toContain("inset: 0;");
    expect(selectionFrameStyles).not.toContain("inset: 3px;");
    expect(passiveStyles).toContain("filter: brightness(0.62) saturate(0.48)");
  });

  it("keeps long picker labels on one line inside the captured surface", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const pickerOptionSource = pageSource.slice(
      pageSource.indexOf("function renderOption(option: SearchOption)"),
      pageSource.indexOf("function renderTierGroup("),
    );

    expect(pickerOptionSource).toContain('fontSize="xs"');
    expect(pickerOptionSource).toContain("minH={0}");
    expect(pickerOptionSource).toContain("borderWidth={0}");
    expect(pickerOptionSource).toContain("lineClamp={1}");
    expect(pickerOptionSource).toContain(
      '<Box as="span" w={8} flexShrink={0} aria-hidden="true" />',
    );
  });

  it("fits selected labels inside an undistorted captured surface", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
    const selectedPassiveSource = pageSource.slice(
      pageSource.indexOf("function SelectedPassiveSkill("),
      pageSource.indexOf("function genderLabel("),
    );
    const selectedSkillSurface = selectedPassiveSource.slice(
      selectedPassiveSource.indexOf('data-testid="selected-passive-skill"'),
      selectedPassiveSource.indexOf("</HStack>") + "</HStack>".length,
    );

    expect(pageSource).toContain(
      "const PASSIVE_LABEL_FONT_SIZES = [14, 13, 12, 11.25] as const;",
    );
    expect(pageSource).toContain("function FittedPassiveSkillLabel(");
    expect(pageSource).toContain("new ResizeObserver");
    expect(selectedPassiveSource).toContain(
      'className="palworld-selected-passive"',
    );
    expect(selectedPassiveSource).toContain("<FittedPassiveSkillLabel");
    expect(selectedPassiveSource).toContain('h="full"');
    expect(selectedPassiveSource).toContain("minH={0}");
    expect(selectedPassiveSource).toContain("ps={3}");
    expect(selectedPassiveSource).toContain(
      '<Box as="span" w={6} flexShrink={0} aria-hidden="true" />',
    );
    expect(selectedSkillSurface).not.toContain("onRemove");
    expect(selectedPassiveSource).toContain(
      'data-testid="selected-passive-remove"',
    );
    expect(styles).toContain("grid-template-columns: minmax(0, 297px) 2rem;");
    expect(styles).toContain("width: min(337px, 100%);");
    expect(styles).toContain("repeat(2, minmax(0, 337px))");
  });

  it("keeps the neutral backing inside each original passive skill surface", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
    const passiveSkillStyleSource = pageSource.slice(
      pageSource.indexOf("function passiveSkillSurfaceStyle("),
      pageSource.indexOf("function PassiveSkillContent("),
    );
    const passiveSurfaceStyles = styles.slice(
      styles.indexOf(".palworld-passive-skill {"),
      styles.indexOf(".palworld-passive-skill::before"),
    );
    const passiveTextureStyles = styles.slice(
      styles.indexOf(".palworld-passive-skill::before"),
      styles.indexOf(".palworld-passive-skill > *"),
    );

    expect(pageSource).toContain('className="palworld-selected-passive-grid"');
    expect(pageSource).not.toContain("palworld-passive-context");
    expect(styles).not.toContain(".palworld-passive-context");
    expect(passiveSkillStyleSource).toContain(
      "passive-skill-base-neutral.webp",
    );
    expect(passiveSkillStyleSource).toContain('"--palworld-passive-backing":');
    expect(passiveSurfaceStyles).toContain(
      "background-image: var(--palworld-passive-backing);",
    );
    expect(passiveSurfaceStyles).toContain("background-repeat: no-repeat;");
    expect(passiveSurfaceStyles).toContain("background-position: center;");
    expect(passiveSurfaceStyles).toContain("background-size: contain;");
    expect(passiveTextureStyles).toContain("background-repeat: no-repeat;");
    expect(passiveTextureStyles).toContain("background-position: center;");
    expect(passiveTextureStyles).toContain("background-size: contain;");
  });

  it("places a plain owned count beside each passive skill surface", () => {
    const pageSource = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );
    const pickerOptionSource = pageSource.slice(
      pageSource.indexOf("function renderOption(option: SearchOption)"),
      pageSource.indexOf("function renderTierGroup("),
    );

    expect(pickerOptionSource).toContain('data-testid="owned-passive-count"');
    expect(pickerOptionSource).toContain(
      'className="palworld-passive-choice__surface"',
    );
    expect(pickerOptionSource).toContain(
      'className="palworld-passive-owned-count"',
    );
    expect(pickerOptionSource).toContain("x{ownedCount}");
    expect(pickerOptionSource).not.toContain("×{ownedCount}");
    expect(pickerOptionSource).not.toContain("<AppIcon as={Check}");
    expect(pickerOptionSource).not.toContain("{ownershipLabel}</Text>");
  });
});
