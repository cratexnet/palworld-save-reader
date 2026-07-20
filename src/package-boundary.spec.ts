import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("package boundary", () => {
  it("ships every source file required to build the public app", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve("package.json"), "utf8"),
    ) as { files: string[]; scripts: Record<string, string> };
    const buildConfig = JSON.parse(
      readFileSync(resolve("tsconfig.build.json"), "utf8"),
    ) as { exclude: string[] };

    expect(packageJson.files).toEqual(
      expect.arrayContaining([
        "!app/passive-skill-prototype.html",
        "!src/data/palworld-v1-catalog.spec.ts",
        "!src/public-boundary.spec.ts",
        "scripts/clean-build-output.mjs",
        "scripts/fix-dist-imports.mjs",
        "scripts/smoke-real-save.mjs",
        "tsconfig.json",
        "tsconfig.app.json",
        "tsconfig.build.json",
        "vitest.config.ts",
      ]),
    );
    expect(buildConfig.exclude).toEqual(["src/**/*.spec.ts"]);
    expect(
      packageJson.files.some((entry) => entry.includes("palcalc-v22")),
    ).toBe(false);
    expect(packageJson.scripts.build).toContain(
      "node scripts/clean-build-output.mjs",
    );
  });

  it("fixes extensionless imports in JavaScript and Node ESM declarations", () => {
    const fixtureRoot = mkdtempSync(
      join(tmpdir(), "palworld-save-reader-dist-imports-"),
    );
    const scriptsDir = join(fixtureRoot, "scripts");
    const distDir = join(fixtureRoot, "dist");

    try {
      mkdirSync(scriptsDir);
      mkdirSync(distDir);
      copyFileSync(
        resolve("scripts/fix-dist-imports.mjs"),
        join(scriptsDir, "fix-dist-imports.mjs"),
      );
      writeFileSync(
        join(distDir, "index.js"),
        [
          'export { runtime } from "./runtime";',
          'export { config } from "./config.json";',
          'export { existing } from "./existing.js";',
          "",
        ].join("\n"),
      );
      writeFileSync(
        join(distDir, "index.d.ts"),
        [
          'export type { Model } from "./model";',
          'export { shared } from "./shared";',
          'export type { Existing } from "./existing.js";',
          "",
        ].join("\n"),
      );
      writeFileSync(
        join(distDir, "preservation.d.ts"),
        'export type { Config } from "./config.json";\n',
      );
      writeFileSync(
        join(distDir, "model.d.ts"),
        "export interface Model { value: string }\n",
      );
      writeFileSync(
        join(distDir, "shared.d.ts"),
        "export declare const shared: string;\n",
      );
      writeFileSync(
        join(distDir, "existing.d.ts"),
        "export interface Existing { id: number }\n",
      );
      writeFileSync(
        join(fixtureRoot, "consumer.ts"),
        [
          'import { shared } from "./dist/index.js";',
          'import type { Existing, Model } from "./dist/index.js";',
          "export const model: Model = { value: shared };",
          "export const existing: Existing = { id: 1 };",
          "",
        ].join("\n"),
      );
      writeFileSync(
        join(fixtureRoot, "package.json"),
        JSON.stringify({ type: "module" }),
      );
      writeFileSync(
        join(fixtureRoot, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            noEmit: true,
            strict: true,
            types: [],
          },
          files: ["consumer.ts"],
        }),
      );

      execFileSync(process.execPath, [
        join(scriptsDir, "fix-dist-imports.mjs"),
      ]);

      expect(readFileSync(join(distDir, "index.js"), "utf8")).toBe(
        [
          'export { runtime } from "./runtime.js";',
          'export { config } from "./config.json";',
          'export { existing } from "./existing.js";',
          "",
        ].join("\n"),
      );
      expect(readFileSync(join(distDir, "index.d.ts"), "utf8")).toBe(
        [
          'export type { Model } from "./model.js";',
          'export { shared } from "./shared.js";',
          'export type { Existing } from "./existing.js";',
          "",
        ].join("\n"),
      );
      expect(readFileSync(join(distDir, "preservation.d.ts"), "utf8")).toBe(
        'export type { Config } from "./config.json";\n',
      );

      for (const nodeModuleKind of ["Node16", "NodeNext"]) {
        execFileSync(
          process.execPath,
          [
            resolve("node_modules/typescript/bin/tsc"),
            "--project",
            join(fixtureRoot, "tsconfig.json"),
            "--module",
            nodeModuleKind,
            "--moduleResolution",
            nodeModuleKind,
          ],
          { cwd: fixtureRoot },
        );
      }
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("keeps legacy formula data and client-side lookups out of the public source", () => {
    const removedSources = [
      "src/data/palcalc-v22.ts",
      "src/data/palcalc-v22.spec.ts",
      "src/data/palcalc-v22.LICENSE.txt",
      "src/data/palworld-v1-breeding.ts",
      "src/parent-breeding-lookup.ts",
      "src/parent-breeding-lookup.spec.ts",
    ];

    for (const source of removedSources) {
      expect(existsSync(resolve(source))).toBe(false);
    }
  });

  it("keeps only the English UI catalog in the public repository", () => {
    expect(readdirSync(resolve("app/src/locales")).sort()).toEqual(["en.json"]);
  });

  it("keeps translated game names out of the public catalog", () => {
    const source = readFileSync(
      resolve("src/data/palworld-v1-catalog.ts"),
      "utf8",
    );

    expect(source).not.toContain("localizedNames");
    expect(source).not.toContain("localizedDescriptions");
  });

  it("keeps the real-save smoke script aligned with the compact upload contract", () => {
    const source = readFileSync(resolve("scripts/smoke-real-save.mjs"), "utf8");

    expect(source).toContain("encodeOwnedPalsPayloadUpload(prepared)");
    expect(source).toContain("prepared.pals.some(");
    expect(source).not.toContain("prepared.payloadResult");
    expect(source).not.toContain("prepared.header");
  });

  it("documents the public encoder and hosted breeding shards accurately", () => {
    const readme = readFileSync(resolve("README.md"), "utf8");

    expect(readme).toContain("encodeOwnedPalsPayloadUpload,");
    expect(readme).toContain(
      "const encoded = encodeOwnedPalsPayloadUpload(prepared);",
    );
    expect(readme).toContain("const uploadBody = encoded.body;");
    expect(readme).not.toContain("fileName: file.name");
    expect(readme).toContain(
      "https://cratex.app/games/palworld/breeding/data/v2",
    );
    expect(readme).toContain(
      'VITE_PALWORLD_ASSET_BASE_URL="/games/palworld/breeding/assets"',
    );
    expect(readme).toContain(
      'VITE_PALWORLD_LANGUAGE_PACK_BASE_URL="/games/palworld/breeding/language-packs/v1"',
    );
    expect(readme).toContain(
      'VITE_PALWORLD_BREEDING_DATA_BASE_URL="/games/palworld/breeding/data/v2"',
    );
    expect(readme).toContain("`/games/palworld/breeding/app/`");
    expect(readme).not.toContain(
      "The complete direct breeding formula dataset",
    );
  });
});
