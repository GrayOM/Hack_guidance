import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { practiceGuideForNode } from "../client/src/lib/problem-brief";

const shaRuleMigration = readFileSync(new URL("../supabase/migrations/20260820000008_reseed_wargame_rule_hashes.sql", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");

describe("wargame problem briefs", () => {
  it("gives every public node a unique case marker, mission, and success condition without an answer input", () => {
    const guides = Array.from({ length: 50 }, (_, index) => practiceGuideForNode(index + 1));
    expect(guides.every(guide => Boolean(guide?.marker && guide.mission && guide.successCondition && guide.operation))).toBe(true);
    expect(new Set(guides.map(guide => guide?.marker)).size).toBe(50);
    expect(JSON.stringify(guides)).not.toContain("role=admin");
    expect(JSON.stringify(guides)).not.toContain("practiceInput");
  });

  it("keeps each public node inside the safe wargame operation vocabulary", () => {
    const operations = Array.from({ length: 50 }, (_, index) => practiceGuideForNode(index + 1)?.operation);
    expect(new Set(operations)).toEqual(new Set(["inspect", "replay", "trace", "probe", "report"]));
    expect(practiceGuideForNode(51)).toBeNull();
  });

  it("keeps fifty unique server-side rule signatures and requires a manual flag submission", () => {
    const signatures = Array.from(shaRuleMigration.matchAll(/\(\d+, '([a-f0-9]{64})'\)/g), match => match[1]);
    expect(signatures).toHaveLength(50);
    expect(new Set(signatures).size).toBe(50);
    expect(shaRuleMigration).not.toContain("role=admin");
    expect(workspaceSource).not.toContain("setFlag(captured)");
    expect(workspaceSource).toContain("직접 제출해 해결을 기록하세요");
  });
});
