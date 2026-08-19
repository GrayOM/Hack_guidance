import { and, asc, count, desc, eq, isNotNull, max } from "drizzle-orm";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { courseCertificates, learningProgress, users } from "../drizzle/schema";
import { challengeById } from "../shared/learning";
import { getDb } from "./db";
import { ENV } from "./_core/env";

type FlagMap = Record<string, string>;
export type PublicRankingEntry = { userId: number; name: string | null; solvedCount: number; lastSolvedAt: Date | null };

function buildTestFlagMap() {
  return Object.fromEntries(Array.from({ length: 50 }, (_, index) => [String(index + 1), `HG{TEST_NODE_${String(index + 1).padStart(2, "0")}}`]));
}

function loadFlagMap(): FlagMap {
  if (!ENV.learningFlagMap && process.env.NODE_ENV === "test") return buildTestFlagMap();
  if (!ENV.learningFlagMap) return {};
  try {
    const parsed = JSON.parse(ENV.learningFlagMap) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, flag]) => /^([1-9]|[1-4][0-9]|50)$/.test(id) && typeof flag === "string" && /^HG\{[A-Za-z0-9_\-]{4,80}\}$/.test(flag)));
  } catch {
    return {};
  }
}

const flagMap = loadFlagMap();

export function getExpectedFlag(problemId: number) {
  return flagMap[String(problemId)] ?? null;
}

export function evaluateFlagSubmission(problemId: number, flag: string) {
  const challenge = challengeById(problemId);
  if (!challenge) return { supported: false, correct: false } as const;
  const submitted = flag.trim().replace(/\s/g, "");
  const expected = getExpectedFlag(problemId);
  const correct = Boolean(expected) && submitted.length === expected.length && timingSafeEqual(Buffer.from(expected), Buffer.from(submitted));
  return { supported: true, correct } as const;
}

export function getCourseEligibility(completedModules: number) {
  return completedModules >= 50;
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
  const [progressRows, certificateRows] = await Promise.all([
    db.select().from(learningProgress).where(eq(learningProgress.userId, userId)),
    db.select().from(courseCertificates).where(eq(courseCertificates.userId, userId)),
  ]);
  return {
    completedIds: progressRows.filter(row => row.completedAt).map(row => row.problemId),
    defenseReviewedIds: progressRows.filter(row => row.defenseReviewed).map(row => row.problemId),
    certificate: certificateRows[0] ?? null,
  };
}

export async function getLearnerRecord(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  return db.select({
    problemId: learningProgress.problemId,
    level: learningProgress.level,
    hintCount: learningProgress.hintCount,
    defenseReviewed: learningProgress.defenseReviewed,
    completedAt: learningProgress.completedAt,
    updatedAt: learningProgress.updatedAt,
  }).from(learningProgress).where(eq(learningProgress.userId, userId)).orderBy(learningProgress.level, learningProgress.problemId);
}

export async function getPublicRanking() {
  const db = await getDb();
  if (!db) throw new Error("랭킹 데이터베이스에 연결할 수 없습니다.");
  const solvedCount = count(learningProgress.problemId);
  const lastSolvedAt = max(learningProgress.completedAt);
  const rows = await db.select({ userId: users.id, name: users.name, solvedCount, lastSolvedAt })
    .from(users)
    .leftJoin(learningProgress, and(eq(learningProgress.userId, users.id), isNotNull(learningProgress.completedAt)))
    .groupBy(users.id, users.name)
    .orderBy(desc(solvedCount), asc(lastSolvedAt))
    .limit(100);
  return sortPublicRanking(rows);
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
  const completedRows = await db.select().from(learningProgress).where(and(eq(learningProgress.userId, userId), isNotNull(learningProgress.completedAt)));
  if (!getCourseEligibility(completedRows.length)) return { issued: false, remaining: { modules: Math.max(0, 50 - completedRows.length) } };
  const courseCode = "hack-guidance-50-node-clearance";
  const existing = await db.select({ certificateCode: courseCertificates.certificateCode }).from(courseCertificates)
    .where(and(eq(courseCertificates.userId, userId), eq(courseCertificates.courseCode, courseCode))).limit(1);
  if (existing[0]) return { issued: true, certificateCode: existing[0].certificateCode };
  const code = createCertificateCode();
  await db.insert(courseCertificates).values({ userId, courseCode, certificateCode: code, completedModules: completedRows.length, defenseReviewCount: 0, passedAssessments: 0 });
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
