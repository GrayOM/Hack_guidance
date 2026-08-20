import { describe, expect, it } from "vitest";
import { practiceTrackForNode } from "../client/src/lib/practice-workspace";

describe("practice workspace mapping", () => {
  it("assigns every public node to one safe local practice workspace", () => {
    const mapped = Array.from({ length: 50 }, (_, index) => practiceTrackForNode(index + 1));
    expect(mapped.every(Boolean)).toBe(true);
    expect(new Set(mapped)).toEqual(new Set(["surface", "request", "input", "access", "report"]));
  });

  it("keeps the five ten-node workspace ranges stable", () => {
    expect(practiceTrackForNode(1)).toBe("surface");
    expect(practiceTrackForNode(10)).toBe("surface");
    expect(practiceTrackForNode(11)).toBe("request");
    expect(practiceTrackForNode(20)).toBe("request");
    expect(practiceTrackForNode(21)).toBe("input");
    expect(practiceTrackForNode(30)).toBe("input");
    expect(practiceTrackForNode(31)).toBe("access");
    expect(practiceTrackForNode(40)).toBe("access");
    expect(practiceTrackForNode(41)).toBe("report");
    expect(practiceTrackForNode(50)).toBe("report");
    expect(practiceTrackForNode(0)).toBeNull();
    expect(practiceTrackForNode(51)).toBeNull();
  });
});
