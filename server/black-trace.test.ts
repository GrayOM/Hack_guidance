import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceStageById, blackTraceStages, composeTrace, vaultTraceSuffix } from "../shared/black-trace";

const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const directorySource = readFileSync(new URL("../client/src/pages/BlackTraceDirectory.tsx", import.meta.url), "utf8");
const recordsSource = readFileSync(new URL("../client/src/pages/Records.tsx", import.meta.url), "utf8");
const myPageSource = readFileSync(new URL("../client/src/pages/MyPage.tsx", import.meta.url), "utf8");
const traceFunction = readFileSync(new URL("../supabase/functions/black-trace/index.ts", import.meta.url), "utf8");
const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");

describe("OPERATION BLACK TRACE", () => {
  it("defines ten progressive browser-inspection stages with the requested access levels", () => {
    expect(blackTraceStages).toHaveLength(10);
    expect(blackTraceStageById(1)?.title).toBe("Ghost Comment");
    expect(blackTraceStageById(4)?.access).toBe("ANALYST");
    expect(blackTraceStageById(7)?.access).toBe("FIELD OPERATOR");
    expect(blackTraceStageById(10)?.access).toBe("OPERATOR");
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
