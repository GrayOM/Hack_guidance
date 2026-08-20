import { describe, expect, it } from "vitest";
import { webTargetForNode, webTargetVisualForNode, webTargets } from "../client/src/lib/web-targets";

describe("isolated web wargame targets", () => {
  it("provides one independently addressed training service for every public node", () => {
    expect(webTargets).toHaveLength(50);
    expect(new Set(webTargets.map(target => target.id)).size).toBe(50);
    expect(new Set(webTargets.map(target => target.origin)).size).toBe(50);
    expect(webTargets.every(target => target.route.startsWith("/") && target.tiles.length === 3)).toBe(true);
  });

  it("keeps all target types reachable and rejects invalid nodes", () => {
    expect(new Set(webTargets.map(target => target.kind))).toEqual(new Set(["identity", "files", "directory", "forms", "api", "report", "upload", "content"]));
    expect(webTargetForNode(1)?.appName).toBe("Northstar Identity");
    expect(webTargetForNode(50)?.appName).toBe("Boundary Planner");
    expect(webTargetForNode(51)).toBeNull();
  });

  it("assigns every target a unique visual fingerprint across palettes and layout families", () => {
    const visuals = webTargets.map(target => webTargetVisualForNode(target.id));
    expect(visuals.every(Boolean)).toBe(true);
    expect(new Set(visuals.map(visual => visual?.signature)).size).toBe(50);
    expect(new Set(visuals.map(visual => visual?.hue)).size).toBe(50);
    expect(new Set(visuals.map(visual => visual?.layout)).size).toBe(10);
    expect(new Set(visuals.map(visual => `${visual?.layout}-${visual?.type}-${visual?.density}-${visual?.navigation}`)).size).toBeGreaterThan(10);
    expect(webTargetVisualForNode(51)).toBeNull();
  });
});
