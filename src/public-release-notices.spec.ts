import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

describe("public release notices", () => {
  it("documents the reduced decoder and optional deployment assets", () => {
    const readme = read("README.md");

    expect(readme).toContain("`palworld-ooz`");
    expect(readme).toContain("`VITE_PALWORLD_ASSET_BASE_URL`");
    expect(readme).not.toContain("`ooz-wasm` remains");
    expect(readme).not.toContain("NOTICE.txt files beside those assets");
  });

  it("includes the decoder source and legal notices in the package", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      files: string[];
    };
    const notices = read("THIRD_PARTY_NOTICES.md");
    const copyright = read("COPYRIGHT");

    expect(packageJson.files).toContain("vendor/palworld-ooz");
    expect(packageJson.files).toContain("THIRD_PARTY_NOTICES.md");
    expect(packageJson.files).toContain("COPYRIGHT");
    expect(notices).toContain("ebed82851988add824e092dc4db320c8fa39aaca");
    expect(notices).toContain("431b217b0f78bbef400baaa3aea20c8e99e9444c");
    expect(copyright).toContain("Copyright (C) 2026");
  });

  it("states that the public repository does not include game artwork", () => {
    const notice = read("BRAND_AND_ASSET_NOTICE.md");

    expect(notice).toContain(
      "This repository does not include Palworld artwork, Pal icons, or game UI textures.",
    );
    expect(notice).toContain("CrateX.app");
  });
});
