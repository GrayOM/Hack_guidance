import { and, eq, isNotNull } from "drizzle-orm";
import { courseCertificates, learningProgress, levelAssessments, users } from "../drizzle/schema";
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

export function canAccessLevel(level: number, passedLevels: number[]) {
  return level === 1 || passedLevels.includes(level - 1);
}

export function canSubmitAssessment(problemId: number, completedProblemIds: number[]) {
  if (problemId % 10 !== 0) return true;
  const firstProblemId = problemId - 9;
  return Array.from({ length: 9 }, (_, index) => firstProblemId + index).every(id => completedProblemIds.includes(id));
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

export async function getLearnerRecord(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  return db.select({
    problemId: learningProgress.problemId,
    level: learningProgress.level,
    hintCount: learningProgress.hintCount,
    defenseReviewed: learningProgress.defenseReviewed,
    completedAt: learningProgress.completedAt,
    updatedAt: learningProgress.updatedAt,
  }).from(learningProgress).where(eq(learningProgress.userId, userId)).orderBy(learningProgress.level, learningProgress.problemId);
}

export async function saveCompletedProblem(input: { userId: number; problemId: number; level: number; hintCount: number }) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  const now = new Date();
  if (input.problemId % 10 === 0) {
    const levelProgress = await db.select().from(learningProgress).where(and(eq(learningProgress.userId, input.userId), eq(learningProgress.level, input.level)));
    const completedIds = levelProgress.filter(row => row.completedAt).map(row => row.problemId);
    if (!canSubmitAssessment(input.problemId, completedIds)) return { assessmentPassed: false, assessmentLocked: true };
  }
  await db.insert(learningProgress).values({
    userId: input.userId,
    problemId: input.problemId,
    level: input.level,
    hintCount: input.hintCount,
    completedAt: now,
  }).onDuplicateKeyUpdate({ set: { completedAt: now, hintCount: input.hintCount, updatedAt: now } });

  let assessmentPassed = false;
  if (input.problemId % 10 === 0) {
    assessmentPassed = true;
    await db.insert(levelAssessments).values({ userId: input.userId, level: input.level, score: 100, passedAt: now })
      .onDuplicateKeyUpdate({ set: { score: 100, passedAt: now } });
  }
  return { assessmentPassed, assessmentLocked: false };
}

export async function saveDefenseReview(input: { userId: number; problemId: number; level: number }) {
  const db = await getDb();
  if (!db) throw new Error("학습 기록 데이터베이스에 연결할 수 없습니다.");
  const completed = await db.select().from(learningProgress).where(and(eq(learningProgress.userId, input.userId), eq(learningProgress.problemId, input.problemId))).limit(1);
  if (!completed[0]?.completedAt) throw new Error("문제 분석을 완료한 뒤 방어 기준을 기록할 수 있습니다.");
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

export async function getCertificateByCode(certificateCode: string) {
  const db = await getDb();
  if (!db) throw new Error("수료 기록 데이터베이스에 연결할 수 없습니다.");
  const rows = await db.select({
    certificateCode: courseCertificates.certificateCode,
    courseCode: courseCertificates.courseCode,
    issuedAt: courseCertificates.issuedAt,
    completedModules: courseCertificates.completedModules,
    passedAssessments: courseCertificates.passedAssessments,
    defenseReviewCount: courseCertificates.defenseReviewCount,
    learnerName: users.name,
  }).from(courseCertificates).innerJoin(users, eq(courseCertificates.userId, users.id)).where(eq(courseCertificates.certificateCode, certificateCode)).limit(1);
  return rows[0] ?? null;
}
