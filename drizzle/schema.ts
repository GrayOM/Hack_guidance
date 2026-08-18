import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Per-learner completion and defense-review state for a curriculum problem. */
export const learningProgress = mysqlTable("learningProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  problemId: int("problemId").notNull(),
  level: int("level").notNull(),
  hintCount: int("hintCount").default(0).notNull(),
  defenseReviewed: boolean("defenseReviewed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("learningProgress_user_problem_unique").on(table.userId, table.problemId)]);

/** A learner must pass the final module of each level before course completion. */
export const levelAssessments = mysqlTable("levelAssessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: int("level").notNull(),
  score: int("score").default(100).notNull(),
  passedAt: timestamp("passedAt").defaultNow().notNull(),
}, table => [uniqueIndex("levelAssessments_user_level_unique").on(table.userId, table.level)]);

/** A course completion record can later power certificate verification without storing a PDF file in the database. */
export const courseCertificates = mysqlTable("courseCertificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseCode: varchar("courseCode", { length: 64 }).notNull(),
  certificateCode: varchar("certificateCode", { length: 48 }).notNull().unique(),
  completedModules: int("completedModules").notNull(),
  passedAssessments: int("passedAssessments").notNull(),
  defenseReviewCount: int("defenseReviewCount").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
}, table => [uniqueIndex("courseCertificates_user_course_unique").on(table.userId, table.courseCode)]);

export type LearningProgress = typeof learningProgress.$inferSelect;
export type LevelAssessment = typeof levelAssessments.$inferSelect;
export type CourseCertificate = typeof courseCertificates.$inferSelect;
