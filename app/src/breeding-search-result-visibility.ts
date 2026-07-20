export interface BreedingSearchResultMeta {
  searchComplete: boolean;
  returnedRouteCount: number;
  excludedByPolicyCount: number;
}

export interface BreedingSearchResultVisibility {
  truncationNotice: "empty" | "with_routes" | null;
  showDefinitiveNoRoutes: boolean;
  showExcludedRouteCount: boolean;
}

export function resolveBreedingSearchResultVisibility(
  searchMeta: BreedingSearchResultMeta,
): BreedingSearchResultVisibility {
  if (!searchMeta.searchComplete) {
    return {
      truncationNotice:
        searchMeta.returnedRouteCount === 0 ? "empty" : "with_routes",
      showDefinitiveNoRoutes: false,
      showExcludedRouteCount: false,
    };
  }

  const hasReturnedRoutes = searchMeta.returnedRouteCount > 0;
  return {
    truncationNotice: null,
    showDefinitiveNoRoutes: !hasReturnedRoutes,
    showExcludedRouteCount:
      hasReturnedRoutes && searchMeta.excludedByPolicyCount > 0,
  };
}
