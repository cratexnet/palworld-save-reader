export interface ResultsSearchDockVisibilityInput {
  anchorBottom: number;
  boundaryTop: number;
  boundaryBottom: number;
  viewportHeight: number;
  desktop: boolean;
}

const DESKTOP_HEADER_CLEARANCE = 56;
const MOBILE_DOCK_CLEARANCE = 72;

export function shouldShowResultsSearchDock({
  anchorBottom,
  boundaryTop,
  boundaryBottom,
  viewportHeight,
  desktop,
}: ResultsSearchDockVisibilityInput): boolean {
  const activationThreshold = desktop ? DESKTOP_HEADER_CLEARANCE : 0;
  const exitClearance = desktop
    ? DESKTOP_HEADER_CLEARANCE
    : MOBILE_DOCK_CLEARANCE;

  return (
    anchorBottom <= activationThreshold &&
    boundaryTop < viewportHeight &&
    boundaryBottom > exitClearance
  );
}
