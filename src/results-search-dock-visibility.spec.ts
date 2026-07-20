import { describe, expect, it } from "vitest";
import { shouldShowResultsSearchDock } from "../app/src/results-search-dock-visibility";

describe("results search dock visibility", () => {
  it("shows on desktop after the source search passes the floating header", () => {
    expect(
      shouldShowResultsSearchDock({
        anchorBottom: 52,
        boundaryTop: -120,
        boundaryBottom: 900,
        viewportHeight: 768,
        desktop: true,
      }),
    ).toBe(true);
  });

  it("stays hidden while the source search remains visible", () => {
    expect(
      shouldShowResultsSearchDock({
        anchorBottom: 180,
        boundaryTop: 80,
        boundaryBottom: 900,
        viewportHeight: 768,
        desktop: true,
      }),
    ).toBe(false);
  });

  it("uses the viewport edge as the mobile activation threshold", () => {
    expect(
      shouldShowResultsSearchDock({
        anchorBottom: 1,
        boundaryTop: -120,
        boundaryBottom: 700,
        viewportHeight: 844,
        desktop: false,
      }),
    ).toBe(false);
    expect(
      shouldShowResultsSearchDock({
        anchorBottom: 0,
        boundaryTop: -120,
        boundaryBottom: 700,
        viewportHeight: 844,
        desktop: false,
      }),
    ).toBe(true);
  });

  it("hides after the result boundary reaches the dock clearance", () => {
    expect(
      shouldShowResultsSearchDock({
        anchorBottom: -200,
        boundaryTop: -600,
        boundaryBottom: 72,
        viewportHeight: 844,
        desktop: false,
      }),
    ).toBe(false);
  });
});
