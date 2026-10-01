import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceStageById, blackTraceStages, composeTrace, nextBlackTraceRank, vaultTraceSuffix } from "../shared/black-trace";

const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const directorySource = readFileSync(new URL("../client/src/pages/BlackTraceDirectory.tsx", import.meta.url), "utf8");
const recordsSource = readFileSync(new URL("../client/src/pages/Records.tsx", import.meta.url), "utf8");
const myPageSource = readFileSync(new URL("../client/src/pages/MyPage.tsx", import.meta.url), "utf8");
const traceFunction = readFileSync(new URL("../supabase/functions/black-trace/index.ts", import.meta.url), "utf8");
const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");
const provisionMigration = readFileSync(new URL("../supabase/migrations/20260822000000_default_public_name.sql", import.meta.url), "utf8");

describe("OPERATION BLACK TRACE", () => {
  it("defines ten progressive browser-inspection stages with the requested access levels", () => {
    expect(blackTraceStages).toHaveLength(10);
    expect(blackTraceStageById(1)?.title).toBe("Ghost Comment");
    expect(blackTraceStageById(4)?.access).toBe("ANALYST");
    expect(blackTraceStageById(7)?.access).toBe("FIELD OPERATOR");
    expect(blackTraceStageById(10)?.access).toBe("OPERATOR");
  });

  it("never labels a signed-in operator GUEST", () => {
    // GUEST is reserved for a visitor without a session, so no stage and no progress response
    // may report it: the entry tier is TRAINEE.
    expect(blackTraceStages.map(stage => stage.access)).not.toContain("GUEST");
    expect(blackTraceStageById(1)?.access).toBe("TRAINEE");
    expect(blackTraceStageById(3)?.access).toBe("TRAINEE");
    expect(learningFunction).toContain('return "TRAINEE"');
    expect(learningFunction).not.toContain('return "GUEST"');
  });

  it("provisions a profile for an account without name metadata and flags it for renaming", () => {
    expect(provisionMigration).toContain("hg_sanitize_display_name");
    // A confirmed account is never turned away for missing name metadata.
    expect(provisionMigration).not.toContain("A valid public name is required");
    expect(provisionMigration).toContain("errcode = '42501'");
    expect(learningFunction).toContain("namePending: !displayNamePattern.test(metadataName)");
    expect(learningFunction).toContain('reason = code === "42501"');
  });

  it("plants the browser traces through the per-operator surface instead of a bundled constant", () => {
    expect(stageSource).toContain("useBlackTraceSurface");
    expect(stageSource).toContain("deleted_record: ${trace}");
    expect(stageSource).toContain("trace_id=${trace}");
    expect(stageSource).toContain("data-note={trace}");
    expect(stageSource).toContain("data-fragment={trace}");
    expect(stageSource).toContain("legacy_note");
    // A readable answer in the client bundle would hand every visitor the whole operation.
    expect(stageSource).not.toMatch(/FLAG\{(?!_)[a-z]/);
  });

  it("derives a distinct trace per operator and keeps the stage 10 split intact", () => {
    expect(composeTrace(1, null)).toBe("FLAG{ghost_in_the_source}");
    expect(composeTrace(1, "a1b2c3")).toBe("FLAG{ghost_in_the_source_a1b2c3}");
    expect(composeTrace(1, "a1b2c3")).not.toBe(composeTrace(1, "d4e5f6"));
    expect(composeTrace(10, "a1b2c3")).toBe("FLAG{two_places_a1b2c3_");
    expect(`${composeTrace(10, "a1b2c3")}${vaultTraceSuffix}`).toBe("FLAG{two_places_a1b2c3_one_key}");
    expect(composeTrace(6, "a1b2c3")).toBeNull();
  });

  it("keeps the channel-issued traces on the request surfaces", () => {
    expect(traceFunction).toContain("FLAG{the_server_did_answer}");
    expect(traceFunction).toContain("FLAG%7Bfollow_the_location%7D");
    expect(traceFunction).toContain("X-Trace-Note");
    expect(robots).toContain("FLAG{robots_know_the_way}");
  });

  it("keeps flag submission, trace issuance, and sequential progress validation on the learning edge function", () => {
    expect(learningFunction).toContain('action === "blackTraceSubmit"');
    expect(learningFunction).toContain('action === "blackTraceProgress"');
    expect(learningFunction).toContain('action === "blackTraceSurface"');
    expect(learningFunction).toContain("stage > firstOpen");
    expect(learningFunction).toContain("BLACK_TRACE_SECRET");
    expect(learningFunction).toContain("deriveTraceToken");
    // A trace is never issued for a node the operator has not reached.
    expect(learningFunction).toContain("firstOpenStage(completedStages)");
    expect(learningFunction).toContain("expectedTrace(user.id, stage)");
  });

  it("bounds flag submission with the per-minute ledger that already existed in the database", () => {
    expect(learningFunction).toContain("hg_consume_submission_slot");
    expect(learningFunction).toContain("allowSubmission(service, user.id)");
    expect(learningFunction).toContain('reason: "rate_limited"');
    // A limiter outage must not lock an honest operator out of submitting.
    expect(learningFunction).toContain("submission rate limit unavailable");
    // The slot is consumed before any other work, so malformed attempts are bounded too.
    const submitBranch = learningFunction.slice(learningFunction.indexOf('action === "blackTraceSubmit"'));
    expect(submitBranch.indexOf("allowSubmission")).toBeGreaterThan(-1);
    expect(submitBranch.indexOf("allowSubmission")).toBeLessThan(submitBranch.indexOf("expectedTrace"));
    // The operator sees why the submission was refused instead of a fixed session message.
    expect(stageSource).toContain("error instanceof Error && error.message");
  });

  it("answers only the operation's own origins instead of any site", () => {
    for (const source of [learningFunction, traceFunction]) {
      // "*" let any page call these endpoints with a visitor's bearer token.
      expect(source).not.toContain('"Access-Control-Allow-Origin": "*"');
      expect(source).not.toContain('?? "*"');
      expect(source).toContain("allowedOrigins");
      expect(source).toContain("https://grayom.github.io");
      expect(source).toContain('Vary: "Origin"');
      // The header set is built per request, so the reflected origin cannot be shared.
      expect(source).toContain("corsHeadersFor(request");
    }
  });

  it("gives every node an action and a scan that matches its own subject", () => {
    // Nodes 01~04 and 09 had a button that returned without doing anything, and 03 and 09 had
    // no button at all, so inspecting them produced no visible consequence whatsoever.
    expect(blackTraceStages.every(stage => (stage.actionLabel ?? "").length > 0)).toBe(true);
    expect(blackTraceStages.every(stage => stage.scan.lines.length >= 2 && stage.scan.verdict.length > 0)).toBe(true);
    // Each node reports in its own terms rather than a shared generic sweep.
    expect(new Set(blackTraceStages.map(stage => stage.scan.verdict)).size).toBe(10);
    expect(blackTraceStageById(2)?.scan.verdict).toBe("AUTH REJECTED");
    expect(blackTraceStageById(4)?.scan.verdict).toBe("SESSION ENDED");
    expect(blackTraceStageById(9)?.scan.verdict).toBe("POLICY NOT RENDERED");
    expect(stageSource).toContain("stage.scan.lines");
    expect(stageSource).toContain("bt-scene__verdict");
  });

  it("prints evidence into the scene whose counts do not add up", () => {
    // A scan that only writes to the console leaves the scene an empty rectangle. The readout is
    // what the operator actually sees come out of the action.
    expect(blackTraceStages.every(stage => stage.scan.reveal.rows.length >= 2)).toBe(true);
    expect(new Set(blackTraceStages.map(stage => stage.scan.reveal.title)).size).toBe(10);
    expect(blackTraceStageById(1)?.scan.reveal.rows).toContainEqual(["comment nodes", "1"]);
    expect(blackTraceStageById(1)?.scan.reveal.note).toContain("3개만");
    // The readout never carries the trace itself, only the discrepancy that points at it.
    for (const stage of blackTraceStages) {
      const printed = JSON.stringify(stage.scan.reveal);
      expect(printed).not.toContain("FLAG");
      expect(printed).not.toMatch(/F12|개발자도구|Elements|Network|Application/);
    }
    expect(stageSource).toContain("ScanReadout");
    // The injected comment lives on its own node so React never reconciles around it.
    expect(stageSource).toContain('ref={commentAnchor} className="bt-scene__anchor"');
  });

  it("keeps intel suggestive and opt-in rather than naming the tool", () => {
    expect(blackTraceStages.every(stage => stage.intel.length > 0)).toBe(true);
    // Naming the tool outright removes the puzzle, so the intel never does.
    for (const stage of blackTraceStages) {
      expect(stage.intel).not.toMatch(/F12|개발자도구|Elements|Network|Application|robots\.txt/);
    }
    // It is read only when the operator asks, and opening it is recorded.
    expect(stageSource).toContain("OPEN FIELD KIT");
    expect(stageSource).toContain("hintCount: intelOpen ? 1 : 0");
    expect(stageSource).not.toContain("INTEL {hintCount}");
  });

  it("shows progression: what the next node unlocks, and that a node was recovered", () => {
    expect(nextBlackTraceRank(1)?.name).toBe("ANALYST");
    expect(nextBlackTraceRank(4)?.name).toBe("FIELD OPERATOR");
    expect(nextBlackTraceRank(7)?.name).toBe("OPERATOR");
    expect(nextBlackTraceRank(10)).toBeNull();
    expect(directorySource).toContain("다음 등급");
    // Recovering a node is the only reward, so it is shown rather than only logged.
    expect(stageSource).toContain("NodeCleared");
    expect(stageSource).toContain("bt-cleared");
  });

  it("keeps the main console navigation on the operation board only", () => {
    expect(directorySource).toContain('import { ConsoleNav } from "@/components/ConsoleNav"');
    expect(directorySource).toContain("<ConsoleNav />");
    expect(stageSource).not.toContain("ConsoleNav");
  });

  it("uses BLACK TRACE progress as the source for public ranking and private records", () => {
    expect(learningFunction).toContain('service.from("hg_profiles").select("id, display_name")');
    expect(learningFunction).toContain('service.from("hg_black_trace_progress").select("user_id, completed_at")');
    expect(learningFunction).toContain('if (action === "records")');
    expect(recordsSource).toContain("useLearningRecords");
    expect(recordsSource).toContain("NODES RECOVERED");
    expect(myPageSource).toContain("OPERATION SUMMARY");
    expect(myPageSource).toContain("/10");
  });
});
