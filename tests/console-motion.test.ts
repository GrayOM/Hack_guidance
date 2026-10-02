import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCurrentRankingPosition, getRankingFingerprint, getRankingStreamEvent } from "../client/src/lib/ranking-feedback";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const rankingSource = readFileSync(new URL("../client/src/pages/Ranking.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");
const stageSource = readFileSync(new URL("../client/src/pages/BlackTraceStage.tsx", import.meta.url), "utf8");
const stageStyles = readFileSync(new URL("../client/src/pages/black-trace.css", import.meta.url), "utf8");

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
    const reduced = stageStyles.slice(stageStyles.lastIndexOf("@media(prefers-reduced-motion:reduce)"));
    expect(reduced).toContain(".bt-shell.is-breached");
    expect(reduced).toContain(".bt-noise span");
    // Without its fade the alarm would stay on screen for good: it is never cleared by state.
    expect(reduced).not.toContain(".bt-breach,");
  });
});
