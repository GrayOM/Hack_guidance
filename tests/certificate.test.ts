import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260823000000_black_trace_certificate.sql", import.meta.url), "utf8");
const certificatePage = readFileSync(new URL("../client/src/pages/Certificate.tsx", import.meta.url), "utf8");
const printPage = readFileSync(new URL("../client/src/pages/CertificatePrint.tsx", import.meta.url), "utf8");
const navSource = readFileSync(new URL("../client/src/components/ConsoleNav.tsx", import.meta.url), "utf8");

describe("BLACK TRACE clearance certificate", () => {
  it("issues only after all ten nodes are recovered, and issues once", () => {
    expect(migration).toContain("hg_black_trace_progress");
    expect(migration).toContain("v_required constant integer := 10");
    // The retired curriculum's progress table no longer decides eligibility. Only the
    // executed SQL is checked, since the header comment names it to explain the change.
    const executedSql = migration.slice(migration.indexOf("begin;"));
    expect(executedSql).not.toContain("hg_learning_progress");
    // The old table required exactly 50 modules, which nothing could satisfy any more.
    expect(migration).toContain("drop constraint if exists hg_course_certificates_completed_modules_check");
    // Re-issuing returns the code already held rather than minting a second one.
    expect(migration).toContain("on conflict (user_id, course_code) do update");
  });

  it("verifies a printed code without requiring a session", () => {
    const beforeAuth = learningFunction.slice(0, learningFunction.indexOf("const user = await requireUser(request)"));
    expect(beforeAuth).toContain('action === "verifyCertificate"');
    // The code shape is checked before the table is touched.
    expect(learningFunction).toContain("HG-WSF-[0-9]{4}-[A-F0-9]{18}");
    expect(learningFunction).toContain("hg_public_certificate_verification");
    // Public verification exposes only what the printed sheet shows.
    const executedSql = migration.slice(migration.indexOf("begin;"));
    expect(executedSql).not.toContain("p.id as user_id");
    expect(executedSql).not.toContain("u.email");
    // CREATE OR REPLACE VIEW cannot drop a column (42P16), and this view loses user_id.
    expect(executedSql).toContain("drop view if exists public.hg_public_certificate_verification");
    expect(executedSql).not.toContain("create or replace view public.hg_public_certificate_verification");
  });

  it("drops the retired 50-problem criteria from the printed sheet", () => {
    expect(printPage).not.toContain("/ 50");
    expect(printPage).not.toContain("passedAssessments");
    expect(printPage).not.toContain("defenseReviewCount");
    expect(printPage).toContain("회수한 노드");
    expect(printPage).toContain("/ 10");
  });

  it("meters the unauthenticated actions per caller without storing an address", () => {
    const publicMigration = readFileSync(new URL("../supabase/migrations/20260824000000_public_rate_limit.sql", import.meta.url), "utf8");
    expect(publicMigration).toContain("hg_consume_public_slot");
    expect(publicMigration).toContain("hg_public_rate_limit_browser_deny");
    // The ledger is pruned, so an open endpoint cannot grow it without bound.
    expect(publicMigration).toContain("delete from public.hg_public_rate_limits where bucket_start <");
    // The browser roles are refused by privilege, not only by policy.
    const grants = readFileSync(new URL("../supabase/migrations/20260824000001_public_rate_limit_grants.sql", import.meta.url), "utf8");
    expect(grants).toContain("revoke all on table public.hg_public_rate_limits from public, anon, authenticated");
    // The address is hashed before it reaches the ledger.
    expect(learningFunction).toContain("crypto.subtle.digest(\"SHA-256\"");
    // Keying on the caller-supplied hop would let anyone sidestep the ceiling by randomising it.
    expect(learningFunction).toContain("hops[hops.length - 1]");
    expect(learningFunction).not.toContain('forwarded.split(",")[0]');
    // A header the edge overwrites outranks one the caller can set.
    const keySource = learningFunction.slice(learningFunction.indexOf("async function publicClientKey"));
    expect(keySource.indexOf("cf-connecting-ip")).toBeLessThan(keySource.indexOf("x-real-ip"));
    expect(learningFunction).toContain("publicClientKey");
    expect(learningFunction).toContain('["checkDisplayName", "ranking", "verifyCertificate"]');
    // A limiter outage must not take the public pages down with it.
    expect(learningFunction).toContain("public rate limit unavailable");
  });

  it("publishes the remaining public calls so the ceiling can be observed, not inferred", () => {
    // The routine returns the attempt count; a boolean made a deployment carrying the ceiling
    // indistinguishable from one without it, because both answer 200 below the limit.
    const observable = readFileSync(new URL("../supabase/migrations/20260825000000_public_rate_limit_observable.sql", import.meta.url), "utf8");
    expect(observable).toContain("drop function if exists public.hg_consume_public_slot(text, integer)");
    expect(observable).toContain("create function public.hg_consume_public_slot(p_client_key text)");
    expect(observable).toContain("returns integer");
    expect(observable).toContain("return v_attempts;");
    // Only the service role may spend a slot.
    expect(observable).toContain("grant execute on function public.hg_consume_public_slot(text) to service_role");
    expect(learningFunction).toContain('"X-RateLimit-Limit": String(publicCallLimit)');
    expect(learningFunction).toContain('"X-RateLimit-Remaining"');
    // A browser reads the headers only when they are exposed to it.
    expect(learningFunction).toContain('"Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining"');
    // The ceiling itself still rejects rather than merely reporting.
    expect(learningFunction).toContain('reason: "rate_limited"');
    expect(learningFunction).not.toContain("allowPublicCall");
  });

  it("is reachable from the console and gates issuance on eligibility", () => {
    expect(navSource).toContain('path: "/certificate"');
    expect(learningFunction).toContain("certificateEligible: solvedCount >= blackTraceNodeCount");
    expect(certificatePage).toContain("issue.mutate");
    expect(certificatePage).toContain("const eligible = remaining === 0");
    // An operator who already holds the certificate sees the code instead of the button.
    expect(certificatePage).toContain("VERIFICATION CODE");
  });
});
