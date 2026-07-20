import { describe, expect, it } from "vitest";
import {
  matchesResultsSearch,
  normalizePaldeckSearchCode,
  type ResultsSearchEntry,
} from "../app/src/results-search";

const entry: ResultsSearchEntry = {
  text: ["Sparkit", "Swordmaster", "PassiveSkill_2"],
  paldeckCodes: ["002", "92"],
};

describe("results search", () => {
  it("normalizes supported Paldeck query formats", () => {
    expect(normalizePaldeckSearchCode("2")).toBe("2");
    expect(normalizePaldeckSearchCode("02")).toBe("2");
    expect(normalizePaldeckSearchCode("No.2")).toBe("2");
    expect(normalizePaldeckSearchCode("no 002")).toBe("2");
    expect(normalizePaldeckSearchCode("12B")).toBe("12b");
  });

  it("matches numeric queries against exact visible Paldeck codes only", () => {
    expect(matchesResultsSearch(entry, "2")).toBe(true);
    expect(matchesResultsSearch(entry, "No.2")).toBe(true);
    expect(matchesResultsSearch(entry, "20")).toBe(false);
  });

  it("does not match numeric queries against text containing hidden digits", () => {
    expect(
      matchesResultsSearch(
        {
          text: ["PassiveSkill_2"],
          paldeckCodes: [],
        },
        "2",
      ),
    ).toBe(false);
  });

  it("matches localized visible labels by normalized substring", () => {
    expect(matchesResultsSearch(entry, " spark ")).toBe(true);
    expect(matchesResultsSearch(entry, "master")).toBe(true);
    expect(matchesResultsSearch(entry, "missing")).toBe(false);
  });

  it("keeps every result when the query is blank", () => {
    expect(matchesResultsSearch(entry, "   ")).toBe(true);
  });
});
