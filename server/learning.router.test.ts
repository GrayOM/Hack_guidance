import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const learningMocks = vi.hoisted(() => ({
  evaluateFlagSubmission: vi.fn(),
  getCertificateByCode: vi.fn(),
  getLearnerDashboard: vi.fn(),
  getLearnerRecord: vi.fn(),
  getPublicRanking: vi.fn(),
  issueCertificateIfEligible: vi.fn(),
  saveCompletedProblem: vi.fn(),
  saveDefenseReview: vi.fn(),
}));

vi.mock("./learning", () => learningMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = { id: 1, openId: "flag-test-user", name: "Flag Test User", email: "flag@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("flag challenge router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    learningMocks.getLearnerDashboard.mockResolvedValue({ completedIds: [], defenseReviewedIds: [], passedLevels: [], certificate: null });
    learningMocks.getLearnerRecord.mockResolvedValue([]);
    learningMocks.getPublicRanking.mockResolvedValue([]);
    learningMocks.evaluateFlagSubmission.mockReturnValue({ supported: true, correct: true });
    learningMocks.saveCompletedProblem.mockResolvedValue({ solvedAt: new Date() });
    learningMocks.saveDefenseReview.mockResolvedValue(undefined);
    learningMocks.issueCertificateIfEligible.mockResolvedValue({ issued: false, remaining: { modules: 50 } });
  });

  it("records a valid flag submission for any selected node", async () => {
    const result = await appRouter.createCaller(createAuthContext()).learning.submit({ problemId: 11, flag: "HG{POST_IS_INPUT}", hintCount: 1 });
    expect(result).toMatchObject({ correct: true });
    expect(learningMocks.saveCompletedProblem).toHaveBeenCalledWith({ userId: 1, problemId: 11, level: 2, hintCount: 1 });
  });

  it("rejects an incorrect flag without recording a solution", async () => {
    learningMocks.evaluateFlagSubmission.mockReturnValue({ supported: true, correct: false });
    const result = await appRouter.createCaller(createAuthContext()).learning.submit({ problemId: 1, flag: "HG{WRONG}", hintCount: 0 });
    expect(result.correct).toBe(false);
    expect(learningMocks.saveCompletedProblem).not.toHaveBeenCalled();
  });

  it("keeps defense reviews and clearance checks available to the signed-in solver", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.learning.reviewDefense({ problemId: 1 })).resolves.toEqual({ success: true });
    await expect(caller.learning.issueCertificate()).resolves.toMatchObject({ issued: false });
    expect(learningMocks.saveDefenseReview).toHaveBeenCalledWith({ userId: 1, problemId: 1, level: 1 });
  });

  it("exposes the public ranking without requiring a signed-in operator", async () => {
    learningMocks.getPublicRanking.mockResolvedValue([{ userId: 2, name: "Ranked Operator", solvedCount: 7, lastSolvedAt: new Date() }]);
    const context = { ...createAuthContext(), user: null } as TrpcContext;
    await expect(appRouter.createCaller(context).learning.ranking()).resolves.toHaveLength(1);
  });
});
