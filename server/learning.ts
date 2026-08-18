import { and, eq, isNotNull } from "drizzle-orm";
import { courseCertificates, learningProgress, levelAssessments } from "../drizzle/schema";
import { challengeById, getChallengeAnswerId } from "../shared/learning";
import { getDb } from "./db";

export function evaluateLearningAnswer(problemId: number, answer: string) {
  const challenge = challengeById(problemId);
  if (!challenge) return { supported: false, correct: false } as const;
  const expected = getChallengeAnswerId(problemId);
  return { supported: true, correct: expected === answer.trim().toLowerCase() } as const;
}

export function getCourseEligibility(completedModules: number, defenseReviewCount: number, passedAssessments: number) {
  return completedModules >= 50 && defenseReviewCount >= 50 && passedAssessments >= 5;
}

export async function getLearnerDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");

  const [progressRows, assessmentRows, certificateRows] = await Promise.all([
    db.select().from(learningProgress).where(eq(learningProgress.userId, userId)),
    db.select().from(levelAssessments).where(eq(levelAssessments.userId, userId)),
    db.select().from(courseCertificates).where(eq(courseCertificates.userId, userId)),
  ]);

  const completedIds = progressRows.filter(row => row.completedAt).map(row => row.problemId);
  const defenseReviewedIds = progressRows.filter(row => row.defenseReviewed).map(row => row.problemId);
  return {
    completedIds,
    defenseReviewedIds,
    passedLevels: assessmentRows.map(row => row.level),
    certificate: certificateRows[0] ?? null,
  };
}

export async function saveCompletedProblem(input: { userId: number; problemId: number; level: number; hintCount: number }) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  const now = new Date();
  await db.insert(learningProgress).values({
    userId: input.userId,
    problemId: input.problemId,
    level: input.level,
    hintCount: input.hintCount,
    completedAt: now,
  }).onDuplicateKeyUpdate({ set: { completedAt: now, hintCount: input.hintCount, updatedAt: now } });

  if (input.problemId % 10 === 0) {
    await db.insert(levelAssessments).values({ userId: input.userId, level: input.level, score: 100, passedAt: now })
      .onDuplicateKeyUpdate({ set: { score: 100, passedAt: now } });
  }
}

export async function saveDefenseReview(input: { userId: number; problemId: number; level: number }) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  const now = new Date();
  await db.insert(learningProgress).values({ userId: input.userId, problemId: input.problemId, level: input.level, defenseReviewed: true })
    .onDuplicateKeyUpdate({ set: { defenseReviewed: true, updatedAt: now } });
}

export async function issueCertificateIfEligible(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  const [completedRows, defenseRows, assessments] = await Promise.all([
    db.select().from(learningProgress).where(and(eq(learningProgress.userId, userId), isNotNull(learningProgress.completedAt))),
    db.select().from(learningProgress).where(and(eq(learningProgress.userId, userId), eq(learningProgress.defenseReviewed, true))),
    db.select().from(levelAssessments).where(eq(levelAssessments.userId, userId)),
  ]);
  const eligible = getCourseEligibility(completedRows.length, defenseRows.length, assessments.length);
  if (!eligible) return { issued: false, remaining: { modules: Math.max(0, 50 - completedRows.length), defense: Math.max(0, 50 - defenseRows.length), assessments: Math.max(0, 5 - assessments.length) } };

  const code = `HG-WSF-${new Date().getFullYear()}-${String(userId).padStart(6, "0")}`;
  await db.insert(courseCertificates).values({ userId, courseCode: "web-security-fundamentals", certificateCode: code, completedModules: completedRows.length, defenseReviewCount: defenseRows.length, passedAssessments: assessments.length })
    .onDuplicateKeyUpdate({ set: { completedModules: completedRows.length, defenseReviewCount: defenseRows.length, passedAssessments: assessments.length } });
  return { issued: true, certificateCode: code };
}
