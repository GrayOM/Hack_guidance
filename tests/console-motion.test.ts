import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCurrentRankingPosition, getRankingFingerprint, getRankingStreamEvent } from "../client/src/lib/ranking-feedback";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const rankingSource = readFileSync(new URL("../client/src/pages/Ranking.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");
const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const stageStyles = readFileSync(new URL("../client/src/pages/black-trace.css", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

describe("event-driven console feedback", () => {
  it("keeps main-console ambient pointer response without retired challenge workspace dependencies", () => {
    expect(appSource).toContain("PointerAmbient");
    expect(appSource).not.toContain("ConsoleMotion");
    expect(styles).toContain(".pointer-ambient");
    // The signal-lock overlay had no consumer and was removed with its helper and styles.
    expect(styles).not.toContain(".signal-lock");
    expect(appSource).not.toContain("SignalLockOverlay");
    expect(styles).not.toContain("pointer-ambient__reticle");
    expect(styles).not.toContain("POINTER LINK");
  });

  it("refreshes public ranking data and renders a temporary stream on changes", () => {
    expect(rankingSource).toContain("refetchInterval: 15_000");
    expect(rankingSource).toContain("ranking-stream");
    expect(rankingSource).toContain("my-rank-signal");
    expect(rankingSource).toContain('aria-label="내 순위"');
    expect(rankingSource).toContain("ranking-row__current-label");
    expect(rankingSource).toContain("RANK");
    expect(styles).toContain("ranking-data-rain");
    expect(styles).toContain(".my-rank-signal");
    expect(styles).toContain(".ranking-row__current-label");
    expect(styles).toContain("@media (max-width: 639px), (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)");
  });

  it("creates stream events only when ranking data changes and identifies user rank movement", () => {
    const previous = getRankingFingerprint([
      { userId: 10, solvedCount: 4, lastSolvedAt: "2026-08-18T00:00:00.000Z" },
      { userId: 20, solvedCount: 3, lastSolvedAt: "2026-08-18T00:01:00.000Z" },
    ], 20);
    const unchanged = getRankingFingerprint([
      { userId: 10, solvedCount: 4, lastSolvedAt: "2026-08-18T00:00:00.000Z" },
      { userId: 20, solvedCount: 3, lastSolvedAt: "2026-08-18T00:01:00.000Z" },
    ], 20);
    const movedUp = getRankingFingerprint([
      { userId: 20, solvedCount: 5, lastSolvedAt: "2026-08-18T00:02:00.000Z" },
      { userId: 10, solvedCount: 4, lastSolvedAt: "2026-08-18T00:00:00.000Z" },
    ], 20);
    const refreshed = getRankingFingerprint([
      { userId: 10, solvedCount: 4, lastSolvedAt: "2026-08-18T00:00:00.000Z" },
      { userId: 20, solvedCount: 3, lastSolvedAt: "2026-08-18T00:03:00.000Z" },
    ], 20);

    expect(getRankingStreamEvent(previous, unchanged)).toBeNull();
    expect(getRankingStreamEvent(previous, movedUp)).toMatchObject({ kind: "rank-change", message: "RANK UPLINK // 02 → 01" });
    expect(getRankingStreamEvent(previous, refreshed)).toMatchObject({ kind: "refresh" });
  });

  it("finds only the logged-in user's server-ordered ranking position", () => {
    const tiedRows = [
      { userId: "alpha", solvedCount: 4, lastSolvedAt: "2026-08-18T00:00:00.000Z" },
      { userId: "current", solvedCount: 4, lastSolvedAt: "2026-08-18T00:01:00.000Z" },
    ];

    expect(getCurrentRankingPosition(tiedRows)).toBeNull();
    expect(getCurrentRankingPosition(tiedRows, "missing")).toBeNull();
    expect(getCurrentRankingPosition(tiedRows, "current")).toMatchObject({ index: 1, rank: 2, row: { userId: "current" } });
  });
});

describe("stage reaction", () => {
  it("types the console a character at a time and keeps lines a burst repeats", () => {
    // The instruments resend the lines already on screen before adding their own, so a typewriter
    // that restarted on every burst would retype the whole session each call.
    expect(stageSource).toContain("function useTypedLog");
    expect(stageSource).toContain("settled.current[shared] === lines[shared]");
    expect(stageSource).toContain("lines[row].slice(0, column)");
    // The burst is no longer rendered straight from state.
    expect(stageSource).not.toContain('{(terminal.length ? terminal : bootLog).map(');
  });

  it("shows the recovered key resolving instead of never showing it at all", () => {
    expect(stageSource).toContain("function DecryptedKey");
    expect(stageSource).toContain("setRecovered(assembled)");
    expect(stageSource).toContain("<DecryptedKey value={recovered} />");
    expect(stageStyles).toContain(".bt-cleared__key");
  });

  it("reacts to a rejected key with more than one red line", () => {
    expect(stageSource).toContain("function BreachFlash");
    // The timestamp restarts the alarm on a second identical rejection.
    expect(stageSource).toContain("setBreachAt(Date.now())");
    expect(stageSource).toContain("{breachAt ? <BreachFlash key={breachAt} /> : null}");
    expect(stageStyles).toContain(".bt-shell.is-breached");
    expect(stageStyles).toContain("@keyframes bt-jolt");
  });

  it("shows bytes moving while an instrument works and a meter while the server decides", () => {
    expect(stageSource).toContain("function ScanNoise");
    expect(stageSource).toContain('{scan === "running" ? <ScanNoise /> : null}');
    expect(stageSource).toContain('{submit.isPending ? <div className="bt-verify"');
    expect(stageStyles).toContain(".bt-noise");
    expect(stageStyles).toContain(".bt-verify");
  });

  it("suppresses the motion but not the alarm's own dismissal under reduced motion", () => {
    const blocks = stageStyles.split("@media(prefers-reduced-motion:reduce)");
    const reduced = blocks.find(block => block.includes(".bt-breach")) ?? "";
    expect(reduced).toContain(".bt-shell.is-breached");
    expect(reduced).toContain(".bt-noise span");
    // Without its fade the alarm would stay on screen for good: it is never cleared by state.
    expect(reduced).not.toContain(".bt-breach,");
  });
});

describe("resting surface", () => {
  it("gives every node a link that is visibly up before anything is pressed", () => {
    // Five of the ten rest on an empty frame, so the strip cannot belong to one instrument: it is
    // mounted by the scene itself, above whichever instrument the node uses.
    expect(stageSource).toContain("function SurfaceTelemetry");
    expect(stageSource).toContain('<SurfaceTelemetry target={stage.target} active={scan === "running"} />');
    expect(stageStyles).toContain(".bt-telemetry");
    // Something has to keep moving while the node is untouched.
    expect(stageStyles).toContain("@keyframes bt-telemetry-signal");
    expect(stageStyles).toContain("@keyframes bt-telemetry-beat");
  });

  it("reports the link and never what the surface is hiding", () => {
    // Naming a node's own contents here would hand over the answer its instrument exists to reveal.
    const strip = stageSource.slice(stageSource.indexOf("function SurfaceTelemetry"), stageSource.indexOf("/** A recovered node"));
    const spoken = strip.replace(/aria-[a-z]+="[^"]*"/g, "").toLowerCase();
    for (const giveaway of ["comment", "cookie", "legacy_note", "fragment", "param", "robots", "redirect"]) {
      expect(spoken).not.toContain(giveaway);
    }
    expect(strip).toContain("RTT");
    expect(strip).toContain("UPTIME");
  });

  it("makes an unread row breathe instead of sitting dead", () => {
    expect(stageStyles).toContain("@keyframes bt-idle-breathe");
    expect(stageStyles).toContain(".bt-rebuild li:not(.is-drawn):not(.is-gap)");
    expect(stageStyles).toContain(".bt-hops li:not(.is-on) strong");
  });
});

describe("typeface", () => {
  it("uses the typeface the page loads instead of whatever mono the system ships", () => {
    // The operation screens asked for ui-monospace, so none of the loaded families reached them:
    // every label and console line fell back to the operating system's default.
    // Every stack that reaches a generic must name a loaded family right before it, or the screen
    // renders in whatever the operating system ships and the page's own typeface never applies.
    const declarations = stageStyles.match(/font(-family)?:[^;}]*ui-(monospace|sans-serif)[^;}]*/g) ?? [];
    expect(declarations.length).toBeGreaterThan(0);
    for (const declaration of declarations) {
      expect(declaration.slice(0, declaration.search(/ui-(monospace|sans-serif)/))).toMatch(/"[^"]+",\s*$/);
    }
    expect(stageStyles).toContain('"JetBrains Mono"');
    for (const family of ["JetBrains+Mono", "Nanum+Gothic+Coding", "IBM+Plex+Sans+KR"]) {
      expect(indexHtml).toContain(family);
    }
  });

  it("never puts a proportional face ahead of a monospace fallback", () => {
    // IBM Plex Sans KR carries Latin glyphs, so standing second in a monospace stack it would catch
    // Latin whenever the primary failed to load, and the console would stop lining up.
    for (const stack of stageStyles.match(/font-family:[^;}]*|font:[^;}]*monospace[^;}]*/g) ?? []) {
      if (!stack.includes("monospace")) continue;
      expect(stack).not.toContain("IBM Plex Sans KR");
    }
  });

  it("shows a recovered key as the characters it is, not as ligatures", () => {
    expect(stageStyles).toContain("font-variant-ligatures:none");
    expect(stageStyles).toContain(".bt-terminal__form input");
    expect(stageStyles).toContain(".bt-cleared__key code");
  });
});

describe("node 08 resting panel", () => {
  it("draws the channel it is about instead of an empty body and a button", () => {
    // The node's subject is that the carrier holds more than the body does, which only reads if the
    // carrier is visibly alive while the body is visibly empty.
    expect(stageSource).toContain("const carrierWave =");
    expect(stageSource).toContain('<path className="is-trace" d={carrierWave} />');
    expect(stageSource).toContain('<path className="is-beam" d={carrierWave} />');
    expect(stageSource).toContain("bt-headers__channel");
    expect(stageStyles).toContain("@keyframes bt-carrier-run");
  });

  it("names the channel from the node's own target", () => {
    expect(stageSource).toContain("target={stage.target}");
    expect(stageSource).toContain("<dd><code>{target}</code></dd>");
  });

  it("still says nothing about where the trace is", () => {
    // Only what the panel draws before the request: the handler's own log lines come after it.
    const panel = stageSource.slice(stageSource.indexOf("function HeaderList"), stageSource.indexOf("/** 09"));
    const resting = panel.slice(panel.indexOf('return <div className="bt-headers">'), panel.indexOf("{open"));
    for (const giveaway of ["x-", "non-standard", "헤더"]) {
      expect(resting).not.toContain(giveaway);
    }
  });
});

describe("scene size", () => {
  it("lets the panel take the column's spare height instead of leaving it empty", () => {
    // The panel was pinned to a 310px box and the field kit was pushed to the bottom with
    // margin-top:auto, so everything between the two was dead space.
    expect(stageStyles).toContain(".bt-scene__center{flex:1");
    // The kit was pushed past that gap; with the gap gone the push goes too, and it goes from the
    // rule that set it rather than from a second rule further down disagreeing with the first.
    expect(stageStyles).not.toContain(".bt-intel{margin-top:auto");
    // The console column had the same shape of problem.
    expect(stageStyles).toContain(".bt-terminal__log{flex:1");
  });
});

