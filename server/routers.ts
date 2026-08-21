import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { evaluateFlagSubmission, getCertificateByCode, getLearnerDashboard, getLearnerRecord, getPublicRanking, issueCertificateIfEligible, saveCompletedProblem, saveDefenseReview } from "./learning";

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
    submit: protectedProcedure.input(z.object({ problemId: z.number().int().positive(), flag: z.string().trim().min(1).max(96), hintCount: z.number().int().min(0).max(3) }))
      .mutation(async ({ input }) => {
        const evaluation = evaluateFlagSubmission(input.problemId, input.flag);
        return { correct: evaluation.correct, message: "현재 등록된 문제가 없습니다." };
      }),
    reviewDefense: protectedProcedure.input(z.object({ problemId: z.number().int().positive() }))
      .mutation(async () => {
        return { success: false, message: "현재 등록된 문제가 없습니다." };
      }),
    issueCertificate: protectedProcedure.mutation(({ ctx }) => issueCertificateIfEligible(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
