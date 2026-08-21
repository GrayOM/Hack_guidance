import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceStageById, blackTraceStages } from "../shared/black-trace";

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

  it("places the intended beginner traces in DOM, cookie, URL, response, header, and robots surfaces", () => {
    expect(stageSource).toContain("deleted_record: FLAG{ghost_in_the_source}");
    expect(stageSource).toContain("legacy_note");
    expect(stageSource).toContain("data-note=\"FLAG{attributes_tell_more}\"");
    expect(stageSource).toContain("trace_id=FLAG{cookies_leave_traces}");
    expect(stageSource).toContain("FLAG%7Bread_the_address%7D");
    expect(traceFunction).toContain("FLAG{the_server_did_answer}");
    expect(traceFunction).toContain("FLAG%7Bfollow_the_location%7D");
    expect(traceFunction).toContain("X-Trace-Note");
    expect(robots).toContain("FLAG{robots_know_the_way}");
  });

  it("keeps flag submission and sequential progress validation on the learning edge function", () => {
    expect(learningFunction).toContain('action === "blackTraceSubmit"');
    expect(learningFunction).toContain('action === "blackTraceProgress"');
    expect(learningFunction).toContain("stage > firstOpen");
    expect(learningFunction).toContain("FLAG{two_places_one_key}");
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
