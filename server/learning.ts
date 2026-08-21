import { and, asc, count, desc, eq, isNotNull, max } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { courseCertificates, learningProgress, users } from "../drizzle/schema";
import { challengeById } from "../shared/learning";
import { getDb } from "./db";
export type PublicRankingEntry = { userId: number; name: string | null; solvedCount: number; lastSolvedAt: Date | null };

export function getExpectedFlag(_problemId: number) {
  return null;
}

export function evaluateFlagSubmission(_problemId: number, _flag: string) {
  return { supported: false, correct: false } as const;
}

export function getCourseEligibility(_completedModules: number) {
  return false;
}

export function sortPublicRanking<T extends PublicRankingEntry>(entries: T[]) {
  return [...entries].sort((left, right) => {
    if (left.solvedCount !== right.solvedCount) return right.solvedCount - left.solvedCount;
    const leftSolvedAt = left.lastSolvedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const rightSolvedAt = right.lastSolvedAt?.getTime() ?? Number.POSITIVE_INFINITY;
    return leftSolvedAt - rightSolvedAt;
  });
}

export function createCertificateCode(now = new Date()) {
  return `HG-WSF-${now.getUTCFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 18).toUpperCase()}`;
}

export async function getLearnerDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  const certificateRows = await db.select().from(courseCertificates).where(eq(courseCertificates.userId, userId));
  return {
    completedIds: [],
    defenseReviewedIds: [],
    certificate: certificateRows[0] ?? null,
  };
}

export async function getLearnerRecord(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  return [];
}

export async function getPublicRanking() {
  const db = await getDb();
  if (!db) throw new Error("랭킹 데이터베이스에 연결할 수 없습니다.");
  return [];
}

export async function saveCompletedProblem(input: { userId: number; problemId: number; level: number; hintCount: number }) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  const existing = await db.select({ completedAt: learningProgress.completedAt }).from(learningProgress)
    .where(and(eq(learningProgress.userId, input.userId), eq(learningProgress.problemId, input.problemId))).limit(1);
  if (existing[0]?.completedAt) return { solvedAt: existing[0].completedAt, alreadyCompleted: true };
  const now = new Date();
  await db.insert(learningProgress).values({
    userId: input.userId,
    problemId: input.problemId,
    level: input.level,
    hintCount: input.hintCount,
    completedAt: now,
  }).onDuplicateKeyUpdate({ set: { updatedAt: now } });
  return { solvedAt: now, alreadyCompleted: false };
}

export async function saveDefenseReview(input: { userId: number; problemId: number; level: number }) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  const completed = await db.select().from(learningProgress).where(and(eq(learningProgress.userId, input.userId), eq(learningProgress.problemId, input.problemId))).limit(1);
  if (!completed[0]?.completedAt) throw new Error("문제를 해결한 뒤 대응 노트를 확인할 수 있습니다.");
  const now = new Date();
  await db.insert(learningProgress).values({ userId: input.userId, problemId: input.problemId, level: input.level, defenseReviewed: true })
    .onDuplicateKeyUpdate({ set: { defenseReviewed: true, updatedAt: now } });
}

export async function issueCertificateIfEligible(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("수료 기록 데이터베이스에 연결할 수 없습니다.");
  if (!getCourseEligibility(0)) return { issued: false, remaining: { modules: null } };
  const courseCode = "hack-guidance-50-node-clearance";
  const existing = await db.select({ certificateCode: courseCertificates.certificateCode }).from(courseCertificates)
    .where(and(eq(courseCertificates.userId, userId), eq(courseCertificates.courseCode, courseCode))).limit(1);
  if (existing[0]) return { issued: true, certificateCode: existing[0].certificateCode };
  const code = createCertificateCode();
  await db.insert(courseCertificates).values({ userId, courseCode, certificateCode: code, completedModules: 0, defenseReviewCount: 0, passedAssessments: 0 });
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
