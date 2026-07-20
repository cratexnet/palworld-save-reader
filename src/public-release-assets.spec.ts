import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_BINARY_EXTENSIONS = new Set([
  ".avif",
  ".bmp",
  ".gif",
  ".heic",
  ".heif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".jxl",
  ".png",
  ".svg",
  ".tif",
  ".tiff",
  ".webp",
]);

const SOURCE_SCAN_IGNORES = new Set([
  ".git",
  ".artifacts",
  ".vitest-attachments",
  "coverage",
  "dist",
  "dist-app",
  "node_modules",
]);

function listFiles(
  directory: string,
  ignoredDirectories: ReadonlySet<string> = new Set(),
): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    return entry.isDirectory() ? listFiles(path, ignoredDirectories) : [path];
  });
}

function listPublicSourceFiles() {
  if (!existsSync(resolve(".git"))) {
    return listFiles(resolve("."), SOURCE_SCAN_IGNORES);
  }
  return execFileSync("git", ["ls-files", "--cached"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
}

describe("public release assets", () => {
  it("does not track game artwork or brand image binaries", () => {
    const trackedBinaryAssets = listPublicSourceFiles().filter((path) =>
      PUBLIC_BINARY_EXTENSIONS.has(extname(path).toLowerCase()),
    );

    expect(trackedBinaryAssets).toEqual([]);
  });

  it("does not redistribute game artwork or brand images", () => {
    const binaryAssets = listFiles(resolve("app/public")).filter((path) =>
      PUBLIC_BINARY_EXTENSIONS.has(extname(path).toLowerCase()),
    );

    expect(binaryAssets).toEqual([]);
  });

  it("loads optional artwork from deployment-provided asset URLs", () => {
    const source = readFileSync(
      resolve("app/src/PalworldBreedingCalculatorPage.tsx"),
      "utf8",
    );

    expect(source).toContain("VITE_PALWORLD_ASSET_BASE_URL");
    expect(source).toContain("palworldAssetBaseHref ? (");
    expect(source).toContain("palworldIconHref");
    expect(source).toContain("`${palworldAssetBaseHref}/items/pal-egg.webp`");
    expect(source).toContain("`${palworldAssetBaseHref}/pals/sheep-ball.webp`");
    expect(source).not.toContain("palworld-icon-files.generated");
    expect(source).not.toContain("palworld-icon-manifest");
    expect(source).toContain('const cratexLogo32Href = "/favicon-32.png";');
    expect(source).toContain('const cratexLogo64Href = "/favicon-64.png";');
  });
});
