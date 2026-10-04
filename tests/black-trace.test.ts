import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blackTraceNodeCount, blackTraceRanks, blackTraceTierStarts, blackTraceStageById, blackTraceStages, composeTrace, nextBlackTraceRank, traceLabels, vaultTraceSuffix } from "../shared/black-trace";
import { keyShapeProblem, submissionFailureLines } from "../client/src/pages/BlackTraceStage";
import { cipherBenches } from "../client/src/components/instruments/shared";

const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const directorySource = readFileSync(new URL("../client/src/pages/BlackTraceDirectory.tsx", import.meta.url), "utf8");
const recordsSource = readFileSync(new URL("../client/src/pages/Records.tsx", import.meta.url), "utf8");
const myPageSource = readFileSync(new URL("../client/src/pages/MyPage.tsx", import.meta.url), "utf8");
const traceFunction = readFileSync(new URL("../supabase/functions/black-trace/index.ts", import.meta.url), "utf8");
const learningFunction = readFileSync(new URL("../supabase/functions/learning/index.ts", import.meta.url), "utf8");
// Instruments live in one folder now: the families several nodes share, and the ones written for a
// single node's own subject.
const instrumentSource = readFileSync(new URL("../client/src/components/instruments/shared.tsx", import.meta.url), "utf8")
  + readFileSync(new URL("../client/src/components/instruments/bespoke.tsx", import.meta.url), "utf8");
// What the browser is handed for the node screen, screen and instruments together. A trace planted
// by an instrument has to be checked here, not in the screen that no longer holds it.
const clientSource = stageSource + instrumentSource;
const robots = readFileSync(new URL("../client/public/robots.txt", import.meta.url), "utf8");
const provisionMigration = readFileSync(new URL("../supabase/migrations/20260822000000_default_public_name.sql", import.meta.url), "utf8");

describe("OPERATION BLACK TRACE", () => {
  it("introduces each browser tool once and then reinforces it", () => {
    // Difficulty used to climb and fall: the URL node, the easiest of the ten, sat fifth, and the
    // redirect node, the hardest, sat before two easier ones. Three Elements nodes also ran back to
    // back. The order now walks address bar -> Elements -> Application -> address bar -> Network.
    expect(blackTraceStages.map(stage => stage.surface)).toEqual([
      "tooltip", "route", "comment", "field", "identity",
      // The off-screen node was dropped: it and the invisible-ink node before it taught the same
      // thing -- the element is in the document, the page just will not show it -- and only the CSS
      // differed. Six Elements nodes still cover six distinct places to hide something.
      "invisible-ink", "template-tag", "shadow-root", "cookie",
      "local-memory", "until-you-leave", "deeper-store", "robots", "sitemap", "source-map",
      "response", "header", "redirect",
      // The bridge out of watching requests and into making them. It reuses the header node's
      // mechanism so exactly one thing is new: this panel does not send anything.
      "console",
      ...Array.from({ length: 10 }, () => "request"),
      ...Array.from({ length: 10 }, () => "cipher"),
      ...Array.from({ length: 5 }, () => "range"),
      "render", "render", "query", "query", "query",
      "vault",
    ]);
    expect(blackTraceStages.map(stage => stage.id)).toEqual(Array.from({ length: blackTraceNodeCount }, (_, index) => index + 1));
    expect(blackTraceStages.map(stage => stage.code)).toEqual(
      Array.from({ length: blackTraceNodeCount }, (_, index) => `CASE #${String(index + 1).padStart(3, "0")}`));
    // A promotion means a kind of work is finished, so every tier boundary is the first node of a
    // chapter. Even quarters of the node count used to promote an operator mid-chapter -- once on
    // a chapter's last node -- which read as a counter rather than as progress.
    // Named outright rather than derived from where the surface changes: the first nineteen nodes
    // each carry their own surface, so that derivation called half the course a chapter start and
    // the check passed without meaning anything. The full surface sequence is pinned above, so a
    // reorder that moved a chapter boundary fails there; this pins the ladder to those boundaries.
    expect(blackTraceTierStarts.map(id => blackTraceStageById(id)?.surface)).toEqual([
      "tooltip",  // 브라우저가 가진 것을 읽는다
      "robots",   // 서버가 흘리는 것을 찾는다
      "cipher",   // 실려 있는 값을 읽어낸다
      "range",    // 실제 결함을 다룬다
    ]);
    // And the node before each promotion belongs to the previous chapter, so no tier opens mid-run.
    for (const start of blackTraceTierStarts.slice(1)) {
      expect(blackTraceStageById(start - 1)?.surface).not.toBe(blackTraceStageById(start)?.surface);
    }
    const [, infiltrator, fieldOperator, operator] = blackTraceTierStarts;
    expect(blackTraceStageById(infiltrator - 1)?.access).toBe("TRAINEE");
    expect(blackTraceStageById(infiltrator)?.access).toBe("INFILTRATOR");
    expect(blackTraceStageById(fieldOperator - 1)?.access).toBe("INFILTRATOR");
    expect(blackTraceStageById(fieldOperator)?.access).toBe("FIELD OPERATOR");
    expect(blackTraceStageById(operator - 1)?.access).toBe("FIELD OPERATOR");
    expect(blackTraceStageById(operator)?.access).toBe("OPERATOR");
    expect(blackTraceStageById(blackTraceNodeCount)?.access).toBe("OPERATOR");
    // The server reports the tier a submission earns, so its copy of the list has to match.
    expect(learningFunction).toContain(`const accessTierStarts = [${blackTraceTierStarts.join(", ")}]`);
    // Every node carries a key, and no two share one.
    expect(new Set(blackTraceStages.map(stage => stage.key)).size).toBe(blackTraceNodeCount);
  });

  it("never labels a signed-in operator GUEST", () => {
    // GUEST is reserved for a visitor without a session, so no stage and no progress response
    // may report it: the entry tier is TRAINEE.
    expect(blackTraceStages.map(stage => stage.access)).not.toContain("GUEST");
    expect(blackTraceStageById(1)?.access).toBe("TRAINEE");
    expect(blackTraceStageById(3)?.access).toBe("TRAINEE");
    expect(learningFunction).toContain('"TRAINEE", "INFILTRATOR", "FIELD OPERATOR", "OPERATOR"');
    expect(learningFunction).not.toContain('"GUEST"');
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
    expect(clientSource).toContain("deleted_record: ${trace}");
    expect(clientSource).toContain("trace_id=${trace}");
    expect(clientSource).toContain("data-note={trace}");
    expect(clientSource).toContain("data-fragment={trace}");
    expect(clientSource).toContain("legacy_note");
    // A readable answer in the client bundle would hand every visitor the whole operation.
    expect(clientSource).not.toMatch(/FLAG\{(?!_)[a-z]/);
  });

  it("derives a distinct trace per operator and keeps the stage 10 split intact", () => {
    // The label describes the surface, so it travels with the content when the order changes.
    // The trace derives from the node's key, so moving a node changes nobody's answer.
    expect(composeTrace("ghost-comment", null)).toBe("FLAG{ghost_in_the_source}");
    expect(composeTrace("ghost-comment", "a1b2c3")).toBe("FLAG{ghost_in_the_source_a1b2c3}");
    expect(composeTrace("ghost-comment", "a1b2c3")).not.toBe(composeTrace("ghost-comment", "d4e5f6"));
    expect(composeTrace("fragmented-key", "a1b2c3")).toBe("FLAG{two_places_a1b2c3_");
    expect(`${composeTrace("fragmented-key", "a1b2c3")}${vaultTraceSuffix}`).toBe("FLAG{two_places_a1b2c3_one_key}");
    // A node whose trace the channel issues plants nothing in the browser.
    expect(composeTrace("silent-response", "a1b2c3")).toBeNull();
  });

  it("keeps the client's planted labels and the server's channel flags on the same node numbers", () => {
    // The labels still key on the node number, so a reorder that moved the stages without moving
    // these would hand every operator the wrong expected value with no error anywhere.
    // Every node either plants a trace in the browser or is answered by the channel, never both
    // and never neither; the server has to agree about which.
    const serverTables = learningFunction.slice(learningFunction.indexOf("const nodeKeys"), learningFunction.indexOf("const traceSecret"));
    for (const stage of blackTraceStages) {
      expect(serverTables).toContain(`${stage.id}: "${stage.key}"`);
      const planted = composeTrace(stage.key, null);
      if (planted) {
        expect(serverTables).toContain(`"${stage.key}": "${traceLabels[stage.key]}"`.replace(/"([a-z]+)":/, (whole, bare) => stage.key === bare ? `${bare}:` : whole));
      } else {
        // A channel-issued node must plant nothing, or the browser would carry the answer.
        expect(serverTables).toMatch(new RegExp(`"?${stage.key}"?: "FLAG\\{`));
      }
    }
  });

  it("bridges watching requests and making them by changing exactly one thing", () => {
    // The largest single step in the course is from reading what the page fetched to shaping a
    // request yourself. This node keeps the header node's mechanism -- the trace rides a response
    // header, the body carries nothing -- so the only new act is sending the request at all.
    const bridge = blackTraceStages.find(stage => stage.key === "ask-it-yourself")!;
    const header = blackTraceStages.find(stage => stage.key === "server-whisper")!;
    const firstShaped = blackTraceStages.find(stage => stage.surface === "request")!;
    expect(bridge.id).toBeGreaterThan(header.id);
    expect(bridge.id).toBe(firstShaped.id - 1);
    // It is answered by the channel, so nothing it needs is readable in the bundle.
    expect(composeTrace(bridge.key, "a1b2c3")).toBeNull();
    expect(traceFunction).toContain('if (mode === "firsthand")');
    expect(traceFunction).toContain("FLAG{you_sent_that_one}");
    // The header has to survive the cross-origin read, or the node cannot be finished in a browser.
    expect(traceFunction).toMatch(/Access-Control-Expose-Headers[^\n]*X-Trace-Note/);

    // The panel refusing to act is the node. A send button anywhere in it would remove the lesson.
    expect(instrumentSource).toContain("export function AddressHandoff");
    const panel = instrumentSource.slice(instrumentSource.indexOf("export function AddressHandoff"));
    expect(panel).not.toMatch(/onRemote|fetch\(/);
    expect(panel).toContain("NO SEND BUTTON");
    // The address is handed over rather than left to be rebuilt from the node number.
    expect(stageSource).toContain('traceEndpoint(props.stageId, "firsthand")');
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

  it("looks every node table up by the node's name, never by its number", () => {
    // traceLabels, channelFlags and nodeKeys are keyed by name; only nodeKeys takes a number. One
    // call site asked traceLabels for a number, which is always undefined, so trace issuance
    // returned a null token for every node and returned before the progress gate below it ever
    // ran. With the secret set the browser then composed FLAG{label} while this function expected
    // FLAG{label_<token>}, and every planted node refused a correct answer. Nobody had reached a
    // planted node since, so nothing reported it.
    const byNumber = [...learningFunction.matchAll(/(traceLabels|channelFlags)\[\s*(\w+)\s*\]/g)]
      .filter(match => !/Key|key/.test(match[2]));
    expect(byNumber.map(match => match[0])).toEqual([]);
    // The surface action derives its token from the same key it validated, so the two cannot drift.
    const surface = learningFunction.slice(learningFunction.indexOf('action === "blackTraceSurface"'));
    expect(surface).toContain("const surfaceKey = nodeKeys[stage]");
    expect(surface).toContain("deriveTraceToken(user.id, surfaceKey)");
    // The gate has to be reachable: an early return above it would make it dead code.
    expect(surface.indexOf("firstOpenStage(completedStages)")).toBeLessThan(surface.indexOf("deriveTraceToken"));
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
      // The instrument is defined in the instruments folder and reached for by the node screen.
      expect(instrumentSource).toContain(`export function ${name}(`);
      expect(stageSource).toContain(`<${name} `);
    }
    // The shared scan machinery is gone, so a new node cannot quietly fall back to it.
    expect(stageSource).not.toContain("ScanReadout");
    expect(stageSource).not.toContain("renderScene");
  });

  it("closes every node with its own verdict", () => {
    expect(new Set(blackTraceStages.map(stage => stage.scan.verdict)).size).toBe(blackTraceNodeCount);
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
      expect(clientSource).toContain(marker);
    }
    // Values are masked on screen; the operator reads them out of the browser, not out of the page.
    expect(clientSource).toContain("████████");
    // The planted traces stay discoverable exactly where each node hides them.
    expect(clientSource).toContain("data-fragment={trace}");
    expect(clientSource).toContain("data-note={trace}");
    // The hidden field carries the trace as DOM property state, never as a value attribute. As an
    // attribute it sat in the markup in plain sight and the node became the same action as the one
    // after it — read an attribute in Elements — instead of un-hiding the field.
    // On a type="hidden" input the value property reflects the content attribute, so assigning it
    // put the trace straight back into the markup. A text input hidden by the hidden attribute
    // keeps the value as separate DOM state.
    expect(clientSource).toContain('<input type="text" hidden readOnly tabIndex={-1} aria-hidden="true" name="legacy_note" ref={carrier} />');
    expect(stageSource).not.toContain('type="hidden" name="legacy_note"');
    expect(clientSource).toContain("carrier.current.value = trace");
    expect(clientSource).toContain("deleted_record: ${trace}");
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
    // The ladder scales with the course: four tiers across however many nodes it holds.
    const [, infiltrator, fieldOperator, operator] = blackTraceTierStarts;
    expect(nextBlackTraceRank(1)?.name).toBe("INFILTRATOR");
    expect(nextBlackTraceRank(infiltrator)?.name).toBe("FIELD OPERATOR");
    expect(nextBlackTraceRank(fieldOperator)?.name).toBe("OPERATOR");
    expect(nextBlackTraceRank(operator)).toBeNull();
    expect(nextBlackTraceRank(blackTraceNodeCount)).toBeNull();
    // The ladder the board shows and the tier a node carries come from the same boundary, so a
    // node that opens a tier is the node the board named as next.
    for (const rank of blackTraceRanks) {
      expect(blackTraceStageById(rank.at)?.access).toBe(rank.name);
      if (rank.at > 1) expect(blackTraceStageById(rank.at - 1)?.access).not.toBe(rank.name);
    }
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
    // The count comes from the course, so the page may not spell a number of its own.
    expect(myPageSource).toContain("{blackTraceNodeCount}");
    expect(myPageSource).not.toContain("/10");
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

describe("chapter three: requests the operator shapes", () => {
  it("answers the channel by mode and never by node number", () => {
    // Ten nodes were added without touching a number anywhere in this function.
    for (const mode of ["method", "cookie", "role", "referer", "etag", "range", "preflight", "ack", "export", "dispatch"]) {
      expect(traceFunction).toContain(`mode === "${mode}"`);
    }
    expect(traceFunction).not.toMatch(/stage === \d/);
  });

  it("only uses request headers a browser script is allowed to set", () => {
    // User-Agent and Referer are forbidden header names for fetch, so a node whose answer depended
    // on the script setting one would be unsolvable in the browser this course is taught in.
    const rig = instrumentSource.slice(instrumentSource.indexOf("const rigs"), instrumentSource.indexOf("export function RequestRig"));
    expect(rig).not.toContain("user-agent");
    expect(traceFunction).not.toContain('request.headers.get("user-agent")');
    // Headers that are not safelisted have to be allowed through, and header answers exposed.
    expect(traceFunction).toContain("range, x-client-role");
    expect(traceFunction).toContain("Access-Control-Expose-Headers");
  });

  it("lets its own preflight reach the handler", () => {
    // The generic OPTIONS short-circuit would otherwise swallow the node whose subject it is.
    expect(traceFunction).toContain('request.method === "OPTIONS" && url.searchParams.get("mode") !== "preflight"');
  });

  it("gives the shared rig the node it stands in, not the panel", () => {
    // All ten carry the surface "request", so a rig keyed on surface would find no config at all.
    expect(blackTraceStages.filter(stage => stage.surface === "request")).toHaveLength(10);
    expect(stageSource).toContain('props.surface === "request"');
    expect(stageSource).toContain("nodeKey={stage.key}");
    expect(instrumentSource).toContain("const config = rigs[nodeKey]");
  });
});

describe("chapter four: values that must be read first", () => {
  const b64url = (value: string) => Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const rot13 = (text: string) => text.replace(/[a-zA-Z]/g, letter => {
    const base = letter <= "Z" ? 65 : 97;
    return String.fromCharCode(((letter.charCodeAt(0) - base + 13) % 26) + base);
  });
  // How an operator undoes each one. If any of these stops matching, that node cannot be solved.
  const decoders: Record<string, (value: string) => string> = {
    "plain-sight": value => Buffer.from(value, "base64").toString("utf8"),
    "bytes-as-text": value => Buffer.from(value, "hex").toString("utf8"),
    "percent-signs": value => decodeURIComponent(value),
    shifted: value => rot13(value),
    "one-byte-key": value => Buffer.from(Buffer.from(value, "hex").map(byte => byte ^ 0x2a)).toString("utf8"),
    "two-alphabets": value => b64url(value).subarray(0, -3).toString("utf8"),
    "three-parts": value => JSON.parse(b64url(value.split(".")[1]).toString("utf8")).note,
    "no-signature": value => b64url(value.split(".")[2]).toString("utf8"),
    "wrapped-twice": value => decodeURIComponent(Buffer.from(value, "base64").toString("utf8")),
    "layer-by-layer": value => rot13(Buffer.from(Buffer.from(value, "hex").toString("utf8"), "base64").toString("utf8")),
  };

  const traces = ["FLAG{encoding_is_not_a_lock_a1b2c3d4e5f6}", "FLAG{the_other_alphabet_0f9e8d7c6b5a}"];

  it("every node's value reverses to exactly the trace the server expects", () => {
    expect(Object.keys(cipherBenches).sort()).toEqual(Object.keys(decoders).sort());
    for (const trace of traces) {
      for (const [key, bench] of Object.entries(cipherBenches)) {
        expect(decoders[key]((bench as any).encode(trace)), key).toBe(trace);
      }
    }
  });

  it("never shows the trace in plain form", () => {
    // Percent-encoding only escapes the braces, which left the whole label readable and the node
    // with nothing to solve; every byte is escaped instead.
    for (const trace of traces) {
      const inner = trace.slice(5, -1);
      for (const [key, bench] of Object.entries(cipherBenches)) {
        expect((bench as any).encode(trace).includes(inner), key).toBe(false);
      }
    }
  });

  it("makes the variant-alphabet node actually use the variant alphabet", () => {
    // Base64 of plain ASCII essentially never reaches the two characters that differ, so without a
    // non-text tail this node encoded identically to the plain-base64 one.
    for (const trace of traces) {
      expect((cipherBenches as any)["two-alphabets"].encode(trace)).toMatch(/[-_]/);
      expect((cipherBenches as any)["two-alphabets"].encode(trace))
        .not.toBe((cipherBenches as any)["plain-sight"].encode(trace));
    }
  });

  it("derives per operator, so the bundle carries encoders and never a value", () => {
    for (const [key, bench] of Object.entries(cipherBenches)) {
      expect((bench as any).encode(traces[0]), key).not.toBe((bench as any).encode(traces[1]));
    }
    expect(blackTraceStages.filter(stage => stage.surface === "cipher")).toHaveLength(10);
    expect(stageSource).toContain('props.surface === "cipher"');
  });
});
