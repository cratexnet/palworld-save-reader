import { describe, expect, it } from "vitest";
import { getVirtualListRange } from "../app/src/virtual-list";

describe("getVirtualListRange", () => {
  it("renders the visible rows plus overscan", () => {
    expect(
      getVirtualListRange({
        itemCount: 288,
        itemHeight: 56,
        scrollTop: 560,
        viewportHeight: 320,
        overscan: 3,
      }),
    ).toEqual({
      startIndex: 7,
      endIndex: 19,
      paddingTop: 392,
      paddingBottom: 15064,
    });
  });

  it("clamps empty and end-of-list ranges", () => {
    expect(
      getVirtualListRange({
        itemCount: 0,
        itemHeight: 56,
        scrollTop: 100,
        viewportHeight: 320,
      }),
    ).toEqual({
      startIndex: 0,
      endIndex: 0,
      paddingTop: 0,
      paddingBottom: 0,
    });

    expect(
      getVirtualListRange({
        itemCount: 10,
        itemHeight: 56,
        scrollTop: 9999,
        viewportHeight: 320,
        overscan: 2,
      }),
    ).toEqual({
      startIndex: 8,
      endIndex: 10,
      paddingTop: 448,
      paddingBottom: 0,
    });
  });
});
