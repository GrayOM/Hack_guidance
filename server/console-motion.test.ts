import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getRankingFingerprint, getRankingStreamEvent } from "../client/src/lib/ranking-feedback";
import { SIGNAL_LOCK_DURATION_MS, shouldStartSignalLock } from "../client/src/lib/signal-feedback";

const appSource = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
const rankingSource = readFileSync(new URL("../client/src/pages/Ranking.tsx", import.meta.url), "utf8");
const signalLockSource = readFileSync(new URL("../client/src/components/SignalLockOverlay.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("event-driven console feedback", () => {
  it("keeps only ambient pointer response and limits success feedback to correct submissions", () => {
    expect(appSource).toContain("PointerAmbient");
    expect(appSource).not.toContain("ConsoleMotion");
    expect(workspaceSource).toContain('import { SignalLockOverlay } from "@/components/SignalLockOverlay"');
    expect(workspaceSource).toContain("<SignalLockOverlay active={isCorrect} nodeId={challenge.id} />");
    expect(styles).toContain(".signal-lock");
    expect(styles).toContain(".pointer-ambient");
    expect(styles).not.toContain("pointer-ambient__reticle");
    expect(styles).not.toContain("POINTER LINK");
    expect(shouldStartSignalLock(false, true)).toBe(true);
    expect(shouldStartSignalLock(true, true)).toBe(false);
    expect(SIGNAL_LOCK_DURATION_MS).toBe(1_800);
    expect(signalLockSource).toContain("setTimeout(() => setVisible(false), SIGNAL_LOCK_DURATION_MS)");
  });

  it("refreshes public ranking data and renders a temporary stream on changes", () => {
    expect(rankingSource).toContain("refetchInterval: 15_000");
    expect(rankingSource).toContain("ranking-stream");
    expect(rankingSource).toContain("RANK");
    expect(styles).toContain("ranking-data-rain");
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
});
