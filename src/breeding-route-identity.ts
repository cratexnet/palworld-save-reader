import type {
  PalworldBreedingRoute,
  PalworldBreedingRouteParent,
  PalworldBreedingRouteRequirement,
  PalworldBreedingStep,
} from "./breeding-routes-api-contract";

type FormulaRoute = Pick<PalworldBreedingRoute, "steps">;

export function createPalworldFormulaRouteSignature(route: FormulaRoute) {
  return JSON.stringify(route.steps.map(canonicalFormulaStep));
}

type ExecutionRoute = Pick<
  PalworldBreedingRoute,
  | "target"
  | "depth"
  | "passiveCoverage"
  | "missingPassives"
  | "implantPassives"
  | "extraPassiveCount"
  | "unavailableParentCount"
  | "acquisitionDifficulty"
  | "steps"
  | "requirements"
  | "complexity"
  | "group"
>;

export function createPalworldRouteExecutionSignature(route: ExecutionRoute) {
  return JSON.stringify({
    formula: route.steps.map(canonicalFormulaStep),
    target: route.target,
    depth: route.depth,
    passiveCoverage: sortedStrings(route.passiveCoverage),
    missingPassives: sortedStrings(route.missingPassives),
    implantPassives: sortedStrings(route.implantPassives ?? []),
    extraPassiveCount: route.extraPassiveCount,
    unavailableParentCount: route.unavailableParentCount,
    acquisitionDifficulty: route.acquisitionDifficulty ?? null,
    group: route.group,
    requirements: route.requirements
      .map((requirement) => canonicalRequirement(requirement, route.steps))
      .sort(compareCanonicalValues),
    complexity: {
      plannedStageCount: route.complexity.plannedStageCount,
      missingParentRequirementCount:
        route.complexity.missingParentRequirementCount,
      unresolvedPassiveCount: route.complexity.unresolvedPassiveCount,
      deterministicItemActionCount:
        route.complexity.deterministicItemActionCount,
      blockerCount: route.complexity.blockerCount,
      acquisitionDifficulty: route.complexity.acquisitionDifficulty ?? null,
    },
  });
}

export function createPalworldRouteChildChainSignature(route: FormulaRoute) {
  return route.steps.map((step) => step.child).join(">");
}

function canonicalFormulaStep(step: PalworldBreedingStep) {
  return {
    child: step.child,
    parents: [
      canonicalFormulaParent(step.parent1),
      canonicalFormulaParent(step.parent2),
    ].sort(compareFormulaParents),
  };
}

function canonicalFormulaParent(parent: PalworldBreedingRouteParent) {
  return {
    species: parent.species,
    requiredGender: parent.requiredGender,
  };
}

function compareFormulaParents(
  left: ReturnType<typeof canonicalFormulaParent>,
  right: ReturnType<typeof canonicalFormulaParent>,
) {
  return (
    left.species.localeCompare(right.species, "en") ||
    left.requiredGender.localeCompare(right.requiredGender, "en")
  );
}

function canonicalRequirement(
  requirement: PalworldBreedingRouteRequirement,
  steps: readonly PalworldBreedingStep[],
) {
  if (requirement.type === "missing_parent") {
    return {
      type: requirement.type,
      species: requirement.species,
      requiredGender: requirement.requiredGender,
      quantity: requirement.quantity,
    };
  }
  if (requirement.type === "missing_passive") {
    return {
      type: requirement.type,
      passiveId: requirement.passiveId,
    };
  }
  if (requirement.target.type === "passive") {
    return {
      type: requirement.type,
      itemId: requirement.itemId,
      quantity: requirement.quantity,
      target: {
        type: requirement.target.type,
        passiveId: requirement.target.passiveId,
      },
    };
  }

  const target = requirement.target;
  const step = steps[target.stepIndex];
  return {
    type: requirement.type,
    itemId: requirement.itemId,
    quantity: requirement.quantity,
    target: {
      type: target.type,
      stepIndex: target.stepIndex,
      parentPosition: step
        ? canonicalParentPosition(step, target.parentPosition)
        : target.parentPosition,
      species: target.species,
      requiredGender: target.requiredGender,
    },
  };
}

function canonicalParentPosition(
  step: PalworldBreedingStep,
  parentPosition: 1 | 2,
): 1 | 2 {
  const parents = [
    { position: 1 as const, value: canonicalFormulaParent(step.parent1) },
    { position: 2 as const, value: canonicalFormulaParent(step.parent2) },
  ].sort(
    (left, right) =>
      compareFormulaParents(left.value, right.value) ||
      left.position - right.position,
  );
  return parents[0]?.position === parentPosition ? 1 : 2;
}

function sortedStrings(values: readonly string[]) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function compareCanonicalValues(left: object, right: object) {
  return JSON.stringify(left).localeCompare(JSON.stringify(right), "en");
}
