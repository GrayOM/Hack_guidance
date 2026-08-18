import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("client HTML entrypoint", () => {
  it("mounts the React application exactly once", () => {
    expect((indexHtml.match(/id="root"/g) ?? [])).toHaveLength(1);
    expect((indexHtml.match(/src="\/src\/main\.tsx"/g) ?? [])).toHaveLength(1);
    expect((indexHtml.match(/<!doctype html>/gi) ?? [])).toHaveLength(1);
  });
});
