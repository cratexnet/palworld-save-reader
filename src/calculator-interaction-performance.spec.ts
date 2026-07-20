import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
  "utf8",
);
const viteConfigSource = readFileSync(resolve("app/vite.config.ts"), "utf8");
const appSource = readFileSync(resolve("app/src/App.tsx"), "utf8");
const chakraSystemSource = readFileSync(
  resolve("app/src/chakra-system.ts"),
  "utf8",
);
const saveParserWorkerSource = readFileSync(
  resolve("app/src/save-parser.worker.ts"),
  "utf8",
);
const calculatorSessionStateSource = readFileSync(
  resolve("app/src/calculator-session-state.ts"),
  "utf8",
);
const preparedUploadSource = readFileSync(
  resolve("src/prepared-owned-pals-upload.ts"),
  "utf8",
);

function readStaticImports(moduleSource: string) {
  return moduleSource.match(/^import[\s\S]*?;$/gmu)?.join("\n") ?? "";
}

describe("standalone planner interaction performance", () => {
  it("paints the planning state before committing the route result tree", () => {
    const planHandler = source.slice(
      source.indexOf("async function handlePlanRoutes"),
      source.indexOf("async function handleSubmitBreedingQuery"),
    );
    const paintYield = planHandler.indexOf("await waitForNextPaint();");
    const request = planHandler.indexOf("const response = await fetch(");
    const transition = planHandler.indexOf("startTransition(() => {");

    expect(paintYield).toBeGreaterThan(-1);
    expect(request).toBeGreaterThan(paintYield);
    expect(transition).toBeGreaterThan(request);
  });

  it("loads save parsing and payload compression only when requested", () => {
    const pageImports = readStaticImports(source);
    const sessionStateImports = readStaticImports(calculatorSessionStateSource);
    const planHandler = source.slice(
      source.indexOf("async function handlePlanRoutes"),
      source.indexOf("async function handleSubmitBreedingQuery"),
    );

    expect(pageImports).not.toContain(
      "createPreparedOwnedPalsUploadFromSaveBytes",
    );
    expect(pageImports).not.toContain("encodeOwnedPalsPayloadUpload");
    expect(pageImports).not.toContain("loadOozWasmPalworldOodleDecoder");
    expect(sessionStateImports).not.toContain('from "../../src/payload-codec"');
    expect(pageImports).not.toContain('"../../src/prepared-owned-pals-upload"');
    expect(saveParserWorkerSource).toContain(
      '"../../src/prepared-owned-pals-upload"',
    );
    expect(preparedUploadSource).not.toContain('from "./payload-codec"');
    expect(calculatorSessionStateSource).toContain("isCompactOwnedPalsPayload");
    expect(calculatorSessionStateSource).not.toContain(
      "normalizeOwnedPalsPayload",
    );
    expect(source).toContain('await import("../../src/payload-codec")');
    expect(planHandler).not.toContain("preparedUpload ??");
    expect(source).not.toContain('"../../src/ooz-wasm-decoder"');
    expect(saveParserWorkerSource).toContain('"../../src/ooz-wasm-decoder"');
  });

  it("uses static shards for no-save and parent queries while retaining the save POST", () => {
    const planHandler = source.slice(
      source.indexOf("async function handlePlanRoutes"),
      source.indexOf("async function handleSubmitBreedingQuery"),
    );
    const parentLoader = source.slice(
      source.indexOf("const requestParentBreedingOutcomes"),
      source.indexOf("const hasParentBreedingQuery"),
    );

    expect(source).toContain('from "../../src/static-breeding-data"');
    expect(planHandler).toContain("if (preparedUpload)");
    expect(planHandler).toContain("createPalworldBreedingRoutesFetchInput");
    expect(planHandler).toContain("loadTargetShard(selectedTarget)");
    expect(planHandler).toContain("createFormulaPlanFromTargetShard");
    expect(parentLoader).toContain("loadParentShard(");
    expect(parentLoader).not.toContain("fetch(");
    expect(source).not.toContain(
      "createPalworldParentBreedingOutcomesFetchInput",
    );
    expect(source).toContain("targetBreedingRequestIdRef");
    expect(planHandler).toContain(
      "requestId !== targetBreedingRequestIdRef.current",
    );
    expect(parentLoader).toContain(
      "requestId !== parentBreedingRequestIdRef.current",
    );
  });

  it("does not preload interaction-only chunks from the page shell", () => {
    expect(viteConfigSource).toContain("modulePreload: false");
  });

  it("does not ship Chakra recipes that the planner never renders", () => {
    expect(appSource).toContain("calculatorSystem");
    expect(appSource).not.toContain("defaultSystem");
  });

  it("ships the Dialog slot recipe required by the save-import overlay", () => {
    expect(chakraSystemSource).toContain("dialogSlotRecipe");
    expect(chakraSystemSource).toContain("dialog: dialogSlotRecipe");
  });

  it("moves save decompression and parsing off the main thread", () => {
    expect(source).toContain('from "../../src/save-parser-worker-client"');
    expect(source).toContain(
      'new Worker(new URL("./save-parser.worker.ts", import.meta.url)',
    );
    expect(source).not.toContain("createPreparedUploadOnMainThread");
    expect(source).not.toContain(
      'await import("../../src/prepared-owned-pals-upload")',
    );
  });

  it("bundles the module worker in a format that supports the Oodle decoder", () => {
    expect(viteConfigSource).toContain('worker: { format: "es" }');
  });

  it("avoids full-page raster work when toggling the save-location help", () => {
    const pageShell = source.slice(
      source.indexOf('<Box\n      as="main"'),
      source.indexOf("{calculationErrorMessage ?"),
    );
    const saveDialogMarker = source.indexOf(
      'data-testid="palworld-save-dialog"',
    );
    const saveDialog = source.slice(
      source.lastIndexOf("<Dialog.Root", saveDialogMarker),
      source.indexOf("</Dialog.Root>", saveDialogMarker) +
        "</Dialog.Root>".length,
    );
    const saveLocationHelp = saveDialog.slice(
      saveDialog.indexOf("<Collapsible.Root"),
      saveDialog.indexOf("</Collapsible.Root>"),
    );

    expect(pageShell.match(/position: "fixed"/gu) ?? []).toHaveLength(0);
    expect(pageShell).not.toContain("radial-gradient(");
    expect(pageShell).not.toContain("repeating-linear-gradient(");
    expect(saveLocationHelp).toContain(
      '<Collapsible.Content animation="none">',
    );
  });

  it("does not mount every passive option while collapsed groups are hidden", () => {
    const passivePicker = source.slice(
      source.indexOf("function PassiveSkillPickerDialog"),
      source.indexOf("function PalAvatar"),
    );

    expect(passivePicker).toMatch(
      /<Collapsible\.Root[\s\S]*?lazyMount[\s\S]*?unmountOnExit/u,
    );
    expect(passivePicker).not.toContain('role="listbox"');
    expect(passivePicker).not.toContain('role="option"');
  });
  it("unmounts inactive inventory tab routes instead of building hidden card trees", () => {
    const collectionSource = source.slice(
      source.indexOf("function RouteCollection("),
      source.indexOf("function routeSearchText("),
    );

    expect(collectionSource).toContain("<Tabs.Root");
    expect(collectionSource).toContain("lazyMount");
    expect(collectionSource).toContain("unmountOnExit");
    expect(collectionSource).toContain("activeInventoryGroup.routes");
    expect(collectionSource).not.toContain(
      "inventoryGroups.flatMap((group) => group.routes",
    );
  });
});
