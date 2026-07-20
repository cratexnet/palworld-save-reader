import { describe, expect, it } from "vitest";
import {
  PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY,
  readPalworldBreedingCalculatorSessionState,
  writePalworldBreedingCalculatorSessionState,
} from "../app/src/calculator-session-state";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function createPreparedUpload() {
  return {
    v: 1 as const,
    pals: [{ i: "pal-1", s: "Anubis", g: "M" as const, p: ["Legend"] }],
  };
}

describe("planner session state", () => {
  it("stores only compact inventory and planner selections", () => {
    const storage = createStorage();
    writePalworldBreedingCalculatorSessionState(storage, {
      preparedUpload: createPreparedUpload(),
      targetSpecies: "Anubis",
      startingSpecies: "Lamball",
      selectedPassiveIds: ["Legend"],
    });

    const serialized = storage.getItem(
      PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY,
    );
    const restored = readPalworldBreedingCalculatorSessionState(storage);

    expect(serialized).not.toContain("source");
    expect(serialized).not.toContain("skipped");
    expect(serialized).not.toContain("header");
    expect(serialized).not.toContain("encoded");
    expect(serialized).not.toContain("saveBytes");
    expect(restored?.preparedUpload).not.toHaveProperty("encoded");
    expect(restored?.preparedUpload?.pals).toHaveLength(1);
    expect(restored?.targetSpecies).toBe("Anubis");
    expect(restored?.startingSpecies).toBe("Lamball");
    expect(restored?.selectedPassiveIds).toEqual(["Legend"]);
  });

  it("drops malformed or incompatible state", () => {
    const storage = createStorage();
    storage.setItem(
      PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY,
      '{"v":99}',
    );

    expect(readPalworldBreedingCalculatorSessionState(storage)).toBeNull();
    expect(
      storage.getItem(PALWORLD_BREEDING_CALCULATOR_SESSION_STORAGE_KEY),
    ).toBeNull();
  });

  it("does not block planner startup when session storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new DOMException("Storage access denied", "SecurityError");
      },
      removeItem: () => {
        throw new DOMException("Storage access denied", "SecurityError");
      },
    } as unknown as Storage;

    expect(() =>
      readPalworldBreedingCalculatorSessionState(storage),
    ).not.toThrow();
    expect(readPalworldBreedingCalculatorSessionState(storage)).toBeNull();
  });
});
