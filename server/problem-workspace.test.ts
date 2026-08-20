import { describe, expect, it } from "vitest";
import { practiceGuideForNode } from "../client/src/lib/problem-brief";

describe("problem workspace brief", () => {
  it("gives every public node a concrete action, observable result, and practice input", () => {
    const guides = Array.from({ length: 50 }, (_, index) => practiceGuideForNode(index + 1));
    expect(guides.every(guide => Boolean(guide?.action && guide.successCondition && guide.practiceInput))).toBe(true);
  });

  it("uses a different explicit task across each ten-node workspace type", () => {
    expect(practiceGuideForNode(1)?.practiceInput).toBe("role=admin");
    expect(practiceGuideForNode(11)?.practiceInput).toBe("topic=session");
    expect(practiceGuideForNode(21)?.practiceInput).toBe("<sample>");
    expect(practiceGuideForNode(31)?.practiceInput).toBe("104");
    expect(practiceGuideForNode(41)?.practiceInput).toBe("fact: response header");
    expect(practiceGuideForNode(51)).toBeNull();
  });
});
