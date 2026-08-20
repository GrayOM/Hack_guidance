export type RankingFeedbackRow = {
  userId: string | number;
  name?: string | null;
  solvedCount: number;
  lastSolvedAt: Date | string | null;
};

export type RankingFingerprint = {
  signature: string;
  rank: number | null;
};

export type RankingStreamEvent = {
  kind: "refresh" | "rank-change";
  message: string;
};

const formatRank = (rank: number | null) => rank === null ? "--" : String(rank).padStart(2, "0");

export function getRankingFingerprint(rows: RankingFeedbackRow[], userId?: string | number) {
  const signature = rows
    .map(row => `${row.userId}:${row.solvedCount}:${row.lastSolvedAt ? new Date(row.lastSolvedAt).getTime() : 0}`)
    .join("|");
  const index = userId === undefined ? -1 : rows.findIndex(row => row.userId === userId);
  return { signature, rank: index >= 0 ? index + 1 : null } satisfies RankingFingerprint;
}

/** Returns the user's position from the server-sorted public ranking without changing tie order. */
export function getCurrentRankingPosition(rows: RankingFeedbackRow[], userId?: string | number | null) {
  const index = userId == null ? -1 : rows.findIndex(row => row.userId === userId);
  return index >= 0 ? { index, rank: index + 1, row: rows[index] } : null;
}

export function getRankingStreamEvent(previous: RankingFingerprint | null, next: RankingFingerprint): RankingStreamEvent | null {
  if (!previous || previous.signature === next.signature) return null;

  const changedRank = previous.rank !== next.rank && (previous.rank !== null || next.rank !== null);
  if (!changedRank) return { kind: "refresh", message: "PUBLIC RANKING // DATA STREAM UPDATED" };

  const direction = previous.rank !== null && next.rank !== null && next.rank < previous.rank ? "UPLINK" : "DOWNLINK";
  return { kind: "rank-change", message: `RANK ${direction} // ${formatRank(previous.rank)} → ${formatRank(next.rank)}` };
}
