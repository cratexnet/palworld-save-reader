import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("breeding route parent layout", () => {
  it("lets a parent wrapper own the width without applying row flex-basis as height", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain("contained = false");
    expect(source).toMatch(/flex=\{\s*compact && !contained/gu);
    expect(source).toContain(
      "compact\n        contained\n        availability=",
    );
  });
});
