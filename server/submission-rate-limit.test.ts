import { beforeEach, describe, expect, it } from "vitest";
import { checkSubmissionRateLimit, clearSubmissionRateLimitForTest } from "./submission-rate-limit";

describe("submission rate limit", () => {
  beforeEach(() => clearSubmissionRateLimitForTest());

  it("allows a limited number of submissions and blocks repeated guessing", () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      expect(checkSubmissionRateLimit(17, 1_000 + attempt)).toMatchObject({ allowed: true });
    }
    expect(checkSubmissionRateLimit(17, 1_020)).toMatchObject({ allowed: false });
  });

  it("keeps rate-limit windows separate per authenticated user", () => {
    for (let attempt = 0; attempt < 12; attempt += 1) checkSubmissionRateLimit(17, 1_000 + attempt);
    expect(checkSubmissionRateLimit(18, 1_020)).toMatchObject({ allowed: true });
  });
});
