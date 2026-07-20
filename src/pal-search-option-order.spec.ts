import { describe, expect, it } from "vitest";
import { comparePalSearchOptions } from "./pal-search-option-order";

describe("Pal search option order", () => {
  it("lists numbered Pals by Paldeck number and code before unnumbered units", () => {
    const options = [
      {
        value: "terraria-eye",
        label: "Eye of Cthulhu",
        paldeckNumber: null,
        paldeckCode: "",
      },
      {
        value: "pal-120b",
        label: "Alpha variant",
        paldeckNumber: 120,
        paldeckCode: "120B",
      },
      {
        value: "pal-120",
        label: "Zulu base Pal",
        paldeckNumber: 120,
        paldeckCode: "120",
      },
      {
        value: "terraria-bat",
        label: "Cave Bat",
        paldeckNumber: null,
        paldeckCode: "",
      },
      {
        value: "pal-1",
        label: "First Pal",
        paldeckNumber: 1,
        paldeckCode: "001",
      },
    ];

    const values = options
      .sort((left, right) => comparePalSearchOptions(left, right, "en"))
      .map((option) => option.value);

    expect(values).toEqual([
      "pal-1",
      "pal-120",
      "pal-120b",
      "terraria-bat",
      "terraria-eye",
    ]);
  });

  it("uses the internal value when localized names are identical", () => {
    const options = [
      { value: "unit-b", label: "Slime", paldeckNumber: null },
      { value: "unit-a", label: "Slime", paldeckNumber: null },
    ];

    expect(
      options
        .sort((left, right) => comparePalSearchOptions(left, right, "en"))
        .map((option) => option.value),
    ).toEqual(["unit-a", "unit-b"]);
  });
});
