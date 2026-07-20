import type { PalworldBreedingRoute } from "./breeding-routes-api-contract";

export interface PalworldBreedingRouteSummary {
  blockerCount: number;
  coveredPassiveCount: number;
  deterministicItemActionCount: number;
  extraPassiveCount: number;
  group: PalworldBreedingRoute["group"];
  isComplete: boolean;
  isExecutable: boolean;
  implantPassiveCount: number;
  missingParentRequirementCount: number;
  missingPassiveCount: number;
  sourceCount: number;
  stepCount: number;
  unavailableParentCount: number;
  unresolvedPassiveCount: number;
}

export function summarizePalworldBreedingRoute(
  route: PalworldBreedingRoute,
): PalworldBreedingRouteSummary {
  const implantPassiveCount = route.requirements.filter(
    (requirement) =>
      requirement.type === "use_item" &&
      requirement.itemId === "passive_implant",
  ).length;
  const missingPassiveCount = route.requirements.filter(
    (requirement) =>
      requirement.type === "missing_passive" ||
      (requirement.type === "use_item" &&
        requirement.itemId === "passive_implant"),
  ).length;
  const isReadyGroup =
    route.group === "parents_owned" || route.group === "formula";

  return {
    blockerCount: route.complexity.blockerCount,
    coveredPassiveCount: route.passiveCoverage.length,
    deterministicItemActionCount: route.complexity.deterministicItemActionCount,
    extraPassiveCount: Math.max(0, route.extraPassiveCount),
    group: route.group,
    isComplete: isReadyGroup,
    isExecutable: isReadyGroup,
    implantPassiveCount,
    missingParentRequirementCount:
      route.complexity.missingParentRequirementCount,
    missingPassiveCount,
    sourceCount: route.sources.length,
    stepCount: route.complexity.plannedStageCount,
    unavailableParentCount: route.complexity.missingParentRequirementCount,
    unresolvedPassiveCount: route.complexity.unresolvedPassiveCount,
  };
}

export function comparePalworldBreedingRoutes(
  left: PalworldBreedingRoute,
  right: PalworldBreedingRoute,
): number {
  const leftSummary = summarizePalworldBreedingRoute(left);
  const rightSummary = summarizePalworldBreedingRoute(right);
  const leftAcquisition = left.complexity.acquisitionDifficulty;
  const rightAcquisition = right.complexity.acquisitionDifficulty;

  return (
    compareAscending(groupRank(left.group), groupRank(right.group)) ||
    compareAscending(leftSummary.blockerCount, rightSummary.blockerCount) ||
    compareAscending(
      leftSummary.unavailableParentCount,
      rightSummary.unavailableParentCount,
    ) ||
    compareAscending(
      passiveCompletionRank(leftSummary),
      passiveCompletionRank(rightSummary),
    ) ||
    compareAscending(
      leftSummary.unresolvedPassiveCount,
      rightSummary.unresolvedPassiveCount,
    ) ||
    compareAscending(
      leftSummary.missingPassiveCount,
      rightSummary.missingPassiveCount,
    ) ||
    compareAscending(leftSummary.stepCount, rightSummary.stepCount) ||
    compareAscending(
      leftAcquisition?.specialParentCount ?? 0,
      rightAcquisition?.specialParentCount ?? 0,
    ) ||
    compareAscending(
      leftAcquisition?.highestMinimumWildLevel ?? 0,
      rightAcquisition?.highestMinimumWildLevel ?? 0,
    ) ||
    compareAscending(
      leftAcquisition?.totalMinimumWildLevel ?? 0,
      rightAcquisition?.totalMinimumWildLevel ?? 0,
    ) ||
    compareAscending(
      leftAcquisition?.totalRarity ?? 0,
      rightAcquisition?.totalRarity ?? 0,
    ) ||
    compareAscending(
      leftSummary.extraPassiveCount,
      rightSummary.extraPassiveCount,
    ) ||
    compareAscending(leftSummary.sourceCount, rightSummary.sourceCount) ||
    compareDescending(
      leftSummary.coveredPassiveCount,
      rightSummary.coveredPassiveCount,
    )
  );
}

function passiveCompletionRank(summary: PalworldBreedingRouteSummary) {
  if (summary.isComplete) return 0;
  if (summary.unresolvedPassiveCount === 0) return 1;
  return 2;
}

function groupRank(group: PalworldBreedingRoute["group"]) {
  if (group === "formula" || group === "parents_owned") return 0;
  if (group === "needs_supplement") return 1;
  return 2;
}

function compareAscending(left: number, right: number) {
  return left - right;
}

function compareDescending(left: number, right: number) {
  return right - left;
}
