import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const prototypeSource = readFileSync(new URL("../client/src/pages/CasePrototype.tsx", import.meta.url), "utf8");
const prototypeStyles = readFileSync(new URL("../client/src/pages/case-prototype.css", import.meta.url), "utf8");

describe("independent case page prototype", () => {
  it("registers the prototype outside the main ambient shell", () => {
    expect(appSource).toContain('path="/prototype/case-001"');
    expect(appSource).toContain("(lab|target|workspace|prototype|black-trace)");
  });

  it("provides isolated service surfaces and evidence collection without the main console navigation", () => {
    expect(prototypeSource).toContain("Case note");
    expect(prototypeSource).toContain("Audit trail");
    expect(prototypeSource).toContain("Evidence shelf");
    expect(prototypeSource).not.toContain("ConsoleNav");
    expect(prototypeStyles).toContain(".case-prototype__masthead");
    expect(prototypeStyles).toContain("@media(max-width:720px)");
  });
});
