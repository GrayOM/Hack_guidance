import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { evaluateFlagSubmission, getCertificateByCode, getLearnerDashboard, getLearnerRecord, getPublicRanking, issueCertificateIfEligible, saveCompletedProblem, saveDefenseReview } from "./learning";
import { challengeById } from "../shared/learning";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  learning: router({
    dashboard: protectedProcedure.query(({ ctx }) => getLearnerDashboard(ctx.user.id)),
    records: protectedProcedure.query(({ ctx }) => getLearnerRecord(ctx.user.id)),
    ranking: publicProcedure.query(() => getPublicRanking()),
    verifyCertificate: publicProcedure.input(z.object({ certificateCode: z.string().trim().min(8).max(48) })).query(({ input }) => getCertificateByCode(input.certificateCode)),
    submit: protectedProcedure.input(z.object({ problemId: z.number().int().min(1).max(50), flag: z.string().trim().min(4).max(96), hintCount: z.number().int().min(0).max(3) }))
      .mutation(async ({ ctx, input }) => {
        const challenge = challengeById(input.problemId);
        const evaluation = evaluateFlagSubmission(input.problemId, input.flag);
        if (!evaluation.supported || !challenge) return { correct: false, message: "지원하지 않는 문제입니다." };
        if (!evaluation.correct) return { correct: false, message: "플래그가 일치하지 않습니다. 단서와 증거를 다시 확인해 보세요." };
        const result = await saveCompletedProblem({ userId: ctx.user.id, problemId: input.problemId, level: challenge!.level, hintCount: input.hintCount });
        return { correct: true, message: "플래그가 확인되었습니다. 이 문제를 해결했습니다.", solvedAt: result.solvedAt };
      }),
    reviewDefense: protectedProcedure.input(z.object({ problemId: z.number().int().min(1).max(50) }))
      .mutation(async ({ ctx, input }) => {
        const challenge = challengeById(input.problemId);
        if (!challenge) throw new Error("지원하지 않는 실습 문제입니다.");
        await saveDefenseReview({ userId: ctx.user.id, problemId: input.problemId, level: challenge.level });
        return { success: true };
      }),
    issueCertificate: protectedProcedure.mutation(({ ctx }) => issueCertificateIfEligible(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
