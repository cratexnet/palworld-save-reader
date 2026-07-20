import { describe, expect, it } from "vitest";
import {
  buildCalculatorShareHash,
  parseCalculatorShareHash,
} from "../app/src/calculator-share-state";

const validators = {
  isPalId: (value: string) => ["Anubis", "SheepBall"].includes(value),
  isPassiveId: (value: string) =>
    ["Legend", "Runner", "Swift", "Workaholic", "Lucky"].includes(value),
};

describe("planner share state", () => {
  it("round-trips a target query without local save data", () => {
    const state = {
      view: "target" as const,
      child: "Anubis",
      parent: "SheepBall",
      passiveIds: ["Legend", "Runner"],
    };

    const hash = buildCalculatorShareHash(state);

    expect(hash).toBe(
      "#v=1&view=target&child=Anubis&parent=SheepBall&passive=Legend&passive=Runner",
    );
    expect(parseCalculatorShareHash(hash, validators)).toEqual(state);
    expect(hash).not.toContain("save");
    expect(hash).not.toContain("owned");
  });

  it("round-trips a two-parent query", () => {
    const state = {
      view: "parents" as const,
      parentA: "SheepBall",
      parentB: "Anubis",
    };

    expect(
      parseCalculatorShareHash(buildCalculatorShareHash(state), validators),
    ).toEqual(state);
  });

  it("ignores invalid IDs, duplicates, and passive skills beyond four", () => {
    expect(
      parseCalculatorShareHash(
        "#v=1&view=target&child=Unknown&parent=SheepBall&passive=Legend&passive=Unknown&passive=Legend&passive=Runner&passive=Swift&passive=Workaholic&passive=Lucky",
        validators,
      ),
    ).toEqual({
      view: "target",
      child: null,
      parent: "SheepBall",
      passiveIds: ["Legend", "Runner", "Swift", "Workaholic"],
    });
  });

  it("rejects unknown versions and views", () => {
    expect(
      parseCalculatorShareHash("#v=2&view=target&child=Anubis", validators),
    ).toBeNull();
    expect(
      parseCalculatorShareHash("#v=1&view=results", validators),
    ).toBeNull();
  });
});
