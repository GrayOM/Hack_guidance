import { describe, expect, it } from "vitest";
import { evaluateLearningAnswer, getCourseEligibility } from "./learning";
import { getChallengeAnswerId, learningChallenges } from "../shared/learning";

describe("Level 1 answer validation", () => {
  it("accepts the server-side trust-boundary answer for the first lab", () => {
    expect(evaluateLearningAnswer(1, "a")).toEqual({ supported: true, correct: true });
  });

  it("rejects a plausible but unsafe browser-only choice", () => {
    expect(evaluateLearningAnswer(1, "b")).toEqual({ supported: true, correct: false });
  });

  it("marks lessons outside the implemented Level 1 range as unsupported", () => {
    expect(evaluateLearningAnswer(51, "anything")).toEqual({ supported: false, correct: false });
  });

  it("provides a safe, answer-validated lab for every module from 1 through 50", () => {
    expect(learningChallenges).toHaveLength(50);
    expect(new Set(learningChallenges.map(challenge => challenge.id)).size).toBe(50);
    expect(evaluateLearningAnswer(20, getChallengeAnswerId(20))).toEqual({ supported: true, correct: true });
    expect(evaluateLearningAnswer(50, getChallengeAnswerId(50))).toEqual({ supported: true, correct: true });
  });

  it("allows certificate issuance only after all three completion requirements are met", () => {
    expect(getCourseEligibility(50, 50, 5)).toBe(true);
    expect(getCourseEligibility(50, 49, 5)).toBe(false);
  });
});
