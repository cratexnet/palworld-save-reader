import { describe, expect, it } from "vitest";
import {
  getDisplayContainerSlot,
  getPalboxSlotPosition,
} from "./palbox-slot-position";

describe("Palbox slot position", () => {
  it.each([
    ["0", { page: 1, row: 1, column: 1 }],
    ["29", { page: 1, row: 5, column: 6 }],
    ["30", { page: 2, row: 1, column: 1 }],
    ["197", { page: 7, row: 3, column: 6 }],
  ])("maps zero-based slot %s to a page, row, and column", (slot, expected) => {
    expect(getPalboxSlotPosition(slot)).toEqual(expected);
  });

  it.each([
    ["0", "1"],
    ["4", "5"],
    ["197", "198"],
    ["-1", "-1"],
    ["1.5", "1.5"],
    ["slot-1", "slot-1"],
  ])("maps raw container slot %s to display slot %s", (slot, expected) => {
    expect(getDisplayContainerSlot(slot)).toBe(expected);
  });

  it.each(["", "-1", "1.5", "slot-1"])(
    "rejects invalid Palbox slot %j",
    (slot) => {
      expect(getPalboxSlotPosition(slot)).toBeNull();
    },
  );
});
