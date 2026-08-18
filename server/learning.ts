import { and, asc, count, desc, eq, isNotNull, max } from "drizzle-orm";
import { courseCertificates, learningProgress, levelAssessments, users } from "../drizzle/schema";
import { challengeById } from "../shared/learning";
import { getDb } from "./db";

const flagTokens = [
  "SERVER_AUTH", "ALLOWLIST_FILES", "SERVER_AUTHZ", "OUTPUT_CONTEXT", "SERVER_VALIDATION",
  "VALIDATE_INPUT", "INTERNAL_REDIRECT", "PRIVATE_CACHE", "ACCESS_NOT_ROBOTS", "TRUST_BOUNDARIES",
  "QUERY_VALIDATION", "POST_IS_INPUT", "AUTH_NOT_AUTHZ", "SESSION_POLICY", "SERVER_GUARD",
  "NORMALIZE_FILENAME", "CONTENT_NOT_EXTENSION", "RULES_AND_RIGHTS", "SAFE_ERROR_CODE", "REQUEST_GATE",
  "ENCODE_BY_CONTEXT", "TEXT_NOT_CODE", "PARAMETERIZED_QUERY", "ALLOWLIST_STRUCTURE", "MAP_FILE_ID",
  "NONEXEC_STORAGE", "SAFE_REQUEST_ID", "TOKEN_EXPOSURE", "VALIDATE_EACH_BOUNDARY", "DEFENSE_IN_DEPTH",
  "OBJECT_AUTHZ", "EVERY_ENDPOINT", "AUTH_THEN_AUTHZ", "FRESH_ROLE_CHECK", "VERIFY_TOKEN",
  "MINIMUM_RESPONSE", "MEANINGFUL_LIMITS", "AUDIT_MINIMUM", "DEFAULT_DENY", "SERVER_BOUNDARIES",
  "EVIDENCE_FIRST", "IMPACT_AND_PROOF", "PER_REQUEST_AUTHZ", "CONTEXTUAL_OUTPUT", "FILE_LIFECYCLE",
  "API_CONTRACT", "REPORT_WITH_PROOF", "LAYERED_DEFENSE", "SCOPE_AND_EVIDENCE", "FINAL_GRID_CLEAR",
] as const;

export function getExpectedFlag(problemId: number) {
  const token = flagTokens[problemId - 1];
  return token ? `HG{${token}}` : null;
}

export function evaluateFlagSubmission(problemId: number, flag: string) {
  const challenge = challengeById(problemId);
  if (!challenge) return { supported: false, correct: false } as const;
  const submitted = flag.trim().replace(/\s/g, "").toUpperCase();
  return { supported: true, correct: getExpectedFlag(problemId) === submitted } as const;
}

export function getCourseEligibility(completedModules: number) {
  return completedModules >= 50;
}

export async function getLearnerDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  const [progressRows, assessmentRows, certificateRows] = await Promise.all([
    db.select().from(learningProgress).where(eq(learningProgress.userId, userId)),
    db.select().from(levelAssessments).where(eq(levelAssessments.userId, userId)),
    db.select().from(courseCertificates).where(eq(courseCertificates.userId, userId)),
  ]);
  return {
    completedIds: progressRows.filter(row => row.completedAt).map(row => row.problemId),
    defenseReviewedIds: progressRows.filter(row => row.defenseReviewed).map(row => row.problemId),
    passedLevels: assessmentRows.map(row => row.level),
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
  return db.select({ userId: users.id, name: users.name, solvedCount, lastSolvedAt })
    .from(users)
    .leftJoin(learningProgress, and(eq(learningProgress.userId, users.id), isNotNull(learningProgress.completedAt)))
    .groupBy(users.id, users.name)
    .orderBy(desc(solvedCount), asc(lastSolvedAt))
    .limit(100);
}

export async function saveCompletedProblem(input: { userId: number; problemId: number; level: number; hintCount: number }) {
  const db = await getDb();
  if (!db) throw new Error("풀이 기록 데이터베이스에 연결할 수 없습니다.");
  const now = new Date();
  await db.insert(learningProgress).values({
    userId: input.userId,
    problemId: input.problemId,
    level: input.level,
    hintCount: input.hintCount,
    completedAt: now,
  }).onDuplicateKeyUpdate({ set: { completedAt: now, hintCount: input.hintCount, updatedAt: now } });
  return { solvedAt: now };
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
  const code = `HG-WSF-${new Date().getFullYear()}-${String(userId).padStart(6, "0")}`;
  await db.insert(courseCertificates).values({ userId, courseCode: "hack-guidance-50-node-clearance", certificateCode: code, completedModules: completedRows.length, defenseReviewCount: 0, passedAssessments: 0 })
    .onDuplicateKeyUpdate({ set: { completedModules: completedRows.length, defenseReviewCount: 0, passedAssessments: 0 } });
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
