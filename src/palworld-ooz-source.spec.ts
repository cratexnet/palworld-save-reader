import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

describe("Palworld Oodle decoder source", () => {
  it("uses the repository-owned decoder instead of the published ooz-wasm package", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
    };
    const loaderSource = read("src/ooz-wasm-decoder.ts");

    expect(packageJson.dependencies).not.toHaveProperty("palworld-ooz");
    expect(packageJson.dependencies).not.toHaveProperty("ooz-wasm");
    expect(loaderSource).toContain('import("../vendor/palworld-ooz/index.js")');
  });

  it("ships the preferred source needed to rebuild the decoder", () => {
    const cmake = read("vendor/palworld-ooz/CMakeLists.txt");
    const decoderSource = read("vendor/palworld-ooz/lib/kraken.cpp");

    expect(cmake).toContain("lib/kraken.cpp");
    expect(cmake).not.toContain("lib/bitknit.cpp");
    expect(cmake).not.toContain("lib/lzna.cpp");
    expect(decoderSource).toContain("Copyright (C) 2016, Powzix");
    expect(decoderSource).not.toContain("LZNA_DecodeQuantum");
    expect(decoderSource).not.toContain("Bitknit_Decode");
  });
});
