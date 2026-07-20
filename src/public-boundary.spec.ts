import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { describe, expect, it } from "vitest";

const PACKAGE_SRC_DIR = join(process.cwd(), "src");
const PUBLIC_ENTRYPOINT = join(PACKAGE_SRC_DIR, "public-client.ts");
const FORBIDDEN_PUBLIC_MODULES = new Set([
  "core.ts",
  "planner-contract.ts",
  "planner-upload-contract.ts",
  "private-planner.ts",
  "palworld-v1-breeding.ts",
]);

describe("palworld public client boundary", () => {
  it("keeps the public client off private planner and core modules", () => {
    const visited = new Set<string>();
    const violations: { file: string; specifier: string; resolved: string }[] =
      [];

    visitPublicModule(PUBLIC_ENTRYPOINT, visited, violations);

    expect(violations).toEqual([]);
  });

  it("exports the 1.0 catalog instead of the legacy PalCalc snapshot", () => {
    const source = readFileSync(PUBLIC_ENTRYPOINT, "utf8");

    expect(source).toContain('from "./data/palworld-v1-catalog"');
    expect(source).not.toContain("palcalc-v22");
  });
});

function visitPublicModule(
  filePath: string,
  visited: Set<string>,
  violations: { file: string; specifier: string; resolved: string }[],
) {
  const normalizedPath = normalize(filePath);
  if (visited.has(normalizedPath)) return;
  visited.add(normalizedPath);

  const source = readFileSync(normalizedPath, "utf8");
  for (const specifier of findRelativeModuleSpecifiers(source)) {
    const resolved = resolveTypeScriptModule(normalizedPath, specifier);
    if (!resolved) continue;

    const moduleName = resolved.slice(resolved.lastIndexOf("/") + 1);
    if (FORBIDDEN_PUBLIC_MODULES.has(moduleName)) {
      violations.push({
        file: relative(process.cwd(), normalizedPath),
        specifier,
        resolved: relative(process.cwd(), resolved),
      });
      continue;
    }

    visitPublicModule(resolved, visited, violations);
  }
}

function findRelativeModuleSpecifiers(source: string) {
  return [...source.matchAll(/\bfrom\s+["'](\.{1,2}\/[^"']+)["']/gu)].map(
    (match) => match[1],
  );
}

function resolveTypeScriptModule(importerPath: string, specifier: string) {
  const basePath = join(dirname(importerPath), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    join(basePath, "index.ts"),
    join(basePath, "index.tsx"),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}
