import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { canAccessLevel, evaluateLearningAnswer, getCertificateByCode, getLearnerDashboard, getLearnerRecord, issueCertificateIfEligible, saveCompletedProblem, saveDefenseReview } from "./learning";
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
    verifyCertificate: publicProcedure.input(z.object({ certificateCode: z.string().trim().min(8).max(48) })).query(({ input }) => getCertificateByCode(input.certificateCode)),
    submit: protectedProcedure.input(z.object({ problemId: z.number().int().min(1).max(50), answer: z.string().min(1), hintCount: z.number().int().min(0).max(3) }))
      .mutation(async ({ ctx, input }) => {
        const challenge = challengeById(input.problemId);
        const evaluation = evaluateLearningAnswer(input.problemId, input.answer);
        if (!evaluation.supported) return { correct: false, message: "아직 제공되지 않는 실습 문제입니다." };
        const dashboard = await getLearnerDashboard(ctx.user.id);
        if (!canAccessLevel(challenge!.level, dashboard.passedLevels)) return { correct: false, message: `Level ${challenge!.level - 1} 평가를 통과한 뒤 이 실습을 시작할 수 있습니다.` };
        if (!evaluation.correct) return { correct: false, message: "선택한 근거를 다시 확인해 보세요. 관찰 포인트와 힌트를 함께 읽어보는 것이 좋습니다." };
        const result = await saveCompletedProblem({ userId: ctx.user.id, problemId: input.problemId, level: challenge!.level, hintCount: input.hintCount });
        if (result.assessmentLocked) return { correct: false, message: `Level ${challenge!.level} 평가 전에는 같은 레벨의 1~9번 실습을 모두 완료해야 합니다.` };
        if (input.problemId % 10 === 0) return { correct: true, message: result.assessmentPassed ? `Level ${challenge!.level} 평가를 통과했습니다. 다음 레벨을 시작할 수 있습니다.` : `Level ${challenge!.level} 평가를 통과하려면 같은 레벨의 다른 실습을 먼저 완료해야 합니다.` };
        return { correct: true, message: "분석 결과를 기록했습니다. 이제 방어 기준을 확인해 보세요." };
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
