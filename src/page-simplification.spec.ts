import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
  "utf8",
);
const styles = readFileSync(resolve("app/src/styles.css"), "utf8");
const resultsSearchToolbarSource = readFileSync(
  resolve("app/src/ResultsSearchToolbar.tsx"),
  "utf8",
);

function dialogSource(testId: string) {
  const marker = source.indexOf(`data-testid="${testId}"`);
  const start = source.lastIndexOf("<Dialog.Root", marker);
  const end = source.indexOf("</Dialog.Root>", marker);
  return source.slice(start, end + "</Dialog.Root>".length);
}

function flattenMessageKeys(
  value: Record<string, unknown>,
  prefix = "",
): string[] {
  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return nested && typeof nested === "object" && !Array.isArray(nested)
      ? flattenMessageKeys(nested as Record<string, unknown>, path)
      : [path];
  });
}

describe("standalone calculator page simplification", () => {
  it("keeps the CrateX.app brand mark in the standalone header", () => {
    expect(source).toContain('const cratexLogo32Href = "/favicon-32.png";');
    expect(source).toContain('const cratexLogo64Href = "/favicon-64.png";');
    expect(source).toContain("src={cratexLogo32Href}");
    expect(source).toContain(
      "srcSet={`${cratexLogo32Href} 1x, ${cratexLogo64Href} 2x`}",
    );
  });

  it("keeps brand and language controls in one fixed floating header", () => {
    const headerMarker = source.indexOf(
      'data-testid="palworld-floating-header"',
    );
    const headerSource = source.slice(
      source.lastIndexOf("<Box", headerMarker),
      source.indexOf('<Box className="palworld-hero">'),
    );
    const headerRule = styles.slice(
      styles.indexOf(".palworld-floating-header {"),
      styles.indexOf(".palworld-floating-header__inner {"),
    );
    const innerRule = styles.slice(
      styles.indexOf(".palworld-floating-header__inner {"),
      styles.indexOf(".palworld-floating-header__brand {"),
    );

    expect(headerSource).toContain('as="header"');
    expect(headerSource).toContain(
      'className="palworld-floating-header__inner"',
    );
    expect(headerSource).toContain('className="palworld-language-control"');
    expect(headerSource).toContain("as={Languages}");
    expect(headerSource).not.toContain('flexWrap="wrap"');
    expect(
      source.indexOf('data-testid="palworld-floating-header"'),
    ).toBeLessThan(source.indexOf('<Box className="palworld-hero">'));
    expect(headerRule).toContain("position: fixed;");
    expect(headerRule).toContain("pointer-events: none;");
    expect(innerRule).toContain("flex-wrap: nowrap;");
  });

  it("keeps every route in the single deduplicated route collection", () => {
    const collectionCalls = source.match(/<RouteCollection[\s\S]*?\/>/gu) ?? [];

    expect(collectionCalls).toHaveLength(1);
    expect(source).not.toContain("const remainingRoutes = allRoutes.slice(1)");
    expect(collectionCalls[0]).toContain("routes={allRoutes}");
  });

  it("keeps formula routes compact and free of inventory-only diagnostics", () => {
    expect(source).toContain("function FormulaRouteCard(");
    expect(source).toContain("function CompactFormulaRouteRow(");
    expect(source).toContain("if (isFormulaMode) {");
    expect(source).toContain("<FormulaRouteCard");
    expect(source).toContain('if (mode === "formula") {');
    expect(source).toContain("<CompactFormulaRouteRow");
    expect(source).not.toContain('t("routes.formula_available")');
    expect(source).not.toContain('t("routes.formula_badge")');
    expect(source).not.toContain('t("routes.formula_reason")');
    expect(source).not.toContain('t("routes.formula_mode_title")');
  });

  it("uses plus and equals operators in every breeding equation", () => {
    const formulaRouteCard = source.slice(
      source.indexOf("function FormulaRouteCard("),
      source.indexOf("function RouteCard("),
    );
    const routeCard = source.slice(
      source.indexOf("function RouteCard("),
      source.indexOf("function RouteCollection("),
    );
    const equationOperator = source.slice(
      source.indexOf("function BreedingEquationOperator("),
      source.indexOf("function FormulaRouteCard("),
    );
    const compactFormulaRow = source.slice(
      source.indexOf("function CompactFormulaRouteRow("),
      source.indexOf("function ParentBreedingResults("),
    );
    const parentBreedingResults = source.slice(
      source.indexOf("function ParentBreedingResults("),
      source.indexOf("function CompactFormulaPal("),
    );

    expect(source).toContain("function BreedingEquationOperator(");
    expect(source).not.toContain("Heart");
    for (const routeView of [formulaRouteCard, routeCard]) {
      expect(routeView).toContain('<BreedingEquationOperator operator="+" />');
      expect(routeView).toContain('<BreedingEquationOperator operator="=" />');
    }
    expect(equationOperator).not.toContain('aria-hidden="true"');
    expect(compactFormulaRow).not.toContain('aria-hidden="true"');
    expect(parentBreedingResults).not.toMatch(
      /palworld-compact-formula-operator[^>]*aria-hidden/u,
    );
  });

  it("keeps desktop formula operands in equal-width columns", () => {
    const stepRule = styles.slice(
      styles.indexOf(".palworld-compact-formula-step {"),
      styles.indexOf(
        ".palworld-compact-formula-step + .palworld-compact-formula-step",
      ),
    );

    const normalizedStepRule = stepRule.replace(/\s+/gu, "");
    expect(normalizedStepRule).toContain("display:grid;");
    expect(normalizedStepRule).toContain(
      "grid-template-columns:minmax(0,1fr)0.75remminmax(0,1fr)0.75remminmax(0,1fr);",
    );
    expect(normalizedStepRule).toContain("gap:4px;");
  });

  it("gives compact formula operands readable prominence without excess padding", () => {
    const routeRule = styles.slice(
      styles.indexOf(".palworld-compact-formula-route {"),
      styles.indexOf(".palworld-compact-formula-step {"),
    );
    const formulaPal = source.slice(
      source.indexOf("function CompactFormulaPal("),
      source.indexOf("function CompactPal("),
    );
    const mobileRules = styles.slice(
      styles.indexOf("@media (max-width: 47.99rem)"),
    );

    expect(routeRule.replace(/\s+/gu, "")).toContain("padding:6px10px;");
    expect(styles).toMatch(
      /\.palworld-compact-formula-pal \{[\s\S]*?grid-template-columns: 44px minmax\(0, 1fr\);/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-avatar-wrap \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;[\s\S]*?flex: 0 0 44px;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-avatar \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-label \{[\s\S]*?font-size: 1rem;/u,
    );
    expect(formulaPal).toContain('sizes="44px"');
    expect(mobileRules).not.toMatch(
      /\.palworld-compact-formula-route \{[\s\S]*?padding:/u,
    );
  });

  it("stacks the Paldeck number above each compact formula name without empty badges", () => {
    const formulaPal = source.slice(
      source.indexOf("function CompactFormulaPal("),
      source.indexOf("function CompactPal("),
    );
    const paldeckBadge = source.slice(
      source.indexOf("function PaldeckBadge("),
      source.indexOf("function PalNode("),
    );

    expect(formulaPal).toContain("<PaldeckBadge internalId={internalId} />");
    expect(formulaPal).toContain(
      'className="palworld-compact-formula-avatar-wrap"',
    );
    expect(formulaPal).toContain("palworld-compact-formula-pal--owned");
    expect(formulaPal).toContain("palworld-compact-formula-inventory-count");
    expect(formulaPal).toContain(
      'className="palworld-compact-formula-details"',
    );
    expect(formulaPal).toContain(
      'className="palworld-compact-formula-name-row"',
    );
    expect(formulaPal).toContain(
      'className="palworld-compact-formula-name-line"',
    );
    expect(formulaPal).not.toContain("<AppTooltip content={label}>");
    expect(formulaPal).toContain("<GenderMarker gender={requiredGender} />");
    expect(formulaPal.indexOf("<PaldeckBadge")).toBeLessThan(
      formulaPal.indexOf("palworld-compact-formula-label"),
    );
    expect(formulaPal).not.toContain("<Mars");
    expect(formulaPal).not.toContain("<Venus");
    expect(paldeckBadge).toContain("if (!badge) return null;");
    expect(styles).toMatch(
      /\.palworld-compact-formula-pal \{[\s\S]*?grid-template-columns: 44px minmax\(0, 1fr\);[\s\S]*?text-align: start;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-avatar-wrap \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-label \{[\s\S]*?-webkit-line-clamp: 2;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-name-row \{[\s\S]*?flex-direction: column;/u,
    );
    expect(styles).toMatch(
      /\.palworld-compact-formula-name-line \{[\s\S]*?display: flex;/u,
    );
    const compactFallback = styles.slice(
      styles.indexOf("@container (max-width: 30rem)"),
      styles.indexOf("@media (max-width: 47.99rem)"),
    );
    const ownedCountRule = styles.slice(
      styles.indexOf(".palworld-compact-formula-inventory-count {"),
      styles.indexOf(".palworld-compact-formula-operator {"),
    );

    expect(formulaPal.indexOf("palworld-compact-formula-avatar")).toBeLessThan(
      formulaPal.indexOf("palworld-compact-formula-inventory-count"),
    );
    expect(ownedCountRule).toContain("position: absolute;");
    expect(ownedCountRule).toContain("right: -8px;");
    expect(ownedCountRule).toContain("bottom: -5px;");
    expect(ownedCountRule).toContain("min-width: 24px;");
    expect(ownedCountRule).toContain("height: 18px;");
    expect(ownedCountRule).toContain("padding: 0 5px;");
    expect(ownedCountRule).toContain("border-radius: 9px;");
    expect(ownedCountRule).toContain("font-size: 0.625rem;");
    expect(styles).toContain(
      ".palworld-compact-formula-pal--owned .palworld-compact-formula-avatar",
    );
    expect(compactFallback).toContain("grid-template-columns: minmax(0, 1fr);");
    expect(compactFallback).not.toContain("min-height: 2rem;");
    expect(compactFallback).toMatch(
      /\.palworld-compact-formula-name-row \{[\s\S]*?align-items: center;/u,
    );
  });

  it("shows save-species status on each parent only after a save is imported", () => {
    const parentResults = source.slice(
      source.indexOf("function ParentBreedingResults("),
      source.indexOf("function CompactFormulaPal("),
    );

    expect(parentResults).toContain("dedupeParentBreedingOutcomes");
    expect(parentResults).toContain("hasImportedSave");
    expect(parentResults).toContain('t("results.parent_inventory_legend")');
    expect(parentResults).toContain("showInventoryStatus={hasImportedSave}");
    expect(parentResults).not.toContain("palworld-parent-formula-availability");
    expect(source).toContain("const inventoryCount = isOwned ? ownedCount : 0");
    expect(source).toContain("×{inventoryCount}");
    expect(styles).toContain(
      ".palworld-compact-formula-pal--missing .palworld-compact-formula-avatar",
    );
    expect(source).not.toMatch(/\btitle=/u);
    expect(styles).toContain(
      ".palworld-compact-formula-inventory-count--missing",
    );
  });

  it("keeps the complete breeding equation on one row on mobile", () => {
    const mobileRules = styles.slice(
      styles.indexOf("@media (max-width: 47.99rem)"),
    );

    expect(mobileRules).not.toContain("grid-template-areas:");
    expect(mobileRules).not.toContain("grid-area: parent1;");
    expect(mobileRules).not.toContain("grid-area: child;");
  });

  it("keeps formula routes compact before the inventory master-detail browser", () => {
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function createRouteSearchEntry("),
    );

    expect(collectionSource).toContain('if (mode === "formula")');
    expect(collectionSource).toContain("matchingRoutes.map((route)");
    expect(collectionSource).toContain("<CompactFormulaRouteRow");
    expect(collectionSource).not.toContain(
      "groupRoutesByChildChain(matchingRoutes)",
    );
    expect(collectionSource.indexOf('if (mode === "formula")')).toBeLessThan(
      collectionSource.indexOf("const inventoryGroups"),
    );
    expect(collectionSource.indexOf("const inventoryGroups")).toBeLessThan(
      collectionSource.indexOf("function InventoryRouteBrowser("),
    );
    expect(collectionSource).not.toContain('variant="outline"');
  });

  it("keeps planning full-width and moves optional save import into a responsive dialog", () => {
    expect(source).toContain('const CALCULATOR_CONTENT_MAX_WIDTH = "80rem";');
    expect(source).toContain("saveDialogOpen");
    expect(source).toContain('data-testid="palworld-save-panel"');
    expect(source).toContain("<Dialog.Root");
    expect(source).toContain("lazyMount");
    expect(source).toContain("unmountOnExit");
    expect(source).toContain('maxW={{ base: "none", md: "44rem" }}');
    expect(source).toContain('h={{ base: "100dvh", md: "auto" }}');
    expect(source).toContain("m={0}");
    expect(source).toContain('data-testid="palworld-calculator-panel"');
    expect(source).not.toContain('key="upload"');
    expect(source).not.toContain('key="planner"');
    expect(source).not.toContain('t("hero.eyebrow")');
    expect(source).not.toContain('t("hero.local_badge")');
    expect(source).not.toContain('t("hero.promise_local")');
    expect(source).not.toContain('t("status.title")');
    expect(source).not.toContain('t("upload.payload_title")');
    expect(source).not.toContain("<StatBlock");
  });

  it("uses contextual save links before import and one shared imported state", () => {
    const calculatorPanel = source.slice(
      source.indexOf('data-testid="palworld-calculator-panel"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(calculatorPanel).not.toContain('data-testid="save-import-trigger"');
    expect(calculatorPanel).toContain('linkTestId="parent-save-import-link"');
    expect(calculatorPanel).toContain('testId="passive-selection-locked"');
    expect(calculatorPanel).toContain('data-testid="shared-save-control"');
    expect(calculatorPanel).toContain('linkTestId="passive-import-link"');
    expect(source).toContain("setSaveDialogOpen(true)");
    expect(source).not.toContain('t("status.title")');
  });

  it("keeps one space between both save links and their suffix text", () => {
    const saveImportPrompt = source.slice(
      source.indexOf("function SaveImportPrompt("),
      source.indexOf("function SwapPalsButton("),
    );

    expect(saveImportPrompt).toContain('<Box as="span" ms={1}>');
    expect(saveImportPrompt).not.toContain("inventoryExamples ? 1 : 0");
  });

  it("pairs legible inventory count badges with explicit meanings", () => {
    const saveImportPrompt = source.slice(
      source.indexOf("function SaveImportPrompt("),
      source.indexOf("function SwapPalsButton("),
    );
    const parentPrompt = source.slice(
      source.indexOf('testId="parent-save-import-prompt"'),
      source.indexOf('data-testid="shared-save-control"'),
    );

    expect(saveImportPrompt).toContain(
      'className="palworld-save-import-prompt__action"',
    );
    expect(saveImportPrompt).toContain('textWrap="balance"');
    expect(saveImportPrompt).toContain("inventoryExamples");
    expect(saveImportPrompt).toContain(
      'className="palworld-save-import-prompt__examples"',
    );
    expect(saveImportPrompt).toContain(
      'className="palworld-compact-formula-inventory-count palworld-compact-formula-inventory-count--example"',
    );
    expect(saveImportPrompt).toContain(
      'className="palworld-compact-formula-inventory-count palworld-compact-formula-inventory-count--missing palworld-compact-formula-inventory-count--example"',
    );
    expect(saveImportPrompt).toContain("×3");
    expect(saveImportPrompt).toContain("×0");
    expect(saveImportPrompt).toContain("inventoryExamples.owned");
    expect(saveImportPrompt).toContain("inventoryExamples.missing");
    expect(saveImportPrompt).not.toContain("<Badge");
    expect(saveImportPrompt).not.toContain('<Box as="span">/</Box>');
    expect(source).toContain(
      'const ownedInventoryExampleLabel = t("results.parent_inventory_count",',
    );
    expect(source).toContain(
      'const missingInventoryExampleLabel = t("routes.parent_missing")',
    );
    expect(parentPrompt).toContain("inventoryExamples={{");
    expect(parentPrompt).toContain("owned: ownedInventoryExampleLabel");
    expect(parentPrompt).toContain("missing: missingInventoryExampleLabel");
    expect(parentPrompt).not.toContain("action_examples_suffix");
    expect(styles).toContain(
      ".palworld-compact-formula-inventory-count--example",
    );
    expect(styles).toContain("min-width: 28px");
    expect(styles).toContain("height: 20px");
    expect(styles).toContain("font-size: 0.75rem");
  });

  it("derives the rendered result mode from the current import state", () => {
    expect(source).toContain(
      'data-workbench-mode={preparedUpload ? "inventory" : "formula"}',
    );
    expect(source).toContain('mode: preparedUpload ? "inventory" : "formula"');
    expect(source).not.toContain("mode: nextPlan.directRoutes.some(");
    expect(source).not.toContain(
      'mode: nextPlan.inventoryCount > 0 ? "inventory" : "formula"',
    );
    expect(source).not.toContain('t("calculator.formula_mode")');
    expect(source).not.toContain('t("calculator.inventory_mode")');
    expect(source).toContain('t("calculator.plan_formula")');
    expect(source).toContain('t("calculator.plan_inventory")');
  });

  it("uses natural breeding-query language in the bundled English locale", () => {
    const messages = JSON.parse(
      readFileSync(resolve("app/src/locales/en.json"), "utf8"),
    ) as {
      calculator: {
        title: string;
        plan_formula: string;
        plan_inventory: string;
        planning: string;
      };
      results: { title: string; route_count: string; group_count: string };
      routes: {
        location_party: string;
        location_palbox: string;
        location_palbox_position: string;
        location_base: string;
      };
    };

    expect(messages.calculator.title).toBe("Breeding lookup");
    expect(messages.calculator.plan_formula).toBe("View breeding results");
    expect(messages.calculator.plan_inventory).toBe("View breeding results");
    expect(messages.calculator.planning).toBe("Calculating...");
    expect(messages.results.title).toBe("Breeding results");
    expect(messages.results.route_count).toBe(
      "Breeding options found: {count}",
    );
    expect(messages.results.group_count).toBe("Options: {count}");
    expect(messages.routes.location_party).toBe("Party\nslot {slot}");
    expect(messages.routes.location_palbox).toBe("Palbox\nslot {slot}");
    expect(messages.routes.location_palbox_position).toBe(
      "Palbox · page {page}\nrow {row} · column {column}",
    );
    expect(messages.routes.location_base).toBe("Base\nslot {slot}");
  });

  it("shows the supported 1.0 series with Pal and passive totals", () => {
    const messages = JSON.parse(
      readFileSync(resolve("app/src/locales/en.json"), "utf8"),
    ) as {
      hero: { data_badge: string };
    };

    expect(messages.hero.data_badge).toBe(
      "{compatibility} · {palCount} Pals / {passiveCount} passives",
    );
    expect(source).toContain(
      "compatibility: PALWORLD_V1_METADATA.compatibility",
    );
    expect(source).toContain("palCount: PALWORLD_V1_METADATA.palCount");
    expect(source).toContain(
      "passiveCount: PALWORLD_V1_METADATA.passiveSkillCount",
    );
    expect(source).not.toContain("verifiedVersion:");
  });

  it("keeps only English messages used by the standalone page", () => {
    const messages = JSON.parse(
      readFileSync(resolve("app/src/locales/en.json"), "utf8"),
    ) as Record<string, unknown>;
    const leafKeys = flattenMessageKeys(messages);

    expect(leafKeys).toHaveLength(182);
    expect(leafKeys).toContain("upload.reread_action");
    expect(leafKeys).not.toContain("results.show_more_routes");
    expect(leafKeys).toContain("results.priority_routes");
    expect(leafKeys).toContain("results.priority_route_count");
    expect(leafKeys).toContain("results.back_to_routes");
    expect(leafKeys).toContain("results.search_truncated_empty");
    expect(leafKeys).toContain("routes.sources_with_alternatives");
    expect(leafKeys).toContain("routes.alternatives_limited");
    expect(leafKeys).toContain("routes.location_palbox_position");
    expect(leafKeys).not.toContain("hero.eyebrow");
    expect(leafKeys).not.toContain("status.initial");
    expect(leafKeys).not.toContain("stats.gzip");
    expect(leafKeys).not.toContain("privacy.local.description");
    expect(leafKeys).not.toContain("workflow.select_target");
    expect(leafKeys).not.toContain("upload.description");
    expect(leafKeys).not.toContain("upload.payload_description");
    expect(leafKeys).not.toContain("save_locations.items.steam_windows.system");
  });

  it("uses a lookup icon for the primary breeding query action", () => {
    const submitAction = source.slice(
      source.indexOf('data-testid="breeding-query-submit"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(submitAction).toContain("as={Search}");
    expect(submitAction).not.toContain("as={Swords}");
  });

  it("starts every Pal selector empty when no calculator or share state exists", () => {
    expect(source).not.toContain('const DEFAULT_TARGET_SPECIES = "Anubis";');
    expect(source).toContain(": (restoredSession?.targetSpecies ?? null),");
    expect(source).toContain(": (restoredSession?.startingSpecies ?? null),");
    expect(source).toContain(
      'restoredShareState?.view === "parents" ? restoredShareState.parentA : null,',
    );
    expect(source).toContain(
      'restoredShareState?.view === "parents" ? restoredShareState.parentB : null,',
    );
  });

  it("keeps the auxiliary parent-pair query separate from the primary planner", () => {
    expect(source).toContain(
      'import { gameData, PALWORLD_V1_METADATA } from "./game-data";',
    );
    expect(source).not.toContain(
      'import { createPalworldV1GameData } from "../../src/data/palworld-v1-breeding";',
    );
    expect(source).not.toContain("src/data/palworld-v1-breeding");
    expect(source).not.toContain("parentBreedingIndexPromise");
    expect(source).toContain("loadParentShard");
    expect(source).not.toContain(
      "createPalworldParentBreedingOutcomesFetchInput",
    );
    expect(source).toContain("type BreedingQueryMode");
    expect(source).toContain("<Tabs.Root");
    expect(source).toContain('data-testid="parent-query-tab"');
    expect(source).toContain('data-testid="target-query-tab"');
    expect(source).not.toContain('data-testid="parent-query-trigger"');
    expect(source).not.toContain('data-testid="target-query-trigger"');
    expect(source).toContain('id="palworld-parent-a"');
    expect(source).toContain('id="palworld-parent-b"');
    expect(source).toContain("parentBreedingOutcomes");
    expect(source).not.toContain('value="child-only"');
  });

  it("submits every query explicitly before showing results", () => {
    expect(source).toContain("type SubmittedParentBreedingQuery");
    expect(source).toContain("submittedParentBreedingQuery");
    expect(source).toContain("handleSubmitBreedingQuery");
    expect(source).toContain('data-testid="breeding-query-submit"');
    expect(source).toContain("onClick={handleSubmitBreedingQuery}");
    expect(source).toContain(
      "const hasParentBreedingQuery = submittedParentBreedingQuery !== null;",
    );
  });

  it("keeps the target action available and validates a missing child inline", () => {
    const targetSelector = source.slice(
      source.indexOf('id="palworld-target-pal"'),
      source.indexOf('id="palworld-starting-pal"'),
    );
    const submitAction = source.slice(
      source.indexOf('data-testid="breeding-query-submit"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(source).toContain(
      "const [targetSpeciesInvalid, setTargetSpeciesInvalid] = useState(false);",
    );
    expect(source).toContain(
      "const targetSpeciesInputRef = useRef<HTMLInputElement | null>(null);",
    );
    expect(source).toContain("setTargetSpeciesInvalid(true);");
    expect(source).toContain("targetSpeciesInputRef.current?.focus();");
    expect(targetSelector).toContain("invalid={targetSpeciesInvalid}");
    expect(targetSelector).toContain('t("error.target_required")');
    expect(targetSelector).toContain("reserveErrorSpace");
    expect(targetSelector).toContain("inputRef={targetSpeciesInputRef}");
    expect(source).toMatch(
      /testId="swap-target-parent"[\s\S]*?onClick=\{swapTargetAndStartingSpecies\}/u,
    );
    expect(source).toMatch(
      /id="palworld-starting-pal"[\s\S]*?locale=\{locale\}/u,
    );
    expect(submitAction).toContain("disabled={calculatorControlsLocked}");
    expect(submitAction).not.toContain("!parentASpecies");
    expect(submitAction).not.toContain("!parentBSpecies");
  });

  it("reserves validation space only for selectors that can receive submit errors", () => {
    const searchCombobox = source.slice(
      source.indexOf("function SearchCombobox("),
      source.indexOf("function PassiveSkillPickerDialog("),
    );
    const targetTab = source.slice(
      source.indexOf('<Tabs.Content value="target"'),
      source.indexOf('<Tabs.Content value="parents"'),
    );
    const parentsTab = source.slice(
      source.indexOf('<Tabs.Content value="parents"'),
      source.indexOf('data-testid="parent-save-import-prompt"'),
    );
    const parentASelector = parentsTab.slice(
      parentsTab.indexOf('id="palworld-parent-a"'),
      parentsTab.indexOf('testId="swap-parents"'),
    );
    const parentSwap = parentsTab.slice(
      parentsTab.indexOf('testId="swap-parents"'),
      parentsTab.indexOf('id="palworld-parent-b"'),
    );
    const parentBSelector = parentsTab.slice(
      parentsTab.indexOf('id="palworld-parent-b"'),
    );

    expect(searchCombobox).toContain("reserveErrorSpace = false");
    expect(searchCombobox).toContain(
      "minH={reserveErrorSpace ? 7 : undefined}",
    );
    expect(targetTab).toContain("reserveErrorSpace");
    expect(parentASelector).toContain("reserveErrorSpace");
    expect(parentSwap).not.toContain("reserveErrorSpace");
    expect(parentBSelector).not.toContain("reserveErrorSpace");
  });

  it("keeps the parent query action available and validates an empty pair inline", () => {
    const parentsTab = source.slice(
      source.indexOf('<Tabs.Content value="parents"'),
      source.indexOf('data-testid="parent-save-import-prompt"'),
    );
    const submitHandler = source.slice(
      source.indexOf("async function handleSubmitBreedingQuery"),
      source.indexOf("async function handleShareCalculator"),
    );
    const submitAction = source.slice(
      source.indexOf('data-testid="breeding-query-submit"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(source).toContain(
      "const [parentSpeciesInvalid, setParentSpeciesInvalid] = useState(false);",
    );
    expect(source).toContain(
      "const parentASpeciesInputRef = useRef<HTMLInputElement | null>(null);",
    );
    expect(parentsTab).toContain("invalid={parentSpeciesInvalid}");
    expect(parentsTab).toContain('t("error.parent_required")');
    expect(parentsTab).toContain("inputRef={parentASpeciesInputRef}");
    expect(submitHandler).toContain("setParentSpeciesInvalid(true);");
    expect(submitHandler).toContain("parentASpeciesInputRef.current?.focus();");
    expect(submitHandler).toContain("setParentSpeciesInvalid(false);");
    expect(submitAction).toContain("disabled={calculatorControlsLocked}");
    expect(submitAction).not.toContain("!parentASpecies");
    expect(submitAction).not.toContain("!parentBSpecies");
  });

  it("keeps sibling selectors aligned when target validation appears", () => {
    const queryControls = source.slice(
      source.indexOf('data-testid="query-control-band"'),
      source.indexOf('data-testid="query-followup-rows"'),
    );
    const swapButton = source.slice(
      source.indexOf("function SwapPalsButton("),
      source.indexOf("function SearchCombobox("),
    );

    expect(queryControls.match(/alignItems="start"/gu) ?? []).toHaveLength(2);
    expect(queryControls).not.toContain('alignItems="end"');
    expect(swapButton).toContain('alignSelf={{ base: "center", lg: "start" }}');
    expect(swapButton).toContain('mt={{ base: 0, lg: "1.875rem" }}');
  });

  it("keeps target and parent result searches independent", () => {
    expect(source).toContain(
      'const [targetRouteQuery, setTargetRouteQuery] = useState("");',
    );
    expect(source).toContain(
      'const [parentRouteQuery, setParentRouteQuery] = useState("");',
    );
    expect(source).not.toContain("const [routeQuery, setRouteQuery]");
  });

  it("changes query tabs without clearing either mode", () => {
    const handler = source.slice(
      source.indexOf("function handleBreedingQueryModeChange"),
      source.indexOf("function closeSaveDialog"),
    );

    expect(handler).toContain("setBreedingQueryMode(nextMode)");
    expect(handler).toContain("setCalculationErrorMessage(null)");
    expect(handler).not.toContain("setPlan(null)");
    expect(handler).not.toContain("setSubmittedParentBreedingQuery(null)");
    expect(handler).not.toContain("setTargetRouteQuery");
    expect(handler).not.toContain("setParentRouteQuery");
  });

  it("invalidates only the result owned by the edited query", () => {
    const targetHandler = source.slice(
      source.indexOf("function handleTargetSpeciesChange"),
      source.indexOf("function handleBreedingQueryModeChange"),
    );
    const startingParentHandler = source.slice(
      source.indexOf("function handleStartingSpeciesChange"),
      source.indexOf("function handleParentASpeciesChange"),
    );
    const parentAHandler = source.slice(
      source.indexOf("function handleParentASpeciesChange"),
      source.indexOf("function handleParentBSpeciesChange"),
    );
    const parentBHandler = source.slice(
      source.indexOf("function handleParentBSpeciesChange"),
      source.indexOf("function togglePassive"),
    );

    for (const handler of [targetHandler, startingParentHandler]) {
      expect(handler).toContain("setPlan(null)");
      expect(handler).toContain('setTargetRouteQuery("")');
      expect(handler).not.toContain("setSubmittedParentBreedingQuery(null)");
      expect(handler).not.toContain("setParentRouteQuery");
    }
    for (const handler of [parentAHandler, parentBHandler]) {
      expect(handler).toContain("setSubmittedParentBreedingQuery(null)");
      expect(handler).toContain('setParentRouteQuery("")');
      expect(handler).not.toContain("setPlan(null)");
      expect(handler).not.toContain("setTargetRouteQuery");
    }
  });

  it("keeps parent formulas when imported save data changes", () => {
    const clearHandler = source.slice(
      source.indexOf("function clearImportedSave"),
      source.indexOf("async function handleSaveFiles"),
    );
    const importHandler = source.slice(
      source.indexOf("async function handleSaveFiles"),
      source.indexOf("function handleStartingSpeciesChange"),
    );

    for (const handler of [clearHandler, importHandler]) {
      expect(handler).toContain("setPlan(null)");
      expect(handler).toContain('setTargetRouteQuery("")');
      expect(handler).not.toContain("setSubmittedParentBreedingQuery(null)");
      expect(handler).not.toContain("setParentBreedingOutcomes");
      expect(handler).not.toContain("setParentRouteQuery");
    }
    expect(importHandler).not.toContain("setStartingSpecies(null)");
  });

  it("renders and scrolls only the active query mode's retained result", () => {
    expect(source).toContain(
      'const showParentBreedingResults =\n    breedingQueryMode === "parents" && submittedParentBreedingQuery !== null;',
    );
    expect(source).toContain(
      'const showTargetBreedingResults =\n    breedingQueryMode === "target" && plan !== null;',
    );
    expect(source).toContain('breedingQueryMode !== "parents"');
    expect(source).toContain('breedingQueryMode !== "target"');
    expect(source).toContain("showParentBreedingResults &&");
    expect(source).toContain("showTargetBreedingResults ? (");
  });

  it("uses persistent accessible query tabs and one shared save control", () => {
    const calculatorPanel = source.slice(
      source.indexOf('data-testid="palworld-calculator-panel"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(source).toContain("Tabs,");
    expect(calculatorPanel).toContain("<Tabs.Root");
    expect(calculatorPanel).toContain('data-testid="breeding-query-tabs"');
    expect(calculatorPanel).toContain('data-testid="target-query-tab"');
    expect(calculatorPanel).toContain('data-testid="parent-query-tab"');
    expect(calculatorPanel).toContain('<Tabs.Content value="target"');
    expect(calculatorPanel).toContain('<Tabs.Content value="parents"');
    expect(calculatorPanel).toContain(
      't("calculator.query_mode_target_description")',
    );
    expect(calculatorPanel).toContain(
      't("calculator.query_mode_parents_description")',
    );
    expect(calculatorPanel).toContain('data-testid="shared-save-control"');
    expect(
      calculatorPanel.match(/data-testid="shared-save-control"/gu),
    ).toHaveLength(1);
    expect(calculatorPanel).not.toContain('data-testid="save-import-trigger"');
    expect(calculatorPanel).toContain('linkTestId="parent-save-import-link"');
    expect(calculatorPanel).toContain('testId="passive-selection-locked"');
    expect(calculatorPanel).not.toContain('data-testid="parent-query-trigger"');
    expect(calculatorPanel).not.toContain('data-testid="target-query-trigger"');
    expect(calculatorPanel).toContain('linkTestId="passive-import-link"');
  });

  it("centers the active tab description and separates it from the selectors", () => {
    const description = source.slice(
      source.indexOf('data-testid="query-mode-description"'),
      source.indexOf('<Tabs.Content value="target"'),
    );

    expect(description).toContain('maxW={{ base: "full", md: "29rem" }}');
    expect(description).toContain('mx="auto"');
    expect(description).toContain('textAlign="center"');
    expect(source).toContain('<Tabs.Content value="target" pt={0}>');
    expect(source).toContain('<Tabs.Content value="parents" pt={0}>');
  });

  it("uses the approved flat two-row query control band", () => {
    const calculatorPanel = source.slice(
      source.indexOf('data-testid="palworld-calculator-panel"'),
      source.indexOf("ref={resultsRef}"),
    );
    const queryTabs = calculatorPanel.slice(
      calculatorPanel.indexOf('data-testid="breeding-query-tabs"'),
      calculatorPanel.indexOf('data-testid="query-control-band"'),
    );
    const queryControlBand = calculatorPanel.slice(
      calculatorPanel.indexOf('data-testid="query-control-band"'),
      calculatorPanel.indexOf("ref={resultsRef}"),
    );
    const saveImportPrompt = source.slice(
      source.indexOf("function SaveImportPrompt("),
      source.indexOf("function SwapPalsButton("),
    );
    const swapButton = source.slice(
      source.indexOf("function SwapPalsButton("),
      source.indexOf("function SearchCombobox("),
    );

    expect(calculatorPanel).not.toContain('t("calculator.title")');
    expect(calculatorPanel).not.toContain("as={FlaskConical}");
    expect(queryTabs).toContain('maxW="2xl"');
    expect(queryTabs).toContain("minH={14}");
    expect(queryControlBand).toContain('borderTopWidth="1px"');
    expect(queryControlBand).toContain('borderBottomWidth="1px"');
    expect(queryControlBand).toContain('bg="var(--palworld-surface-a28)"');
    expect(saveImportPrompt).toContain('borderStyle="dashed"');
    expect(saveImportPrompt).toContain("as={FileArchive}");
    expect(saveImportPrompt).toContain('bg="var(--palworld-surface-a56)"');
    expect(queryControlBand.indexOf("<SaveImportPrompt")).toBeLessThan(
      queryControlBand.indexOf('data-testid="breeding-query-submit"'),
    );
    expect(source).not.toContain("reserveFeedbackSpace");
    expect(swapButton).toContain("boxSize={10}");
    expect(swapButton).toContain('borderRadius={{ base: "full", lg: "sm" }}');
    expect(swapButton).toContain(
      'transform={{ base: "rotate(90deg)", lg: "none" }}',
    );
    expect(queryControlBand).toContain('data-testid="query-submit-row"');
    expect(queryControlBand).toContain('w={{ base: "full", md: "20rem" }}');
  });

  it("swaps both query pairs and clears stale results", () => {
    expect(source).toContain('testId="swap-target-parent"');
    expect(source).toContain('testId="swap-parents"');
    expect(source).toContain("function swapTargetAndStartingSpecies()");
    expect(source).toContain("setTargetSpecies(startingSpecies)");
    expect(source).toContain("setStartingSpecies(targetSpecies)");
    expect(source).toContain("if (targetSpecies === startingSpecies) return;");
    expect(source).toContain("function swapParentSpecies()");
    expect(source).toContain("setParentASpecies(parentBSpecies)");
    expect(source).toContain("setParentBSpecies(parentASpecies)");
    expect(source).toContain("if (parentASpecies === parentBSpecies) return;");
    expect(source).toContain('t("calculator.swap_selections")');
    expect(source).toContain('base: "rotate(90deg)", lg: "none"');
  });

  it("matches the approved task-card tab and save-row hierarchy", () => {
    const queryTabs = source.slice(
      source.indexOf('data-testid="breeding-query-tabs"'),
      source.indexOf('data-testid="shared-save-control"'),
    );
    const queryTabList = queryTabs.slice(0, queryTabs.indexOf("</Tabs.List>"));
    const queryModeIcon = source.slice(
      source.indexOf("function QueryModeIcon("),
      source.indexOf("function SaveImportPrompt("),
    );
    const sharedSaveControl = source.slice(
      source.indexOf('data-testid="shared-save-control"'),
      source.indexOf('{breedingQueryMode === "target" ? ('),
    );
    const lockedPassive = source.slice(
      source.indexOf('data-testid="passive-selection-locked"'),
      source.indexOf("<PassiveSkillPickerDialog"),
    );
    const saveImportPrompt = source.slice(
      source.indexOf("function SaveImportPrompt("),
      source.indexOf("function SwapPalsButton("),
    );

    expect(queryTabList).toContain('maxW="2xl"');
    expect(queryTabList).toContain("gap={2}");
    expect(queryTabList).not.toContain("p={1}");
    expect(queryTabs).toContain("minH={14}");
    expect(queryTabList.match(/<QueryModeIcon src=/gu) ?? []).toHaveLength(2);
    expect(queryTabList).not.toContain("palworldChildLabelIconHref");
    expect(queryTabList).not.toContain("palworldParentLabelIconHref");
    expect(queryTabs).not.toContain("<FieldLabelIcon");
    expect(
      queryTabs.match(/bg: "var\(--palworld-query-tab-selected-bg\)"/gu) ?? [],
    ).toHaveLength(2);
    expect(queryModeIcon).toContain("boxSize={{ base: 6, md: 7 }}");
    expect(queryModeIcon).not.toContain('borderWidth="1px"');
    expect(queryModeIcon).not.toContain("boxShadow=");
    expect(sharedSaveControl).toContain('w="full"');
    expect(sharedSaveControl).toContain('bg="var(--palworld-success-bg-soft)"');
    expect(saveImportPrompt).toContain('justify="center"');
    expect(saveImportPrompt).toContain('textAlign="center"');
    expect(lockedPassive).not.toContain('borderStyle="dashed"');
    expect(lockedPassive).not.toContain("--palworld-warning");
  });

  it("keeps query tabs as balanced responsive task cards", () => {
    const queryTabsMarker = source.indexOf('data-testid="breeding-query-tabs"');
    const queryTabs = source.slice(
      queryTabsMarker,
      source.indexOf("</Tabs.List>", queryTabsMarker) + "</Tabs.List>".length,
    );

    expect(queryTabs).toContain('w="full"');
    expect(queryTabs).toContain('maxW="2xl"');
    expect(queryTabs).toContain(
      'gridTemplateColumns="repeat(2, minmax(0, 1fr))"',
    );
    expect(queryTabs).toContain('mx="auto"');
    expect(
      queryTabs.match(/bg: "var\(--palworld-query-tab-selected-bg\)"/gu) ?? [],
    ).toHaveLength(2);
    expect(
      queryTabs.match(/borderColor: "var\(--palworld-accent-border\)"/gu) ?? [],
    ).toHaveLength(2);
    expect(
      queryTabs.match(/inset 0 -4px 0 var\(--palworld-accent-border\)/gu) ?? [],
    ).toHaveLength(2);
    expect(queryTabs).not.toContain("inset 4px 0 0");
    expect(styles).toContain(
      "--palworld-query-tab-selected-bg: linear-gradient(",
    );
    expect(styles).toContain(
      "--palworld-query-tab-selected-hover-bg: linear-gradient(",
    );
    expect(
      queryTabs.match(/bg: "var\(--palworld-query-tab-hover-bg\)"/gu) ?? [],
    ).toHaveLength(2);
    expect(
      queryTabs.match(
        /borderColor: "var\(--palworld-query-tab-hover-border\)"/gu,
      ) ?? [],
    ).toHaveLength(2);
    expect(styles).toContain("--palworld-query-tab-hover-bg:");
    expect(styles).toContain("--palworld-query-tab-hover-border:");
  });

  it("shows every general formula without nested disclosure controls", () => {
    expect(source).toContain('data-testid="formula-route-list"');
    expect(source).not.toContain(
      "const childChainGroups = groupRoutesByChildChain(matchingRoutes);",
    );
  });

  it("uses one floating retry alert for route and parent-data failures", () => {
    expect(source).toContain('data-testid="parent-breeding-loading"');
    expect(source).toContain("data-testid={testId}");
    expect(source).toContain('testId="route-calculation-error"');
    expect(source).toContain('testId="parent-breeding-load-error"');
    expect(source.match(/<FloatingErrorAlert/gu) ?? []).toHaveLength(2);
    expect(source).toContain("requestParentBreedingOutcomes");
    expect(source).toContain('t("results.parent_loading")');
    expect(source).toContain('t("results.parent_load_error")');
  });

  it("keeps all parent options visible and marks Pals found in the imported save", () => {
    expect(source).toContain("const palOptionsWithOwnership = useMemo");
    expect(source).toContain("options={palOptionsWithOwnership}");
    expect(source).not.toContain("const ownedStartingPalOptions = useMemo");
  });

  it("lets users reread and clear imported save data", () => {
    expect(source).toContain('data-testid="imported-save-manage"');
    expect(source).toContain('data-testid="reread-imported-save"');
    expect(source).toContain('t("upload.reread_action")');
    expect(source).toContain('data-testid="clear-imported-save-shortcut"');
    expect(source).toContain('data-testid="clear-imported-save"');
    expect(source).toContain("setPreparedUpload(null)");
    expect(source).toContain("setSelectedPassiveIds([])");
    expect(source).toContain("setPlan(null)");

    const importedSaveActions = source.slice(
      source.indexOf('data-testid="imported-save-manage"'),
      source.indexOf('data-testid="passive-selection-locked"'),
    );
    const rereadIndex = importedSaveActions.indexOf(
      'data-testid="reread-imported-save"',
    );
    const clearIndex = importedSaveActions.indexOf(
      'data-testid="clear-imported-save-shortcut"',
    );
    expect(
      importedSaveActions.indexOf('data-testid="imported-save-manage"'),
    ).toBeLessThan(rereadIndex);
    expect(rereadIndex).toBeLessThan(clearIndex);
    expect(importedSaveActions.slice(rereadIndex, clearIndex)).toContain(
      "setSaveDialogOpen(true)",
    );
    expect(importedSaveActions).toContain("onClick={clearImportedSave}");
  });

  it("does not repeat the formula explanation in the default planner panel", () => {
    expect(source).not.toContain('t("calculator.formula_hint")');
    expect(source).not.toContain('t("calculator.ready_hint")');
  });

  it("centers the route action and gives it primary-button dimensions", () => {
    const calculatorAction = source.slice(
      source.indexOf('data-testid="query-submit-row"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(calculatorAction).toContain('size="lg"');
    expect(calculatorAction).toContain('w={{ base: "full", md: "20rem" }}');
    expect(calculatorAction).toContain('maxW="full"');
    expect(calculatorAction).toContain('className="palworld-calculate-action"');
    expect(calculatorAction).toContain('h="auto"');
    expect(calculatorAction).toContain('whiteSpace="normal"');
    expect(calculatorAction).toContain("onClick={handleSubmitBreedingQuery}");
  });

  it("keeps passive selection visually secondary to the route action", () => {
    const passiveTrigger = source.slice(
      source.indexOf('data-testid="passive-picker-trigger"'),
      source.indexOf("<PassiveSkillPickerDialog"),
    );
    const calculatorAction = source.slice(
      source.indexOf('className="palworld-calculate-action"'),
      source.indexOf("ref={resultsRef}"),
    );

    expect(passiveTrigger).toContain('variant="outline"');
    expect(passiveTrigger).toContain('borderColor="var(--palworld-border)"');
    expect(passiveTrigger).toContain('bg="var(--palworld-surface)"');
    expect(passiveTrigger).not.toContain('bg="var(--palworld-canvas-surface)"');
    expect(passiveTrigger).not.toContain('bg="var(--palworld-accent-solid)"');
    expect(calculatorAction).toContain('bg="var(--palworld-accent-solid)"');
  });

  it("lets every user filter by one starting parent", () => {
    expect(source).toContain("const [startingSpecies, setStartingSpecies]");
    expect(source).toContain('id="palworld-starting-pal"');
    expect(source).toContain('label={t("calculator.starting_parent")}');
    expect(source).toContain("options={palOptionsWithOwnership}");
    expect(source).toMatch(
      /placeholder=\{\s*preparedUpload\s*\?\s*t\("calculator\.starting_parent_auto"\)\s*:\s*t\("calculator\.starting_parent_any"\)\s*\}/u,
    );
    expect(source).toContain("startingSpecies,");
    expect(source).toContain("value={startingSpecies}");
  });

  it("gives the target and starting-parent comboboxes equal desktop width", () => {
    const calculatorFields = source.slice(
      source.indexOf('id="palworld-target-pal"') - 300,
      source.indexOf('id="palworld-starting-pal"') + 900,
    );

    expect(calculatorFields).toContain(
      'lg: "minmax(0, 1fr) auto minmax(0, 1fr)",',
    );
    expect(calculatorFields).toContain("gap={{ base: 2, lg: 3 }}");
    expect(calculatorFields).not.toContain('gridColumn={{ lg: "span 7" }}');
    expect(calculatorFields).not.toContain('gridColumn={{ lg: "span 5" }}');
  });

  it("distinguishes child and parent artwork inside matching square frames", () => {
    expect(source).toContain(
      "const palworldChildLabelIconHref = palworldAssetBaseHref\n  ? `${palworldAssetBaseHref}/items/pal-egg.webp`",
    );
    expect(source).toContain(
      "const palworldParentLabelIconHref = palworldAssetBaseHref\n  ? `${palworldAssetBaseHref}/pals/sheep-ball.webp`",
    );
    expect(
      source.match(/labelIconSrc=\{palworldChildLabelIconHref\}/gu),
    ).toHaveLength(1);
    expect(
      source.match(/labelIconSrc=\{palworldParentLabelIconHref\}/gu),
    ).toHaveLength(3);
  });

  it("keeps passive selection visibly locked until a save is ready", () => {
    expect(source).toContain('t("calculator.passive_locked")');
    expect(source).toContain('t("calculator.import_save_link")');
    expect(source).toContain('linkTestId="passive-import-link"');
    expect(source).toMatch(
      /passiveLockedMessage\.slice\(\s*0,\s*importSaveLinkIndex,?\s*\)/u,
    );
    expect(source).toMatch(
      /importSaveLinkIndex \+\s*importSaveLinkLabel\.length/u,
    );
    expect(source).toContain('testId="passive-selection-locked"');
    expect(source).toMatch(
      /\{!preparedUpload \? \([\s\S]*?testId="passive-selection-locked"[\s\S]*?\) : null\}/u,
    );
    expect(source).toContain("<PassiveSkillPickerDialog");
    expect(source).not.toContain('t("calculator.passive_browse_badge")');
    expect(source).not.toContain('t("calculator.passive_browse_only"');
    expect(source).not.toContain(
      'data-testid="palworld-owned-passive-shortcuts"',
    );
    expect(source).not.toContain(
      'preparedUpload\n                            ? "owned_passives.none"\n                            : "owned_passives.empty"',
    );
  });

  it("keeps save parsing feedback inside the dialog and route feedback out of document flow", () => {
    const saveDialog = dialogSource("palworld-save-dialog");

    expect(saveDialog).toContain('status === "parsing"');
    expect(saveDialog).toContain("saveErrorMessage");
    expect(saveDialog).toContain('t("upload.cancel")');
    expect(source).toContain("<Portal>");
    expect(source).toContain("function FloatingErrorAlert");
    expect(source).toContain("calculationErrorMessage");
    expect(source).toContain('t("calculator.retry")');
    expect(source).not.toMatch(/\{errorMessage \? \([\s\S]*?<SimpleGrid/u);
  });

  it("does not let a closing dialog backdrop intercept the next action", () => {
    const backdrops = source.match(/<Dialog\.Backdrop[\s\S]*?\/>/gu) ?? [];

    expect(backdrops).toHaveLength(2);
    for (const backdrop of backdrops) {
      expect(backdrop).toContain('_closed={{ pointerEvents: "none" }}');
    }
  });

  it("locks planner fields while a save is being parsed", () => {
    expect(source).toContain('status === "parsing"');
    expect(source).toContain("const calculatorControlsLocked =");
    expect(source).toContain("disabled={calculatorControlsLocked}");
  });

  it("shows the total route count only in the result header", () => {
    expect(source.match(/t\("results\.route_count"/gu)).toHaveLength(1);
  });

  it("does not render a second instructional empty state before planning", () => {
    expect(source).not.toContain('t("results.empty")');
    expect(source).not.toContain('t("results.empty_title")');
    expect(source).not.toContain('t("results.empty_description")');
  });

  it("uses the collapsible trigger contract for save locations", () => {
    expect(source).toContain("<Collapsible.Trigger");
    expect(source).toContain('root: "palworld-save-locations-root"');
    expect(source).not.toContain('aria-controls="palworld-save-locations"');
    expect(source).not.toContain(
      "onClick={() => setSaveLocationsOpen((current) => !current)}",
    );
  });

  it("shows one save-location platform at a time with a compact button strip", () => {
    const saveDialog = dialogSource("palworld-save-dialog");
    const locationContent = saveDialog.slice(
      saveDialog.indexOf("<Collapsible.Content"),
      saveDialog.indexOf("</Collapsible.Content>"),
    );

    expect(locationContent).not.toContain("<Tabs.Root");
    expect(locationContent).not.toContain("<NativeSelect.Root");
    expect(locationContent).toContain('role="group"');
    expect(locationContent).toContain("aria-pressed={saveLocationKey === key}");
    expect(locationContent).toMatch(
      /onClick=\{\(\) =>\s*setSaveLocationKey\(key\)\s*\}/u,
    );
    expect(locationContent).toContain("SAVE_LOCATION_KEYS.map((key) => (");
    expect(locationContent).toContain("save_locations.tabs_compact.${key}");
    const platformButtonStart = locationContent.indexOf("<Button");
    const platformButton = locationContent.slice(
      platformButtonStart,
      locationContent.indexOf(">", platformButtonStart) + 1,
    );
    expect(platformButton).toContain("h={14}");
    expect(platformButton).toContain('flexDirection="column"');
    expect(platformButton).toContain('fontSize="sm"');
    const platformIconStart = locationContent.indexOf("<AppIcon");
    const platformIcon = locationContent.slice(
      platformIconStart,
      locationContent.indexOf("/>", platformIconStart) + 2,
    );
    expect(platformIcon).toContain("as={SAVE_LOCATION_ICONS[key]}");
    expect(platformIcon).toContain('aria-hidden="true"');
    expect(platformIcon).toContain('size="md"');
    expect(platformIcon).toContain("strokeWidth={2.25}");
    expect(locationContent).toContain(
      "save_locations.items.${saveLocationKey}.path",
    );
    expect(locationContent).not.toContain("save_locations.source_prompt");
  });

  it("separates Steam Deck from desktop Linux and keeps platform names out of details", () => {
    const saveDialog = dialogSource("palworld-save-dialog");
    const locationContent = saveDialog.slice(
      saveDialog.indexOf("<Collapsible.Content"),
      saveDialog.indexOf("</Collapsible.Content>"),
    );
    expect(locationContent).not.toContain("save_locations.items.${key}.system");
    expect(source).toContain('"steam_deck",\n  "steam_linux",');
  });

  it("warns Xbox and PC Game Pass users that Level.sav must be exported first", () => {
    const saveDialog = dialogSource("palworld-save-dialog");
    const locationContent = saveDialog.slice(
      saveDialog.indexOf("<Collapsible.Content"),
      saveDialog.indexOf("</Collapsible.Content>"),
    );

    expect(locationContent).toContain('saveLocationKey === "game_pass"');
    expect(locationContent).toContain(
      '"save_locations.items.game_pass.warning"',
    );
  });

  it("keeps four visible target-passive slots with add buttons for empty slots", () => {
    expect(source).toContain('data-testid="target-passive-slot-grid"');
    expect(source).toContain('data-testid="target-passive-slot"');
    expect(source).not.toContain("passivePickerSlot");
    expect(source).toContain("{ length: MAX_PASSIVE_SELECTION }");
    expect(source).toContain("(_, index) => {");
    expect(source).toContain("const passiveId = selectedPassiveIds[index]");
    expect(source).toContain('className="palworld-passive-slot-add"');
    expect(source).toContain("key={`empty-passive-${index}`}");
    expect(source).toMatch(
      /aria-label=\{t\(\s*"calculator\.passive_select_action",?\s*\)\}/u,
    );
    expect(source).not.toContain('t("calculator.passive_edit_action")');
    expect(source).not.toContain("selectedPassiveIds.length === 0 ? (");
    expect(source).toContain("<PassiveSkillPickerDialog");
    expect(source).not.toContain('id="palworld-passive-picker"');
  });

  it("keeps empty passive slots at the same intrinsic height as skill surfaces", () => {
    const triggerStart = source.indexOf('data-testid="passive-picker-trigger"');
    const emptySlot = source.slice(
      triggerStart,
      source.indexOf("</Button>", triggerStart),
    );

    expect(emptySlot).toContain('h="auto"');
    expect(emptySlot).toContain("minH={0}");
  });

  it("uses one responsive dialog with one scroll surface for passive results", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );

    expect(passivePicker).toContain("<Dialog.Root");
    expect(passivePicker).toContain("finalFocusEl={finalFocusEl}");
    expect(passivePicker).toContain("lazyMount");
    expect(passivePicker).toContain("unmountOnExit");
    expect(passivePicker).toContain('data-testid="passive-picker-panel"');
    expect(passivePicker).toContain('maxW={{ base: "none", md: "48rem" }}');
    expect(passivePicker).toContain('h={{ base: "100dvh", md: "auto" }}');
    expect(passivePicker).toContain('overflowY="auto"');
    expect(passivePicker).toContain('id="palworld-passive-picker-search"');
    expect(passivePicker).toContain("autoFocus");
    expect(passivePicker).toContain("optionGroups");
    expect(passivePicker).not.toContain("ownedOptions");
    expect(passivePicker).not.toContain("missingOptions");
    expect(passivePicker).toContain("selectedValues.includes(option.value)");
    expect(passivePicker).toContain('className="palworld-passive-picker-grid"');
    expect(passivePicker).toContain("onClick={() => onToggle(option.value)}");
    expect(passivePicker).toContain("safePassiveLabel(option.value, locale)");
    expect(source).toContain("option.description,");
    expect(passivePicker).toContain("normalizedQuery && option.description");
    expect(passivePicker).toContain(
      'className="palworld-passive-choice__description"',
    );
    expect(passivePicker).toContain("aria-pressed={selected}");
    expect(passivePicker).not.toContain('role="listbox"');
    expect(passivePicker).not.toContain('role="option"');
    expect(passivePicker).not.toContain("aria-selected={selected}");
    expect(passivePicker).not.toContain("description={option.description}");
    expect(passivePicker).not.toContain("ownershipLabel=");
    expect(passivePicker).not.toContain("<PassiveSkillContent");
    expect(passivePicker).toContain('t("calculator.passive_done")');
    expect(passivePicker).not.toContain("<SearchCombobox");
  });

  it("keeps the passive completion action in the dialog footer", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );
    const footer = passivePicker.slice(
      passivePicker.indexOf("<Dialog.Footer"),
      passivePicker.indexOf("</Dialog.Footer>"),
    );

    expect(footer).toContain('t("calculator.passive_done")');
    expect(footer).toContain("onClick={onClose}");
    expect(footer).not.toContain("<Dialog.CloseTrigger");
  });

  it("restores focus after the externally controlled passive dialog closes", () => {
    expect(source).toContain("passivePickerReturnFocusRef");
    expect(source).toContain("resolvePassivePickerFinalFocus");
    expect(source).toContain("finalFocusEl={resolvePassivePickerFinalFocus}");
  });

  it("groups all passives by game rank and keeps low-priority tiers collapsed", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );

    expect(source).toContain("const PASSIVE_TIER_KEYS");
    expect(source).toContain("function passiveTierKey(");
    expect(passivePicker).toContain("groupPassiveOptionsByTier");
    expect(source).toContain('"worldTree"');
    expect(source).toContain('"prismatic"');
    expect(source).toContain('"gold"');
    expect(source).toContain('"common"');
    expect(source).toContain('"negative"');
    expect(passivePicker).toContain(
      'new Set<PassiveTierKey>(["worldTree", "prismatic", "gold"])',
    );
    expect(passivePicker).toContain("selectedValues.includes(option.value)");
    expect(passivePicker).toContain("Boolean(query)");
    expect(passivePicker).toContain("calculator.passive_tier_${tierKey}");
    expect(passivePicker).toMatch(
      /<Collapsible\.Root[\s\S]*?lazyMount[\s\S]*?unmountOnExit/u,
    );
  });

  it("lets users collapse a passive tier that contains selected skills", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );
    const tierGroup = passivePicker.slice(
      passivePicker.indexOf("function renderTierGroup("),
      passivePicker.indexOf("function renderTierGroups("),
    );

    expect(tierGroup).toContain("const forceOpen = Boolean(query);");
    expect(tierGroup).not.toContain(
      "groupOptions.some((option) => selectedValues.includes(option.value))",
    );
  });

  it("keeps passive labels in a flex wrapper separate from text clamping", () => {
    const passiveContent = source.slice(
      source.indexOf("function PassiveSkillContent"),
      source.indexOf("function PassiveTag"),
    );

    expect(passiveContent).toMatch(
      /className="palworld-passive-skill__label"[\s\S]*?display="flex"[\s\S]*?flexDirection="column"[\s\S]*?justifyContent="center"[\s\S]*?<Text[\s\S]*?lineClamp=/u,
    );
    expect(passiveContent).not.toContain("description?: string");
    expect(passiveContent).not.toContain("ownershipLabel?: string");
    expect(passiveContent).not.toContain("selected?: boolean");
  });

  it("shows only the passive name inside selected passive summaries", () => {
    const selectedPassive = source.slice(
      source.indexOf("function SelectedPassiveSkill("),
      source.indexOf("function genderLabel("),
    );

    expect(selectedPassive).toContain("safePassiveLabel(passiveId, locale)");
    expect(selectedPassive).not.toContain("<PassiveSkillContent");
    expect(selectedPassive).not.toContain(
      'className="palworld-passive-skill__rank"',
    );
  });

  it("animates only picker and selected-target passive surfaces", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );
    const passiveTag = source.slice(
      source.indexOf("function PassiveTag("),
      source.indexOf("function RouteRequirements("),
    );
    const selectedPassive = source.slice(
      source.indexOf("function SelectedPassiveSkill("),
      source.indexOf("function genderLabel("),
    );

    expect(passivePicker).toContain('data-passive-motion="interactive"');
    expect(selectedPassive).toContain('data-passive-motion="interactive"');
    expect(passiveTag).toContain('data-passive-motion="static"');
    expect(passiveTag).not.toContain("palworld-passive-skill__selection-frame");
    expect(passiveTag).toContain('alignSelf="flex-start"');
    expect(passiveTag).not.toContain('w="full"');
    expect(passiveTag).not.toContain('maxW="full"');
  });

  it("keeps one tier hierarchy and marks ownership on each passive option", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );
    const calculatorPanel = source.slice(
      source.indexOf('data-testid="palworld-calculator-panel"'),
      source.indexOf("ref={resultsRef}"),
    );
    const saveDialog = dialogSource("palworld-save-dialog");

    expect(calculatorPanel).not.toContain("<OwnedPassiveSkillButton");
    expect(source).not.toContain("function OwnedPassiveSkillButton");
    expect(passivePicker).toContain(
      "const optionGroups = groupPassiveOptionsByTier(filteredOptions);",
    );
    expect(passivePicker).toContain("renderTierGroups(optionGroups)");
    expect(passivePicker).not.toContain('ownership: "owned" | "missing"');
    expect(passivePicker).not.toContain('t("owned_passives.title")');
    expect(passivePicker).toContain("data-passive-ownership=");
    expect(passivePicker).toContain('t("calculator.owned_count"');
    expect(passivePicker).toContain('t("calculator.passive_group_missing")');
    expect(passivePicker).toContain(
      "aria-label={`${passiveLabel} ${ownershipLabel}`}",
    );
    expect(passivePicker).toContain('ownership === "owned" ? (');
    expect(passivePicker).toContain(
      'className="palworld-passive-choice__surface"',
    );
    expect(passivePicker).toContain('className="palworld-passive-owned-count"');
    expect(passivePicker).toContain("x{ownedCount}");
    expect(passivePicker).not.toContain("×{ownedCount}");
    expect(passivePicker).not.toContain("<AppIcon as={Check}");
    expect(saveDialog).not.toContain("<OwnedPassiveSkillButton");
  });

  it("marks every picker option with save ownership without truncating the list", () => {
    expect(source).not.toContain("OWNED_PASSIVE_SHORTCUT_LIMIT");
    expect(source).not.toContain("ownedPassiveShortcuts");
    expect(source).toContain("ownedCount: ownedCounts.get(option.value)");
  });

  it("omits redundant scope and privacy notes from the upload dialog", () => {
    const saveDialog = dialogSource("palworld-save-dialog");

    expect(saveDialog).toContain('{ base: "7rem", md: "10rem" }');
    expect(saveDialog).not.toContain('t("upload.description")');
    expect(saveDialog).not.toContain('t("upload.payload_description")');
  });

  it("keeps gender constraints in detailed routes and compact formulas", () => {
    const palNode = source.slice(
      source.indexOf("function PalNode("),
      source.indexOf("function getParentAvailabilityView("),
    );
    const genderMarker = source.slice(
      source.indexOf("function GenderMarker("),
      source.indexOf("function sourceLocationLabel("),
    );
    const routeParent = source.slice(
      source.indexOf("function RouteParentNode("),
      source.indexOf("function RouteSourceDetails("),
    );
    const formulaPal = source.slice(
      source.indexOf("function CompactFormulaPal("),
      source.indexOf("function CompactPal("),
    );

    expect(source).toContain("function GenderMarker(");
    expect(source).toContain('gender === "Male" ? Mars : Venus');
    expect(palNode).toContain("<GenderMarker gender={gender}");
    expect(palNode).toContain("availabilityDetail?: string");
    expect(palNode).toContain("{availabilityDetail ?? availabilityView.label}");
    expect(palNode).not.toContain("` · ${availabilityDetail}`");
    expect(genderMarker).toContain('alignItems="center"');
    expect(genderMarker).toContain('size="sm"');
    expect(formulaPal).toContain("<GenderMarker gender={requiredGender} />");
    expect(styles).not.toContain(".palworld-compact-formula-gender");
    expect(source).toContain("requiredGender={step.parent1.requiredGender}");
    expect(source).toContain("requiredGender={step.parent2.requiredGender}");
    expect(source).toContain("requiredGender={outcome.parentRequiredGender}");
    expect(source).toContain("requiredGender={outcome.partnerRequiredGender}");
    expect(routeParent).toContain("gender={source?.gender}");
    expect(routeParent).toContain("sourceLocationLabel(source.slot, t)");
    expect(routeParent).toContain('parent.availability === "owned"');
    expect(routeParent).toContain("availabilityDetail={ownedSourceLocation}");
    expect(routeParent).not.toContain(".join(");
  });

  it("supports responsive deployment-provided key art instead of bundling an arbitrary Pal cluster", () => {
    expect(source).toContain("palworldHero768Href");
    expect(source).toContain("palworldHero1920Href");
    expect(source).toContain("palworldHero3840Href");
    expect(source).toContain("palworldAssetBaseHref ? (");
    expect(source).toContain('className="palworld-hero"');
    expect(source).toContain('className="palworld-hero-media"');
    expect(source).toContain('media="(max-width: 47.999rem)"');
    expect(source).toContain("srcSet={palworldHero768Href ?? undefined}");
    expect(source).toContain('fetchPriority="high"');
    expect(source).not.toContain("function HeroPalPortrait");
    expect(source).not.toContain('internalId="BlackGriffon"');
    expect(source).not.toContain('internalId="JetDragon"');
  });

  it("preserves the current save until a replacement finishes parsing", () => {
    const uploadHandler = source.slice(
      source.indexOf("async function handleSaveFiles"),
      source.indexOf("function handleStartingSpeciesChange"),
    );
    const beforePrepared = uploadHandler.slice(
      0,
      uploadHandler.indexOf("const prepared = await"),
    );

    expect(beforePrepared).not.toContain("setPreparedUpload(null)");
    expect(beforePrepared).not.toContain("setSelectedPassiveIds([])");
    expect(uploadHandler).toContain("setPreparedUpload(prepared)");
    expect(uploadHandler).toContain("setSelectedPassiveIds([])");
    expect(uploadHandler).toContain("setPassivePickerOpen(false)");
  });

  it("invalidates rendered routes whenever the target or passive selection changes", () => {
    const targetHandler = source.slice(
      source.indexOf("function handleTargetSpeciesChange"),
      source.indexOf("function togglePassive"),
    );
    const passiveHandlers = source.slice(
      source.indexOf("function togglePassive"),
      source.indexOf("const scrollResultsIntoView"),
    );

    expect(targetHandler).toContain("setPlan(null)");
    expect(passiveHandlers.match(/setPlan\(null\)/gu)).toHaveLength(1);
    expect(source).toContain("onChange={handleTargetSpeciesChange}");
  });

  it("scrolls parent-pair results only after asynchronous data has rendered", () => {
    const scrollBehavior = source.slice(
      source.indexOf("const scrollResultsIntoView"),
      source.indexOf("async function handlePlanRoutes"),
    );
    const submitHandler = source.slice(
      source.indexOf("async function handleSubmitBreedingQuery"),
      source.indexOf(
        "return (",
        source.indexOf("async function handleSubmitBreedingQuery"),
      ),
    );
    const parentSubmitBranch = submitHandler.slice(
      submitHandler.indexOf("setPlan(null)"),
    );

    expect(scrollBehavior).toContain("useCallback");
    expect(scrollBehavior).toContain("submittedParentBreedingQuery");
    expect(scrollBehavior).toContain('parentBreedingDataStatus !== "ready"');
    expect(scrollBehavior).toContain('parentBreedingDataStatus !== "error"');
    expect(scrollBehavior).toContain("scrollResultsIntoView();");
    expect(parentSubmitBranch).not.toContain("scrollResultsIntoView();");
  });

  it("scrolls target results only after the plan has rendered", () => {
    const scrollBehavior = source.slice(
      source.indexOf("const scrollResultsIntoView"),
      source.indexOf("async function handlePlanRoutes"),
    );
    const planHandler = source.slice(
      source.indexOf("async function handlePlanRoutes"),
      source.indexOf("async function handleSubmitBreedingQuery"),
    );

    expect(scrollBehavior).toContain('status !== "ready"');
    expect(scrollBehavior).toContain("!plan");
    expect(scrollBehavior).toContain("scrollResultsIntoView();");
    expect(planHandler).not.toContain("scrollResultsIntoView();");
  });

  it("presents save-location help as a highlighted action", () => {
    const saveDialog = dialogSource("palworld-save-dialog");
    const locationTrigger = saveDialog.slice(
      saveDialog.indexOf("<Collapsible.Trigger"),
      saveDialog.indexOf("<Collapsible.Content"),
    );

    expect(locationTrigger).toContain('variant="outline"');
    expect(locationTrigger).toContain(
      'borderColor="var(--palworld-warning-border)"',
    );
    expect(locationTrigger).toContain('bg="var(--palworld-warning-bg)"');
  });

  it("keeps every formula route available without incremental show-more controls", () => {
    expect(source).toContain(
      "const matchingRoutes = filterBreedingRoutesBySearch(",
    );
    expect(source).toContain("matchingRoutes.map((route)");
    expect(source).not.toContain("FORMULA_INITIAL_VISIBLE_ROUTE_COUNT");
    expect(source).not.toContain("FORMULA_VISIBLE_ROUTE_COUNT_STEP");
    expect(source).not.toContain('t("results.show_more_routes"');
    expect(source).toContain("INVENTORY_PRIORITY_ROUTE_COUNT");
    expect(resultsSearchToolbarSource).toContain('type="search"');
    expect(source).toContain('id="palworld-parent-results-search"');
    expect(source).toContain('id="palworld-breeding-results-search"');
    expect(resultsSearchToolbarSource).toContain("name={id}");
    expect(styles).toContain("content-visibility: auto");
  });

  it("matches route filters against visible labels and exact Paldeck codes", () => {
    const routeSearch = source.slice(
      source.indexOf("function createRouteSearchEntry("),
      source.indexOf("function CompactFormulaRouteRow("),
    );

    expect(routeSearch).toContain("matchesResultsSearch");
    expect(routeSearch).toContain("paldeckCode");
    expect(routeSearch).toContain("step.parent1.species");
    expect(routeSearch).toContain("step.parent2.species");
    expect(routeSearch).not.toContain("routeDisplayKey");
    expect(routeSearch).not.toContain("requirement.itemId");
    expect(routeSearch).not.toContain("step.child");
  });

  it("keeps result filters in one stable responsive sticky toolbar", () => {
    expect(source).toContain(
      'import ResultsSearchToolbar from "./ResultsSearchToolbar"',
    );
    expect(source.match(/<ResultsSearchToolbar/gu)).toHaveLength(2);
    expect(source).not.toContain("<ResultsSearchDock");
    expect(source).not.toContain("activeResultsSearch");
    expect(resultsSearchToolbarSource).toContain(
      'aria-label={commonT("clear")}',
    );
    expect(resultsSearchToolbarSource).toContain('onQueryChange("")');
    expect(resultsSearchToolbarSource).toContain("inputRef.current?.focus()");
    const toolbarStyles = styles.slice(
      styles.indexOf(".palworld-results-search-toolbar {"),
      styles.indexOf(".palworld-shell-fallback {"),
    );
    expect(toolbarStyles).toContain("position: sticky;");
    expect(toolbarStyles).not.toContain("position: fixed;");
    expect(toolbarStyles).toContain("::-webkit-search-cancel-button");
  });

  it("lays out compact formula results in responsive one-to-three-column grids", () => {
    expect(
      source.match(/className="palworld-formula-result-grid"/gu),
    ).toHaveLength(2);
    expect(styles).toContain(
      "grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));",
    );
  });

  it("mounts only prioritized inventory summaries and the selected detail", () => {
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function createRouteSearchEntry("),
    );

    expect(collectionSource).toContain(
      "const matchingRoutes = filterBreedingRoutesBySearch(",
    );
    expect(collectionSource).toContain("routes={prioritizedRoutes}");
    expect(collectionSource).toContain("routes.map((route, index)");
    expect(collectionSource).toContain("const selectedRoute =");
    expect(collectionSource).toContain("routes.find(");
    expect(collectionSource).not.toContain("renderedRouteCount");
    expect(collectionSource).not.toContain("window.requestAnimationFrame");
    expect(collectionSource).not.toContain("groupRoutesByChildChain");
    expect(collectionSource).not.toContain("<details");
  });

  it("deduplicates formulas and inventory routes by their public identities", () => {
    expect(source).toContain("createPalworldFormulaRouteSignature");
    expect(source).toContain("createPalworldRouteExecutionSignature");
    expect(source).toContain("const routeIdentity =");
    expect(source).toContain('plan?.mode === "formula"');
    expect(source).toContain("const key = routeIdentity(route)");
    expect(source).toContain(
      "createPalworldRouteExecutionSignature(route) === selectedRouteKey",
    );
    expect(source).not.toContain("const ROUTE_INITIAL_RENDER_COUNT");
  });

  it("presents eight prioritized inventory routes in a responsive master-detail browser", () => {
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function ExcludedRouteNotice("),
    );
    const routeCardSource = source.slice(
      source.indexOf("function RouteCard("),
      source.indexOf("function RouteCollection("),
    );
    const palNodeSource = source.slice(
      source.indexOf("function PalNode("),
      source.indexOf("function getParentAvailabilityView("),
    );

    expect(source).toContain("const INVENTORY_PRIORITY_ROUTE_COUNT = 8");
    expect(collectionSource).toMatch(
      /activeInventoryGroup\.routes\.slice\(\s*0,\s*INVENTORY_PRIORITY_ROUTE_COUNT,\s*\)/u,
    );
    expect(collectionSource).toContain('data-testid="inventory-route-browser"');
    expect(collectionSource).toContain('data-testid="inventory-route-list"');
    expect(collectionSource).toContain('data-testid="inventory-route-detail"');
    expect(collectionSource).toContain('data-testid="inventory-route-back"');
    expect(collectionSource).toContain(
      'position={{ base: "sticky", lg: "static" }}',
    );
    expect(collectionSource).toContain(
      'top={{ base: "calc(4.25rem + env(safe-area-inset-top))", lg: "auto" }}',
    );
    expect(collectionSource).toContain("selectedRouteButtonRef");
    expect(collectionSource).toContain("backButtonRef");
    expect(collectionSource).toContain("target.focus({ preventScroll: true })");
    expect(collectionSource).toContain(
      'target.scrollIntoView({ block: "nearest" })',
    );
    expect(collectionSource).toContain("mobileRouteDetailOpen");
    expect(collectionSource).toContain("setMobileRouteDetailOpen(true)");
    expect(collectionSource).toContain("setMobileRouteDetailOpen(false)");
    expect(collectionSource).toContain('t("results.back_to_routes")');
    expect(collectionSource).not.toContain("<RouteGenerationGroup");
    expect(collectionSource).not.toContain("<RouteChildChainGroup");
    expect(collectionSource).not.toContain("<details");
    expect(routeCardSource).toContain('display={{ base: "flex", xl: "grid" }}');
    expect(routeCardSource).toContain(
      'alignItems={{ base: "stretch", xl: "center" }}',
    );
    expect(palNodeSource).toContain("{caption ? (");
    expect(palNodeSource).toContain("lineClamp={2}");
    expect(palNodeSource).not.toContain("borderInlineStartWidth");
  });

  it("keeps both inventory readiness tabs visible and disables empty groups", () => {
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function createRouteSearchEntry("),
    );

    expect(collectionSource).toContain(
      'const inventoryGroupKeys = ["parents_owned", "needs_supplement"]',
    );
    expect(source).toContain('route.group === "parents_owned" ||');
    expect(source).toContain('route.group === "needs_supplement"');
    expect(collectionSource).toContain('data-testid="inventory-route-tabs"');
    expect(collectionSource).toContain(
      'data-testid="inventory-route-tab-list"',
    );
    expect(collectionSource).toContain("<Tabs.Root");
    expect(collectionSource).toContain("<Tabs.List");
    expect(collectionSource).toContain(
      'gridTemplateColumns="repeat(2, minmax(0, 1fr))"',
    );
    expect(collectionSource).not.toContain(
      'top="calc(52px + env(safe-area-inset-top))"',
    );
    expect(source).toContain(
      'scrollMarginTop="calc(4.25rem + env(safe-area-inset-top))"',
    );
    const mainSource = source.slice(
      source.indexOf('as="main"'),
      source.indexOf('className="palworld-hero"'),
    );
    expect(mainSource).toContain('overflow="clip"');
    expect(mainSource).not.toContain('overflow="hidden"');
    expect(collectionSource).toContain('t("results.inventory_groups_label")');
    expect(collectionSource).toContain("t(`results.groups.${group.key}`)");
    expect(collectionSource).toContain("({group.routes.length})");
    expect(collectionSource).toContain("disabled={group.routes.length === 0}");
    expect(source).toContain(
      'selected ? "var(--palworld-fg)" : "var(--palworld-canvas-fg)"',
    );
    expect(collectionSource).toContain(
      "inventoryGroups.find((group) => group.routes.length > 0)",
    );
    expect(collectionSource).not.toContain("inventoryGroups.length === 2");
    expect(collectionSource).not.toContain("<InventoryRouteGroupHeading");
    expect(source).not.toContain("function InventoryRouteGroupHeading(");
    expect(collectionSource).not.toContain(
      ".filter((group) => group.routes.length > 0)",
    );
    expect(collectionSource).not.toContain('"excluded_by_policy" as const');
  });

  it("renders structured route requirements as compact actions with merchant source links", () => {
    const requirementSource = source.slice(
      source.indexOf("function RouteRequirements("),
      source.indexOf("function FittedPassiveSkillLabel("),
    );
    const requirementsPanelSource = source.slice(
      source.indexOf("function RouteRequirements("),
      source.indexOf("function RouteRequirementItem("),
    );
    const routeSource = source.slice(
      source.indexOf("function RouteCard("),
      source.indexOf("function RouteCollection("),
    );

    expect(requirementSource).toContain("route.requirements");
    expect(requirementSource).toContain(
      'requirement.type === "missing_parent"',
    );
    expect(requirementSource).toContain(
      'requirement.type === "missing_passive"',
    );
    expect(requirementSource).toContain(
      'requirement.itemId === "PalGenderReverse"',
    );
    expect(requirementSource).toContain(
      'requirement.itemId === "passive_implant"',
    );
    expect(requirementSource).toContain("safePalLabel");
    expect(requirementSource).toContain("safePassiveLabel");
    expect(requirementSource).toContain("route.complexity.blockerCount");
    expect(requirementSource).toContain("requirement.quantity > 1");
    expect(requirementSource).toContain("requirement.target.sourceId");
    expect(requirementSource).toContain("route.sources.find");
    expect(requirementSource).toContain("sourceLocationLabel");
    expect(requirementSource).toContain("requirement.offers.map");
    expect(requirementSource).toContain("offer.sourceUrl");
    expect(requirementSource).toContain('target="_blank"');
    expect(requirementSource).toContain('rel="noopener noreferrer"');
    expect(requirementSource).toContain('t("routes.implant_purchase"');
    expect(requirementSource).toContain(
      "aria-label={`${itemLabel}. ${purchaseLabel}`}",
    );
    expect(requirementsPanelSource).toContain('borderStyle="solid"');
    expect(requirementsPanelSource).toContain(
      'bg="var(--palworld-surface-a72)"',
    );
    expect(requirementsPanelSource).not.toContain('borderStyle="dashed"');
    expect(requirementsPanelSource).not.toContain(
      'bg="var(--palworld-error-bg)"',
    );
    expect(requirementsPanelSource).toContain('flexWrap="wrap"');
    expect(requirementsPanelSource).toContain(
      "const missingPassiveRequirements = route.requirements.filter(",
    );
    expect(requirementsPanelSource).toContain(
      "const otherRequirements = route.requirements.filter(",
    );
    expect(requirementsPanelSource).toContain("missingPassiveRequirements.map");
    expect(requirementsPanelSource).toContain('t("routes.missing_passive")');
    const requirementItemSource = source.slice(
      source.indexOf("function RouteRequirementItem("),
      source.indexOf("function FittedPassiveSkillLabel("),
    );
    expect(requirementItemSource).not.toContain('t("routes.missing_passive")');
    expect(routeSource).toContain("<RouteRequirements");
    expect(routeSource).not.toContain("desiredPassiveAcquisitions");
    expect(routeSource).not.toContain("route.implantPassives");
    expect(routeSource).not.toContain('t("routes.implant_ready")');
  });

  it("drives the visible recommendation from the response indexes", () => {
    expect(source).not.toContain("const remainingRoutes = allRoutes.slice(1)");
    expect(source).toContain("routes={allRoutes}");
    expect(source).toContain("plan?.recommendedRouteIndexes");
    expect(source).not.toContain("recommended={index === 0}");
    expect(source).toContain("activeInventoryGroup.routes");
    expect(source).toContain("recommendedInventoryGroup ??");
    expect(source).toContain(
      "routes.find((route) =>\n      recommendedRouteKeys.has(createPalworldRouteExecutionSignature(route))",
    );
    expect(source).toContain("recommended={recommendedRouteKeys.has(");
  });

  it("keys RouteCollection with the complete route collection revision", () => {
    const collectionCall =
      source.match(/<RouteCollection[\s\S]*?\/>/u)?.[0] ?? "";

    expect(source).toContain(
      'import { createPalworldRouteCollectionRevision } from "../../src/route-collection-revision";',
    );
    expect(collectionCall).toContain(
      "key={createPalworldRouteCollectionRevision(plan)}",
    );
  });

  it("routes all result notices through the tested visibility resolver", () => {
    const collectionCall =
      source.match(/<RouteCollection[\s\S]*?\/>/u)?.[0] ?? "";
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function createRouteSearchEntry("),
    );

    expect(collectionCall).toContain("searchMeta={plan.searchMeta}");
    expect(collectionSource).toContain(
      "<ExcludedRouteNotice searchMeta={searchMeta} />",
    );
    expect(
      collectionSource.match(/resolveBreedingSearchResultVisibility/gu),
    ).toHaveLength(2);
    expect(collectionSource).toContain(
      "if (!visibility.showExcludedRouteCount) return null",
    );
    expect(collectionSource).toContain(
      'visibility.truncationNotice === "empty"',
    );
    expect(collectionSource).toContain(
      't("results.excluded_by_policy", { count })',
    );
    expect(source.match(/<ExcludedRouteNotice\b/gu)).toHaveLength(1);
    expect(source).toContain(
      "<SearchTruncationNotice searchMeta={plan.searchMeta} />",
    );
    expect(source).toContain(
      "resolveBreedingSearchResultVisibility(plan.searchMeta)",
    );
    expect(source).toContain(".showDefinitiveNoRoutes ? (");
  });

  it("uses official English merchant item names", () => {
    const messages = JSON.parse(
      readFileSync(resolve("app/src/locales/en.json"), "utf8"),
    ) as {
      routes: {
        gender_reverse_item: string;
        passive_implant_item: string;
      };
    };

    expect(messages.routes.gender_reverse_item).toBe(
      "Pal Reverser ×{quantity}",
    );
    expect(messages.routes.passive_implant_item).toBe(
      "Implant: {passive} ×{quantity}",
    );
  });

  it("replaces the owned availability status with the Palbox position", () => {
    const palNodeSource = source.slice(
      source.indexOf("function PalNode("),
      source.indexOf("function getParentAvailabilityView("),
    );
    const routeParentSource = source.slice(
      source.indexOf("function RouteParentNode("),
      source.indexOf("function RouteSourceDetails("),
    );

    expect(palNodeSource).toContain(
      "{availabilityDetail ?? availabilityView.label}",
    );
    expect(palNodeSource).not.toContain("` · ${availabilityDetail}`");
    expect(palNodeSource).toMatch(
      /lineClamp=\{availabilityDetail \? 2 : 1\}\s+whiteSpace="pre-line"/u,
    );
    expect(routeParentSource).toContain(
      "availabilityDetail={ownedSourceLocation}",
    );
    expect(source).toContain("getDisplayContainerSlot(match[2])");
  });

  it("shows only alternative save-source combinations in collapsed details", () => {
    const sourceDetails = source.slice(
      source.indexOf("function RouteSourceDetails("),
      source.indexOf("function BreedingEquationOperator("),
    );
    const messages = JSON.parse(
      readFileSync(resolve("app/src/locales/en.json"), "utf8"),
    ) as {
      routes: {
        location_palbox_position: string;
        sources_with_alternatives: string;
      };
    };

    expect(sourceDetails).toContain(
      "if (alternativeSourceSets.length === 0) return null",
    );
    expect(sourceDetails).toContain("<details");
    expect(sourceDetails).not.toContain("open=");
    expect(sourceDetails).toContain('t("routes.sources_with_alternatives"');
    expect(sourceDetails).not.toContain('t("routes.sources")');
    expect(sourceDetails).not.toContain("route.sources.map");
    expect(sourceDetails).toContain("sourceLocationLabel");
    expect(source).toContain("<RouteSourceDetails");
    expect(messages.routes.sources_with_alternatives).toBe(
      "{count} other available combinations",
    );
    expect(messages.routes.location_palbox_position).toBe(
      "Palbox · page {page}\nrow {row} · column {column}",
    );
  });

  it("shows an owned target even when no breeding route exists", () => {
    expect(source).toContain(
      "totalRouteCount === 0 && plan.ownedTargetSources.length === 0",
    );
    expect(source).toMatch(
      /plan\.ownedTargetSources\.length > 0[\s\S]*?totalRouteCount > 0/u,
    );
    expect(source).toContain('t("results.target_already_owned"');
  });

  it("renders larger circular Pal portraits from the transparent game icons", () => {
    const avatarSource = source.slice(
      source.indexOf("function PalAvatar("),
      source.indexOf("function PaldeckBadge("),
    );

    expect(avatarSource).toContain('size === "sm" ? 9 : 14');
    expect(avatarSource).toContain('borderRadius="full"');
    expect(avatarSource).toContain('objectFit: "cover"');
  });

  it("serves Pal portraits from stable responsive image candidates", () => {
    const iconHrefSource = source.slice(
      source.indexOf("function palworldIconHref("),
      source.indexOf("const palworldHero1920Href"),
    );
    const iconImageSource = source.slice(
      source.indexOf("function PalIconImage("),
      source.indexOf("function PalAvatar("),
    );
    const avatarSource = source.slice(
      source.indexOf("function PalAvatar("),
      source.indexOf("function PaldeckBadge("),
    );
    const formulaPalSource = source.slice(
      source.indexOf("function CompactFormulaPal("),
      source.indexOf("function CompactPal("),
    );

    expect(iconHrefSource).toContain(
      "`${palworldAssetBaseHref}/pals/48/${fileName}.webp 48w`",
    );
    expect(iconHrefSource).toContain(
      "`${palworldAssetBaseHref}/pals/96/${fileName}.webp 96w`",
    );
    expect(iconHrefSource).toContain("`${src} 192w`");
    expect(iconHrefSource).toContain(
      "const src = `${palworldAssetBaseHref}/pals/${fileName}.webp`",
    );
    expect(iconHrefSource.match(/\b(?:48|96|192)w\b/gu)).toEqual([
      "48w",
      "96w",
      "192w",
    ]);
    expect(iconImageSource).toContain("{...props}");
    expect(iconImageSource).toContain("src={src}");
    expect(avatarSource).toContain("src={iconSource?.src ?? null}");
    expect(avatarSource).toContain("srcSet={iconSource?.srcSet}");
    expect(avatarSource).toContain('sizes={size === "sm" ? "36px" : "56px"}');
    expect(formulaPalSource).toContain("src={iconSource?.src ?? null}");
    expect(formulaPalSource).toContain("srcSet={iconSource?.srcSet}");
    expect(formulaPalSource).toContain('sizes="44px"');
  });

  it("uses the same Paldeck badge for selected Pals and dropdown options", () => {
    const comboboxSource = source.slice(
      source.indexOf("function SearchCombobox("),
      source.indexOf("function PassiveSkillPickerPanel("),
    );

    expect(comboboxSource).toContain(
      "<PaldeckBadge internalId={selectedAvatarInternalId} />",
    );
    expect(comboboxSource).toMatch(
      /<PaldeckBadge\s+internalId=\{option\.avatarInternalId\}\s*\/>/u,
    );
    expect(comboboxSource).toMatch(
      /_selection=\{\s*selectedAvatarInternalId\s*\?\s*\{ bg: "transparent" \}\s*:\s*undefined\s*\}/u,
    );
  });

  it("reuses the shared Paldeck badge in compact inventory routes", () => {
    const compactPalSource = source.slice(
      source.indexOf("function CompactPal("),
      source.indexOf("export default function PalworldBreedingCalculatorPage("),
    );

    expect(compactPalSource).toContain(
      "<PaldeckBadge internalId={internalId} />",
    );
    expect(compactPalSource).not.toContain(
      'className="palworld-compact-pal__paldeck"',
    );
    expect(compactPalSource).not.toContain("const paldeckBadge =");
  });

  it("does not repeat a route-order explanation above the grouped results", () => {
    expect(source).not.toContain('t("results.all_routes_description")');
  });
});
