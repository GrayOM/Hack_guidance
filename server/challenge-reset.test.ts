import { describe, expect, it } from "vitest";
import { filterProblemDirectory, problems } from "../client/src/lib/curriculum";
import { learningChallenges } from "../shared/learning";
import { evaluateFlagSubmission, getCourseEligibility, getExpectedFlag } from "./learning";

describe("empty challenge inventory", () => {
  it("does not expose retired challenge content in the public catalogue", () => {
    expect(problems).toEqual([]);
    expect(filterProblemDirectory()).toEqual([]);
    expect(learningChallenges).toEqual([]);
  });

  it("does not accept a flag or unlock a certificate before new challenges are registered", () => {
    expect(getExpectedFlag(1)).toBeNull();
    expect(evaluateFlagSubmission(1, "HG{RETIRED}")).toEqual({ supported: false, correct: false });
    expect(getCourseEligibility(999)).toBe(false);
  });
});
