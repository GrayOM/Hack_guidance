import { describe, expect, it } from "vitest";
import { evaluateFlagSubmission, getCourseEligibility, getExpectedFlag } from "./learning";
import { learningChallenges } from "../shared/learning";

describe("flag validation", () => {
  it("accepts the expected flag for the first node and rejects an incorrect flag", () => {
    expect(evaluateFlagSubmission(1, getExpectedFlag(1)!)).toEqual({ supported: true, correct: true });
    expect(evaluateFlagSubmission(1, "HG{BROWSER_ONLY}")).toEqual({ supported: true, correct: false });
  });

  it("marks nodes outside the 50-node grid as unsupported", () => {
    expect(evaluateFlagSubmission(51, "HG{ANYTHING}")).toEqual({ supported: false, correct: false });
  });

  it("provides a safe flag-validated node for every problem from 1 through 50", () => {
    expect(learningChallenges).toHaveLength(50);
    expect(new Set(learningChallenges.map(challenge => challenge.id)).size).toBe(50);
    expect(evaluateFlagSubmission(20, getExpectedFlag(20)!)).toEqual({ supported: true, correct: true });
    expect(evaluateFlagSubmission(50, getExpectedFlag(50)!)).toEqual({ supported: true, correct: true });
  });

  it("unlocks clearance only when all 50 flags have been solved", () => {
    expect(getCourseEligibility(50)).toBe(true);
    expect(getCourseEligibility(49)).toBe(false);
  });
});
