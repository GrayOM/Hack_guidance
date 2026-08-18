import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const motionSource = readFileSync(new URL("../client/src/components/ConsoleMotion.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("console pointer motion", () => {
  it("mounts a non-interactive motion layer from the application shell", () => {
    expect(appSource).toContain('import { ConsoleMotion } from "./components/ConsoleMotion"');
    expect(appSource).toContain("<ConsoleMotion />");
    expect(motionSource).toContain('aria-hidden="true"');
    expect(styles).toContain("pointer-events: none;");
  });

  it("uses fine-pointer interaction and disables motion for reduced-motion or coarse-pointer users", () => {
    expect(motionSource).toContain('(hover: hover) and (pointer: fine)');
    expect(motionSource).toContain('(prefers-reduced-motion: reduce)');
    expect(styles).toContain('@media (max-width: 639px), (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)');
    expect(styles).toContain('.console-motion { display: none; }');
    expect(styles).toContain('hnet-panel-scan');
  });
});
