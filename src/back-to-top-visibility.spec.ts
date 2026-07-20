import { describe, expect, it } from "vitest";
import { shouldShowBackToTopButton } from "../app/src/back-to-top-visibility";

describe("back to top visibility", () => {
  it("stays hidden before the user scrolls one viewport", () => {
    expect(
      shouldShowBackToTopButton({ scrollY: 843, viewportHeight: 844 }),
    ).toBe(false);
  });

  it("shows after the user scrolls one viewport", () => {
    expect(
      shouldShowBackToTopButton({ scrollY: 844, viewportHeight: 844 }),
    ).toBe(true);
    expect(
      shouldShowBackToTopButton({ scrollY: 1688, viewportHeight: 844 }),
    ).toBe(true);
  });
});
