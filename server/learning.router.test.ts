import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const learningMocks = vi.hoisted(() => ({
  canAccessLevel: vi.fn(),
  evaluateLearningAnswer: vi.fn(),
  getCertificateByCode: vi.fn(),
  getLearnerDashboard: vi.fn(),
  issueCertificateIfEligible: vi.fn(),
  saveCompletedProblem: vi.fn(),
  saveDefenseReview: vi.fn(),
}));

vi.mock("./learning", () => learningMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "learning-test-user",
    name: "Learning Test User",
    email: "learner@example.com",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("learning router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    learningMocks.getLearnerDashboard.mockResolvedValue({ completedIds: [], defenseReviewedIds: [], passedLevels: [], certificate: null });
    learningMocks.evaluateLearningAnswer.mockReturnValue({ supported: true, correct: true });
    learningMocks.canAccessLevel.mockReturnValue(true);
    learningMocks.saveCompletedProblem.mockResolvedValue({ assessmentPassed: false, assessmentLocked: false });
    learningMocks.saveDefenseReview.mockResolvedValue(undefined);
    learningMocks.issueCertificateIfEligible.mockResolvedValue({ issued: false, remaining: { modules: 50, defense: 50, assessments: 5 } });
  });

  it("blocks a later-level lab when the previous assessment has not been passed", async () => {
    learningMocks.canAccessLevel.mockReturnValue(false);
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.submit({ problemId: 11, answer: "b", hintCount: 0 });

    expect(result.correct).toBe(false);
    expect(result.message).toContain("Level 1 평가");
    expect(learningMocks.saveCompletedProblem).not.toHaveBeenCalled();
  });

  it("records a valid, unlocked analysis result for the signed-in learner", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.submit({ problemId: 1, answer: "a", hintCount: 1 });

    expect(result).toMatchObject({ correct: true });
    expect(learningMocks.saveCompletedProblem).toHaveBeenCalledWith({ userId: 1, problemId: 1, level: 1, hintCount: 1 });
  });

  it("does not pass a level assessment when earlier modules remain incomplete", async () => {
    learningMocks.saveCompletedProblem.mockResolvedValue({ assessmentPassed: false, assessmentLocked: true });
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.learning.submit({ problemId: 10, answer: "a", hintCount: 0 });

    expect(result.correct).toBe(false);
    expect(result.message).toContain("1~9번 실습");
  });

  it("records a defense review and exposes the certificate eligibility result", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.learning.reviewDefense({ problemId: 1 })).resolves.toEqual({ success: true });
    await expect(caller.learning.issueCertificate()).resolves.toMatchObject({ issued: false });
    expect(learningMocks.saveDefenseReview).toHaveBeenCalledWith({ userId: 1, problemId: 1, level: 1 });
  });
});
