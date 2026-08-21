import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Radio, Target, Trophy } from "lucide-react";
import { ConsoleNav } from "@/components/ConsoleNav";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useLearningRanking } from "@/hooks/useLearningApi";
import { getCurrentRankingPosition, getRankingFingerprint, getRankingStreamEvent, type RankingFingerprint, type RankingStreamEvent } from "@/lib/ranking-feedback";

type StreamEvent = RankingStreamEvent & { id: number };

export default function Ranking() {
  const { user } = usePlatformAuth();
  const ranking = useLearningRanking({
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const rows = ranking.data ?? [];
  const [streamEvent, setStreamEvent] = useState<StreamEvent | null>(null);
  const previousRef = useRef<RankingFingerprint | null>(null);
  const currentUserPosition = getCurrentRankingPosition(rows, user?.id);
  const currentUserIndex = currentUserPosition?.index ?? -1;
  const currentUserRow = currentUserPosition?.row ?? null;

  const fingerprint = useMemo(() => getRankingFingerprint(rows, user?.id), [rows, user?.id]);

  useEffect(() => {
    if (!ranking.data) return;
    const previous = previousRef.current;
    const nextEvent = getRankingStreamEvent(previous, fingerprint);
    if (nextEvent) setStreamEvent({ id: Date.now(), ...nextEvent });
    previousRef.current = fingerprint;
  }, [fingerprint, ranking.data]);

  return (
    <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]">
      <ConsoleNav />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">PUBLIC RANKING // BLACK TRACE</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">공개 랭킹</h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm leading-6 text-slate-400">이메일 인증을 완료한 분석자만 BLACK TRACE 해결 수 0개부터 공개됩니다. 회수한 Stage 수를 우선으로 정렬하며, 같은 수라면 마지막 회수 기록이 빠른 분석자가 먼저 표시됩니다.</p>
          <span className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] tracking-[0.14em] text-slate-600"><Radio className={`h-3.5 w-3.5 ${ranking.isFetching ? "animate-pulse text-teal-300" : ""}`} />{ranking.isFetching ? "SYNCING" : "LIVE SYNC / 15S"}</span>
        </div>

        {currentUserRow ? <section className="my-rank-signal mt-6" aria-label="내 순위">
          <div className="my-rank-signal__position"><span>YOUR POSITION</span><strong>#{String(currentUserIndex + 1).padStart(2, "0")}</strong></div>
          <div className="my-rank-signal__identity"><span className="my-rank-signal__label"><Target className="h-3.5 w-3.5" />MY ACCOUNT</span><p>{currentUserRow.name ?? user?.name ?? "ANONYMOUS OPERATOR"}</p></div>
          <div className="my-rank-signal__metric"><span>RECOVERED</span><strong>{currentUserRow.solvedCount} <em>/ 10</em></strong></div>
          <div className="my-rank-signal__metric"><span>LAST SIGNAL</span><strong className="text-sm">{currentUserRow.lastSolvedAt ? new Date(currentUserRow.lastSolvedAt).toLocaleString("ko-KR") : "기록 없음"}</strong></div>
        </section> : null}

        <section className="ranking-console hnet-panel mt-8 overflow-hidden border border-[#315057]">
          {streamEvent ? <div key={streamEvent.id} className={`ranking-stream ranking-stream--${streamEvent.kind}`} role="status" aria-live="polite"><div className="ranking-stream__rain" /><span>{streamEvent.message}</span></div> : null}
          <div className="hidden grid-cols-[80px_minmax(0,1fr)_140px_180px] border-b border-[#294247] bg-[#0a1518] px-5 py-3 font-mono-ui text-[10px] tracking-[0.14em] text-slate-500 sm:grid"><span>RANK</span><span>OPERATOR</span><span>SOLVED</span><span>LAST SIGNAL</span></div>
          {ranking.isLoading ? <div className="p-8 text-sm text-slate-400">랭킹 신호를 수집하고 있습니다.</div> : rows.length === 0 ? <div className="p-8 text-center"><Trophy className="mx-auto h-7 w-7 text-teal-300" /><p className="mt-3 text-sm text-slate-300">아직 공개 프로필이 없습니다. 이메일 인증 뒤 이곳에 표시됩니다.</p></div> : <div className="divide-y divide-[#294247]">{rows.map((row: any, index: number) => {
            const isCurrentUser = row.userId === user?.id;
            return <div key={row.userId} aria-current={isCurrentUser ? "true" : undefined} className={`ranking-row grid gap-2 px-5 py-4 sm:grid-cols-[80px_minmax(0,1fr)_140px_180px] sm:items-center ${isCurrentUser ? "ranking-row--current" : ""}`}>
              <span className={`ranking-row__rank font-mono-ui text-sm ${index === 0 ? "text-amber-200" : "text-slate-500"}`}>{index === 0 ? <Crown className="h-4 w-4" /> : `#${String(index + 1).padStart(2, "0")}`}</span>
              <span className="truncate text-sm font-medium text-slate-100"><span>{row.name ?? "ANONYMOUS OPERATOR"}</span>{isCurrentUser ? <span className="ranking-row__current-label"><Target className="h-3 w-3" />MY ACCOUNT</span> : null}</span>
              <span className="font-mono-ui text-sm text-teal-200">{row.solvedCount} / 10</span>
              <span className="text-xs text-slate-500">{row.lastSolvedAt ? new Date(row.lastSolvedAt).toLocaleString("ko-KR") : "기록 없음"}</span>
            </div>;
          })}</div>}
        </section>
      </main>
    </div>
  );
}
