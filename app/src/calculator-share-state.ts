const CALCULATOR_SHARE_STATE_VERSION = "1";
const MAX_SHARED_PASSIVE_IDS = 4;

export type CalculatorShareState =
  | {
      view: "target";
      child: string | null;
      parent: string | null;
      passiveIds: string[];
    }
  | {
      view: "parents";
      parentA: string | null;
      parentB: string | null;
    };

export interface CalculatorShareStateValidators {
  isPalId: (value: string) => boolean;
  isPassiveId: (value: string) => boolean;
}

export function parseCalculatorShareHash(
  hash: string,
  validators: CalculatorShareStateValidators,
): CalculatorShareState | null {
  const params = new URLSearchParams(hash.replace(/^#/u, ""));
  if (params.get("v") !== CALCULATOR_SHARE_STATE_VERSION) return null;

  const view = params.get("view");
  if (view === "parents") {
    return {
      view,
      parentA: readValidValue(params, "a", validators.isPalId),
      parentB: readValidValue(params, "b", validators.isPalId),
    };
  }
  if (view !== "target") return null;

  const passiveIds: string[] = [];
  for (const passiveId of params.getAll("passive")) {
    if (
      passiveIds.length >= MAX_SHARED_PASSIVE_IDS ||
      passiveIds.includes(passiveId) ||
      !validators.isPassiveId(passiveId)
    ) {
      continue;
    }
    passiveIds.push(passiveId);
  }

  return {
    view,
    child: readValidValue(params, "child", validators.isPalId),
    parent: readValidValue(params, "parent", validators.isPalId),
    passiveIds,
  };
}

export function buildCalculatorShareHash(state: CalculatorShareState) {
  const params = new URLSearchParams({
    v: CALCULATOR_SHARE_STATE_VERSION,
    view: state.view,
  });

  if (state.view === "parents") {
    appendValue(params, "a", state.parentA);
    appendValue(params, "b", state.parentB);
  } else {
    appendValue(params, "child", state.child);
    appendValue(params, "parent", state.parent);
    for (const passiveId of state.passiveIds.slice(0, MAX_SHARED_PASSIVE_IDS)) {
      appendValue(params, "passive", passiveId);
    }
  }

  return `#${params.toString()}`;
}

function readValidValue(
  params: URLSearchParams,
  key: string,
  isValid: (value: string) => boolean,
) {
  const value = params.get(key);
  return value && isValid(value) ? value : null;
}

function appendValue(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value) params.append(key, value);
}
