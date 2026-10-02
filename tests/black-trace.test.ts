import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceStageById, blackTraceStages, composeTrace, nextBlackTraceRank, vaultTraceSuffix } from "../shared/black-trace";
import { keyShapeProblem, submissionFailureLines } from "../client/src/pages/BlackTraceStage";

const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const directorySource = readFileSync(new URL("../client/src/pages/BlackTraceDirectory.tsx", import.meta.url), "utf8");
const recordsSource = readFileSync(new URL("../client/src/pages/Records.tsx", import.meta.url), "utf8");
const myPageSource = readFileSync(new URL("../client/src/pages/MyPage.tsx", import.meta.url), "utf8");
const traceFunction = readFileSync(new URL("../supabase/functions/black-trace/index.ts", import.meta.url), "utf8");
const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");
const provisionMigration = readFileSync(new URL("../supabase/migrations/20260822000000_default_public_name.sql", import.meta.url), "utf8");

describe("OPERATION BLACK TRACE", () => {
  it("introduces each browser tool once and then reinforces it", () => {
    // Difficulty used to climb and fall: the URL node, the easiest of the ten, sat fifth, and the
    // redirect node, the hardest, sat before two easier ones. Three Elements nodes also ran back to
    // back. The order now walks address bar -> Elements -> Application -> address bar -> Network.
    expect(blackTraceStages.map(stage => stage.surface)).toEqual([
      "route", "comment", "field", "identity", "cookie", "robots", "response", "header", "redirect", "vault",
    ]);
    expect(blackTraceStages.map(stage => stage.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(blackTraceStages.map(stage => stage.code)).toEqual(
      Array.from({ length: 10 }, (_, index) => `CASE #${String(index + 1).padStart(3, "0")}`));
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
    // The label describes the surface, so it travels with the content when the order changes.
    const comment = blackTraceStages.find(stage => stage.surface === "comment")!.id;
    expect(composeTrace(comment, null)).toBe("FLAG{ghost_in_the_source}");
    expect(composeTrace(comment, "a1b2c3")).toBe("FLAG{ghost_in_the_source_a1b2c3}");
    expect(composeTrace(comment, "a1b2c3")).not.toBe(composeTrace(comment, "d4e5f6"));
    expect(composeTrace(10, "a1b2c3")).toBe("FLAG{two_places_a1b2c3_");
    expect(`${composeTrace(10, "a1b2c3")}${vaultTraceSuffix}`).toBe("FLAG{two_places_a1b2c3_one_key}");
    // A node whose trace the channel issues plants nothing in the browser.
    const response = blackTraceStages.find(stage => stage.surface === "response")!.id;
    expect(composeTrace(response, "a1b2c3")).toBeNull();
  });

  it("keeps the client's planted labels and the server's channel flags on the same node numbers", () => {
    // The labels still key on the node number, so a reorder that moved the stages without moving
    // these would hand every operator the wrong expected value with no error anywhere.
    const planted = ["route", "comment", "field", "identity", "cookie", "vault"];
    for (const stage of blackTraceStages) {
      const label = composeTrace(stage.id, null);
      if (planted.includes(stage.surface)) {
        expect(label).not.toBeNull();
      } else {
        // A channel-issued node must plant nothing, or the browser would carry the answer.
        expect(label).toBeNull();
        expect(learningFunction).toMatch(new RegExp(`${stage.id}: "FLAG\\{`));
      }
    }
    // The server recomputes from its own copy of the table, so the two copies must agree.
    const serverLabels = learningFunction.slice(learningFunction.indexOf("const traceLabels"), learningFunction.indexOf("const vaultTraceSuffix"));
    for (const stage of blackTraceStages.filter(row => planted.includes(row.surface))) {
      const label = composeTrace(stage.id, null)!.replace("FLAG{", "").replace("}", "").replace(/_$/, "");
      expect(serverLabels).toContain(`${stage.id}: "${label}"`);
    }
  });

  it("answers the trace channel by surface, not by node number", () => {
    // Keying on the number meant reordering the operation broke every remote node until this
    // function was redeployed in step with it.
    expect(traceFunction).toContain('if (mode === "response")');
    expect(traceFunction).toContain('if (mode === "redirect")');
    expect(traceFunction).toContain('if (mode === "header")');
    expect(traceFunction).toContain('if (mode === "vault")');
    expect(traceFunction).not.toMatch(/stage === \d/);
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

  it("operates every node with its own instrument rather than one shared button", () => {
    // Ten nodes sharing one button, one console and one readout made the operation read as a
    // single screen with ten captions. Each surface now has the instrument its subject calls for.
    expect(blackTraceStages.every(stage => (stage.actionLabel ?? "").length > 0)).toBe(true);
    for (const name of ["RecordRestore", "FormPayload", "IdentityCard", "StorageProbe", "RelayRoute", "TransferGauge", "HopTrace", "HeaderList", "CrawlerDialog", "VaultAssembly"]) {
      expect(stageSource).toContain(`function ${name}(`);
      expect(stageSource).toContain(`<${name} `);
    }
    // The shared scan machinery is gone, so a new node cannot quietly fall back to it.
    expect(stageSource).not.toContain("ScanReadout");
    expect(stageSource).not.toContain("renderScene");
  });

  it("closes every node with its own verdict", () => {
    expect(new Set(blackTraceStages.map(stage => stage.scan.verdict)).size).toBe(10);
    // The verdict belongs to the surface, so it is looked up by surface and survives a reorder.
    const verdictFor = (surface: string) => blackTraceStages.find(stage => stage.surface === surface)?.scan.verdict;
    expect(verdictFor("field")).toBe("AUTH REJECTED");
    expect(verdictFor("robots")).toBe("POLICY NOT RENDERED");
    expect(stageSource).toContain("bt-scene__verdict");
  });

  it("shows the discrepancy without ever printing the trace", () => {
    // Each instrument proves something is missing: a block that never draws, a payload with one
    // entry more than the form, a store that kept a key, a slot with no source on this page.
    for (const marker of ["NOT RENDERED", "OUTGOING PAYLOAD", "unlabeled", "surviving key", "carried with the move", "rendered: 0 bytes", "headers not rendered here", "x-????????", "served to screen", "SLOT 01"]) {
      expect(stageSource).toContain(marker);
    }
    // Values are masked on screen; the operator reads them out of the browser, not out of the page.
    expect(stageSource).toContain("████████");
    // The planted traces stay discoverable exactly where each node hides them.
    expect(stageSource).toContain("data-fragment={trace}");
    expect(stageSource).toContain("data-note={trace}");
    // The hidden field carries the trace as DOM property state, never as a value attribute. As an
    // attribute it sat in the markup in plain sight and the node became the same action as the one
    // after it — read an attribute in Elements — instead of un-hiding the field.
    // On a type="hidden" input the value property reflects the content attribute, so assigning it
    // put the trace straight back into the markup. A text input hidden by the hidden attribute
    // keeps the value as separate DOM state.
    expect(stageSource).toContain('<input type="text" hidden readOnly tabIndex={-1} aria-hidden="true" name="legacy_note" ref={carrier} />');
    expect(stageSource).not.toContain('type="hidden" name="legacy_note"');
    expect(stageSource).toContain("carrier.current.value = trace");
    expect(stageSource).toContain("deleted_record: ${trace}");
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

describe("korean setting", () => {
  it("never repeats a line between nodes", () => {
    // Nodes 06 and 08 both ended on "화면에 전달된 정보는 거의 없다", and node 09's intel restated
    // its own narrative, which made the operation read as one scene written ten times.
    const narratives = blackTraceStages.map(stage => stage.narrative);
    expect(new Set(narratives).size).toBe(narratives.length);
    const intel = blackTraceStages.map(stage => stage.intel);
    expect(new Set(intel).size).toBe(intel.length);
    for (const stage of blackTraceStages) {
      const shared = stage.intel.split(" ").filter(word => word.length > 3 && stage.narrative.includes(word));
      expect(shared).toHaveLength(0);
    }
  });

  it("keeps one voice across the nodes", () => {
    // A mix of report ("~했다") and command ("~하라", "~마라") was most of what read as stiff.
    for (const stage of blackTraceStages) {
      expect(stage.intel).not.toMatch(/(보라|마라|하라|해라|보세요|하세요)[.。]?$/);
      expect(stage.narrative).toMatch(/다[.]$/);
    }
  });

  it("lets Korean break between words and nowhere else", () => {
    const styles = readFileSync(new URL("../client/src/pages/black-trace.css", import.meta.url), "utf8");
    // anywhere also shrinks min-content, which is what collapsed the heading to a few glyphs a line.
    expect(styles).not.toContain("overflow-wrap:anywhere");
    expect(styles).toContain("word-break:keep-all");
    expect(styles).toContain("text-wrap:balance");
    expect(styles).toContain("text-wrap:pretty");
  });
});

describe("teaching the operator", () => {
  it("tells the operator why the thing they found is a defect, and only after they find it", () => {
    // The flag is the game; this is the point of the game. Withheld until the clear so it can be
    // direct without ever working as a hint.
    for (const stage of blackTraceStages) {
      expect(stage.lesson.risk.length).toBeGreaterThan(30);
      expect(stage.lesson.fix.length).toBeGreaterThan(15);
    }
    expect(new Set(blackTraceStages.map(stage => stage.lesson.risk)).size).toBe(blackTraceStages.length);
    expect(stageSource).toContain("lesson={stage.lesson}");
    // It renders on the cleared panel, never beside the field kit.
    const beforeClear = stageSource.slice(0, stageSource.indexOf("function NodeCleared"));
    expect(beforeClear).not.toContain("lesson.risk");
  });

  it("names the browser's own tools once, and no node's answer", () => {
    // Most visitors have built a page and never opened the Network panel, so node 06 was a wall.
    expect(directorySource).toContain("function FieldBriefing");
    expect(directorySource).toContain("<FieldBriefing");
    for (const panel of ["Elements", "Network", "Application", "F12"]) {
      expect(directorySource).toContain(panel);
    }
    // Knowing a response has headers is not knowing which header: the briefing stops there.
    const briefing = directorySource.slice(directorySource.indexOf("function FieldBriefing"));
    for (const giveaway of ["robots.txt", "data-", "hidden", "FLAG{", "trace_id"]) {
      expect(briefing).not.toContain(giveaway);
    }
  });

  it("separates a malformed key from a wrong one", () => {
    // Every refusal used to print "INVALID ACCESS KEY", so a stray space and a wrong value looked
    // identical. The shape is judged before a submission slot is spent on it.
    expect(stageSource).toContain("function keyShapeProblem");
    // A well-formed key is passed through; everything the operator is likely to paste wrong is named.
    expect(keyShapeProblem("FLAG{ghost_in_the_source_a1b2c3}")).toBeNull();
    expect(keyShapeProblem("FLAG{ghost} ")).toContain("공백");
    expect(keyShapeProblem("ghost_in_the_source")).toContain("FLAG{");
    expect(keyShapeProblem("FLAG{ghost_in_the_source")).toContain("}");
    expect(keyShapeProblem("FLAG{a}")).toContain("짧");
    // The four server refusals each get their own line.
    expect(submissionFailureLines(Object.assign(new Error("slow down"), { reason: "rate_limited" }))[0]).toContain("THROTTLED");
    expect(submissionFailureLines(new Error("Clear the previous node first"))[0]).toContain("LOCKED");
    expect(submissionFailureLines(new Error("Unknown operation node"))[0]).toContain("UNKNOWN");
    expect(submissionFailureLines(new Error("boom"))[0]).toContain("CHANNEL UNAVAILABLE");
    expect(stageSource).toContain("KEY REJECTED BEFORE TRANSMISSION");
    expect(stageSource).toContain("function submissionFailureLines");
    for (const outcome of ["SUBMISSION THROTTLED", "NODE LOCKED", "CHANNEL UNAVAILABLE"]) {
      expect(stageSource).toContain(outcome);
    }
  });
});

