import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { evaluateFlagSubmission } from "./learning";
import { clearSubmissionRateLimitForTest } from "./submission-rate-limit";

const learningMocks = vi.hoisted(() => ({
  saveCompletedProblem: vi.fn(),
}));

vi.mock("./learning", async importOriginal => {
  const actual = await importOriginal<typeof import("./learning")>();
  return { ...actual, saveCompletedProblem: learningMocks.saveCompletedProblem };
});

import { appRouter } from "./routers";

function createAuthContext(): TrpcContext {
  return {
    user: { id: 91_001, openId: "secret-test-user", name: "Secret Test User", email: "secret-test@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("LEARNING_FLAG_MAP secret", () => {
  beforeEach(() => {
    clearSubmissionRateLimitForTest();
    learningMocks.saveCompletedProblem.mockResolvedValue({ solvedAt: new Date(), alreadyCompleted: false });
  });

  it("contains exactly 50 high-entropy flags accepted only by server-side evaluation", () => {
    const raw = process.env.LEARNING_FLAG_MAP;
    expect(raw).toBeTruthy();
    const flags = JSON.parse(raw!) as Record<string, string>;
    expect(Object.keys(flags).sort((left, right) => Number(left) - Number(right))).toEqual(Array.from({ length: 50 }, (_, index) => String(index + 1)));

    for (let problemId = 1; problemId <= 50; problemId += 1) {
      const flag = flags[String(problemId)];
      expect(flag).toMatch(/^HG\{N\d{2}_[A-Za-z0-9_-]{24}\}$/);
      expect(evaluateFlagSubmission(problemId, flag)).toEqual({ supported: true, correct: true });
    }
  });

  it("accepts the configured flag only through the authenticated submission API", async () => {
    const flags = JSON.parse(process.env.LEARNING_FLAG_MAP!) as Record<string, string>;
    const result = await appRouter.createCaller(createAuthContext()).learning.submit({ problemId: 1, flag: flags["1"], hintCount: 0 });

    expect(result).toMatchObject({ correct: true });
    expect(learningMocks.saveCompletedProblem).toHaveBeenCalledWith({ userId: 91_001, problemId: 1, level: 1, hintCount: 0 });
  });
});
