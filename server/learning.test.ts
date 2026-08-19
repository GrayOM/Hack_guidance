import { describe, expect, it } from "vitest";
import { createCertificateCode, evaluateFlagSubmission, getCourseEligibility, getExpectedFlag, sortPublicRanking } from "./learning";
import { learningChallenges } from "../shared/learning";

describe("flag validation", () => {
  it("uses the server flag map and rejects an incorrect flag", () => {
    expect(evaluateFlagSubmission(1, getExpectedFlag(1)!)).toEqual({ supported: true, correct: true });
    expect(getExpectedFlag(1)).toMatch(/^HG\{(?:TEST_NODE_01|N01_[A-Za-z0-9_-]{24})\}$/);
    expect(evaluateFlagSubmission(1, "HG{BROWSER_ONLY}")).toEqual({ supported: true, correct: false });
    expect(evaluateFlagSubmission(1, getExpectedFlag(1)!.toUpperCase())).toEqual({ supported: true, correct: false });
  });

  it("marks nodes outside the 50-node grid as unsupported", () => {
    expect(evaluateFlagSubmission(51, "HG{ANYTHING}")).toEqual({ supported: false, correct: false });
  });

  it("provides a safe flag-validated node for every problem from 1 through 50", () => {
    expect(learningChallenges).toHaveLength(50);
    expect(new Set(learningChallenges.map(challenge => challenge.id)).size).toBe(50);
    expect(learningChallenges.every(challenge => !("options" in challenge) && !("correct" in challenge) && !("distractors" in challenge))).toBe(true);
    expect(evaluateFlagSubmission(20, getExpectedFlag(20)!)).toEqual({ supported: true, correct: true });
    expect(evaluateFlagSubmission(50, getExpectedFlag(50)!)).toEqual({ supported: true, correct: true });
  });

  it("unlocks clearance only when all 50 flags have been solved", () => {
    expect(getCourseEligibility(50)).toBe(true);
    expect(getCourseEligibility(49)).toBe(false);
  });

  it("sorts public ranking by solved count, then by the earliest final solve", () => {
    const ranking = sortPublicRanking([
      { userId: 1, name: "Later finisher", solvedCount: 20, lastSolvedAt: new Date("2026-08-19T01:00:00.000Z") },
      { userId: 2, name: "More solves", solvedCount: 21, lastSolvedAt: new Date("2026-08-19T03:00:00.000Z") },
      { userId: 3, name: "Earlier finisher", solvedCount: 20, lastSolvedAt: new Date("2026-08-19T00:00:00.000Z") },
      { userId: 4, name: "No solved nodes", solvedCount: 0, lastSolvedAt: null },
    ]);

    expect(ranking.map(entry => entry.userId)).toEqual([2, 3, 1, 4]);
  });

  it("creates non-predictable certificate codes in the expected public verification format", () => {
    const first = createCertificateCode(new Date("2026-08-19T00:00:00.000Z"));
    const second = createCertificateCode(new Date("2026-08-19T00:00:00.000Z"));

    expect(first).toMatch(/^HG-WSF-2026-[A-F0-9]{18}$/);
    expect(second).toMatch(/^HG-WSF-2026-[A-F0-9]{18}$/);
    expect(second).not.toBe(first);
  });
});
