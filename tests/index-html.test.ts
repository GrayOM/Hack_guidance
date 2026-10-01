import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
const mainSource = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");
const learningApi = readFileSync(new URL("../client/src/hooks/useLearningApi.ts", import.meta.url), "utf8");
const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

describe("client HTML entrypoint", () => {
  it("mounts the React application exactly once", () => {
    expect((indexHtml.match(/id="root"/g) ?? [])).toHaveLength(1);
    expect((indexHtml.match(/src="\/src\/main\.tsx"/g) ?? [])).toHaveLength(1);
    expect((indexHtml.match(/<!doctype html>/gi) ?? [])).toHaveLength(1);
    expect(indexHtml).toContain('<meta name="author" content="GrayOM" />');
  });

  it("talks to the learning function directly, with no tRPC transport left", () => {
    // Every tRPC branch was unreachable in production, yet it shipped in the bundle and kept
    // the client depending on the Express router's types.
    for (const source of [mainSource, learningApi]) {
      expect(source).not.toContain("trpc");
      expect(source).not.toContain("@trpc");
    }
    expect(learningApi).toContain("invokeLearning");
    expect(learningApi).not.toContain("isExternalSupabaseDeployment");
    expect(packageJson).not.toContain("@trpc/");
    expect(packageJson).not.toContain('"express"');
    expect(packageJson).not.toContain("drizzle");
  });

  it("serves no platform scaffolding from the published directory", () => {
    // A 25KB debug collector was published with the site and never referenced by it.
    expect(existsSync(new URL("../client/public/__manus__", import.meta.url))).toBe(false);
    expect(viteConfig).not.toContain("manus");
    expect(packageJson).not.toContain("manus");
  });
});
