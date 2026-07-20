import { describe, expect, it } from "vitest";

import { resolveBreedingSearchResultVisibility } from "../app/src/breeding-search-result-visibility";

describe("breeding search result visibility", () => {
  it.each([
    {
      name: "incomplete search without routes",
      searchMeta: {
        searchComplete: false,
        returnedRouteCount: 0,
        excludedByPolicyCount: 209,
      },
      expected: {
        truncationNotice: "empty",
        showDefinitiveNoRoutes: false,
        showExcludedRouteCount: false,
      },
    },
    {
      name: "incomplete search with routes",
      searchMeta: {
        searchComplete: false,
        returnedRouteCount: 5,
        excludedByPolicyCount: 209,
      },
      expected: {
        truncationNotice: "with_routes",
        showDefinitiveNoRoutes: false,
        showExcludedRouteCount: false,
      },
    },
    {
      name: "complete search without routes",
      searchMeta: {
        searchComplete: true,
        returnedRouteCount: 0,
        excludedByPolicyCount: 209,
      },
      expected: {
        truncationNotice: null,
        showDefinitiveNoRoutes: true,
        showExcludedRouteCount: false,
      },
    },
    {
      name: "complete search with excluded formulas",
      searchMeta: {
        searchComplete: true,
        returnedRouteCount: 5,
        excludedByPolicyCount: 209,
      },
      expected: {
        truncationNotice: null,
        showDefinitiveNoRoutes: false,
        showExcludedRouteCount: true,
      },
    },
    {
      name: "complete search without excluded formulas",
      searchMeta: {
        searchComplete: true,
        returnedRouteCount: 5,
        excludedByPolicyCount: 0,
      },
      expected: {
        truncationNotice: null,
        showDefinitiveNoRoutes: false,
        showExcludedRouteCount: false,
      },
    },
  ])("resolves $name", ({ searchMeta, expected }) => {
    expect(resolveBreedingSearchResultVisibility(searchMeta)).toEqual(expected);
  });
});
