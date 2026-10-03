import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceNodeCount, blackTraceStages } from "../shared/black-trace";
import { parallelCount, rangeReplyLines } from "../client/src/components/instruments/range";

const rangeFunction = readFileSync(new URL("../supabase/functions/range/index.ts", import.meta.url), "utf8");
const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
const consoleSource = readFileSync(new URL("../client/src/components/instruments/range.tsx", import.meta.url), "utf8");
const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const stageStyles = readFileSync(new URL("../client/src/pages/black-trace.css", import.meta.url), "utf8");
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const migrations = readdirSync(migrationDir).sort();
const rangeMigration = readFileSync(new URL("20260829000000_range_state_and_forty_five_nodes.sql", migrationDir), "utf8");

describe("PRACTICE RANGE", () => {
  it("serves only fixture data: no application table, no filesystem, no outbound request", () => {
    // The point of an isolated range is that a technique practised on it cannot reach anything
    // real. The orders, documents and prices are literals in this file, so there is nothing behind
    // them to reach. The one table it touches holds a single integer per operator.
    const tables = [...rangeFunction.matchAll(/\.from\("([a-z_]+)"\)/g)].map(match => match[1]);
    expect(new Set(tables)).toEqual(new Set(["hg_range_state"]));
    expect(rangeFunction).not.toMatch(/Deno\.(readFile|readTextFile|open|writeFile|run|Command)/);
    // Every fetch would be an outbound request from a function that answers attacker-chosen input,
    // which is how a practice range becomes a proxy for reaching somewhere else.
    expect(rangeFunction).not.toMatch(/\bfetch\(/);
  });

  it("requires a platform session on every mode, before the mode is even read", () => {
    // An endpoint open to anyone is someone's free compute before it is a lesson, and one of these
    // modes deliberately sleeps. The gate therefore sits above the dispatch, not inside a branch.
    const handler = rangeFunction.slice(rangeFunction.indexOf("Deno.serve"));
    const gate = handler.indexOf("const user = await requireUser(request)");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(handler.indexOf('const mode = url.searchParams.get("mode")'));
    for (const mode of ["order", "issue", "vault", "doc", "coupon", "reset", "checkout"]) {
      expect(handler.indexOf(`mode === "${mode}"`)).toBeGreaterThan(gate);
    }
  });

  it("signs the range token with a key of its own, so forging one grants nothing elsewhere", () => {
    expect(rangeFunction).toContain("RANGE_TOKEN_SECRET");
    // The platform's own session secret must never be reachable from the range, and the range must
    // never mint or accept a platform token.
    expect(rangeFunction).not.toContain("BLACK_TRACE_SECRET");
    expect(rangeFunction).not.toContain("JWT_SECRET");
  });

  it("bounds every operator-supplied field before looking at it", () => {
    expect(rangeFunction).toContain("const maxField = 256");
    for (const field of ['url.searchParams.get("id")', 'url.searchParams.get("name")', 'request.headers.get("x-range-token")']) {
      expect(rangeFunction).toMatch(new RegExp(`bounded\\(${field.replace(/[.()[\]*+?^$|\\]/g, "\\$&")}`));
    }
    // The quantity is a number, so it is bounded by range rather than by length.
    expect(rangeFunction).toContain("Math.abs(quantity) > 1_000_000");
    // The field the console lets the operator set is capped client side too: a request count is an
    // input like any other.
    expect(parallelCount("2")).toBe(2);
    expect(parallelCount("9999")).toBe(8);
    expect(parallelCount("-4")).toBe(1);
    expect(parallelCount("abc")).toBe(1);
    expect(parallelCount("")).toBe(1);
  });

  it("makes the race reachable only concurrently: a loose check over an atomic apply", () => {
    // The defect the node teaches is the non-atomic check -- read the counter, do other work, then
    // apply. Keeping the apply itself atomic is what makes the double-apply observable: the second
    // request to land is told it is the second. An upsert of a read value would have let one write
    // overwrite the other, leaving the operator nothing to see and the node unsolvable.
    const branch = rangeFunction.slice(rangeFunction.indexOf('mode === "coupon"'), rangeFunction.indexOf('mode === "reset"'));
    expect(branch).toContain('select("coupon_applied")');
    expect(branch).toContain("setTimeout");
    expect(branch).toContain('rpc("hg_range_apply_coupon"');
    expect(branch).toContain("count >= 2");
    // Nothing in the branch writes the counter directly, or sequential calls would reach the flag.
    expect(branch).not.toContain("upsert");
    expect(rangeMigration).toContain("on conflict (user_id) do update");
    expect(rangeMigration).toContain("set coupon_applied = s.coupon_applied + 1");
  });

  it("keeps the range counter private to its operator and writable only by the function", () => {
    expect(rangeMigration).toContain("alter table public.hg_range_state enable row level security");
    expect(rangeMigration).toContain("using (user_id = auth.uid())");
    expect(rangeMigration).toContain("revoke all on table public.hg_range_state from public, anon");
    // Only select is granted: an operator who could write the counter could set it to the value
    // that hands out the trace.
    expect(rangeMigration).toContain("grant select on table public.hg_range_state to authenticated");
    expect(rangeMigration).not.toMatch(/grant (insert|update|all)[^;]*hg_range_state[^;]*authenticated/);
    expect(rangeMigration).toContain("revoke all on function public.hg_range_apply_coupon(uuid) from public, anon, authenticated");
    expect(rangeMigration).toContain("grant execute on function public.hg_range_apply_coupon(uuid) to service_role");
  });

  it("holds every range trace on the server and none in what the browser is handed", () => {
    const traces = [...rangeFunction.matchAll(/FLAG\{[a-z_]+\}/g)].map(match => match[0]);
    expect(traces.length).toBe(5);
    // The submitting function has to expect exactly what the range hands out, or a correct answer
    // is refused with no error anywhere.
    for (const trace of traces) expect(learningFunction).toContain(trace);
    // The console builds requests; it never knows an answer.
    expect(consoleSource).not.toMatch(/FLAG\{[a-z_]+\}/);
  });

  it("puts a request builder on the range nodes and pre-fills it with the ordinary values", () => {
    expect(stageSource).toContain('props.surface === "range"');
    expect(stageSource).toContain("<RangeConsole");
    const rangeNodes = blackTraceStages.filter(stage => stage.surface === "range");
    expect(rangeNodes.map(stage => stage.key)).toEqual([
      "someone-elses-order", "role-in-the-token", "up-one-level", "twice-at-once", "negative-quantity",
    ]);
    // Each node's console is keyed on the node, not the surface: all five share one surface, and
    // keying on it once gave ten nodes the same instrument.
    for (const stage of rangeNodes) expect(consoleSource).toContain(`"${stage.key}": {`);
    // The fields start at the correct, boring values, and nothing in the console says what to put
    // in them instead -- naming that is the answer.
    expect(consoleSource).toContain('initial: "1041"');
    expect(consoleSource).toContain('initial: "manual.txt"');
    expect(consoleSource).not.toMatch(/1042|\.\.\/|alg.{0,4}none|private\/credentials/);
  });

  it("prints the range reply as it arrived, status line and body, one field per line", () => {
    const refused = rangeReplyLines({ status: 403, body: { status: "forbidden" }, raw: '{"status":"forbidden","role":"viewer"}' }, "GET /vault");
    expect(refused[0]).toBe("> GET /vault");
    expect(refused[1]).toBe("[!] 403 REFUSED");
    // A single-line blob is unreadable in a narrow console column, so the body is broken up.
    expect(refused.length).toBeGreaterThan(3);
    expect(refused.join("\n")).toContain("viewer");
    const ok = rangeReplyLines({ status: 200, body: {}, raw: '{"status":"ok"}' }, "GET /orders");
    expect(ok[1]).toBe("> 200 OK");
    // An empty answer is reported rather than printed as a blank panel.
    expect(rangeReplyLines({ status: 204, body: {}, raw: "" }, "GET /x")).toContain("> (빈 응답)");
  });

  it("styles every class the range console renders", () => {
    // An instrument whose panel has no styles renders as unformatted text in the middle of the
    // node, which has happened once already. Each class the console names is checked for a rule.
    const used = new Set([...consoleSource.matchAll(/(?:className=`?"|\s)(bt-range[a-z_-]*)/g)].map(match => match[1]));
    expect(used.size).toBeGreaterThan(6);
    for (const className of used) expect(stageStyles).toContain(`.${className}`);
    // The reply panel scrolls rather than pushing the node screen out of shape.
    expect(stageStyles).toContain(".bt-range__reply pre{margin:0;max-height:200px;overflow:auto");
    // Hangul in the console's prose breaks between words, as everywhere else on the node screens.
    expect(stageStyles).toContain(".bt-range__idle{margin:0;color:#4e7d82;font:11px/1.7 \"IBM Plex Sans KR\"");
    expect(stageStyles).toMatch(/\.bt-range__idle\{[^}]*word-break:keep-all/);
  });

  it("gives the document node a way to find its target, since a filename cannot be guessed", () => {
    // Pre-filled with the manual, which lists its own folder; the notice in that folder names the
    // file in the folder beside it. Three steps, and the operator still has to work out the one
    // that matters. A node whose answer is an unguessable string is not a node.
    const docs = rangeFunction.slice(rangeFunction.indexOf("const documents"), rangeFunction.indexOf("const encoder"));
    expect(docs).toContain("현재 목록: manual.txt, notice.txt");
    expect(docs).toContain("private/credentials.txt 에서 관리합니다");
    // The private document is only reachable through the join, never by asking for it directly.
    expect(docs).not.toContain('"public/private/credentials.txt"');
    expect(rangeFunction).toContain('`public/${name}`.replace(/public\\/\\.\\.\\//g, "")');
  });

  it("requires the whole course for the certificate, in the newest migration that sets the count", () => {
    // The certificate once required a node count the course no longer had, because the requirement
    // is written in SQL and the course is written in TypeScript. The newest migration to name a
    // requirement is found here rather than by filename, so adding a chapter without raising it
    // fails this test instead of issuing a certificate early.
    const setsRequirement = migrations.filter(name =>
      readFileSync(new URL(name, migrationDir), "utf8").includes("v_required constant integer"));
    const newest = readFileSync(new URL(setsRequirement[setsRequirement.length - 1], migrationDir), "utf8");
    expect(newest).toContain(`v_required constant integer := ${blackTraceNodeCount}`);
    // The code is an opaque identifier, not a label: changing it would orphan every certificate
    // already issued.
    expect(newest).toContain("'black-trace-10-node-clearance'");
    expect(learningFunction).toContain(`const blackTraceNodeCount = ${blackTraceNodeCount}`);
  });
});
