import { useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Flag, ScrollText, Trophy } from "lucide-react";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useBlackTraceProgress } from "@/hooks/useBlackTrace";
import { useLearningRanking } from "@/hooks/useLearningApi";
import { ConsoleNav } from "@/components/ConsoleNav";
import { ScrambleText, SignalBars, useTypedLog } from "@/components/terminal-motion";
import "./home.css";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const operation = useBlackTraceProgress(isAuthenticated);
  const solved = operation.data?.completedStages.length ?? 0;
  const clearance = operation.data?.accessLevel ?? "GUEST";

  // The console reports this visitor's own state, so the page is about them from the first line.
  const boot = useMemo(() => [
    "> mounting operation BLACK TRACE",
    "> nodes discovered: 10",
    `> clearance: ${clearance}`,
    solved > 0 ? `> recovered: ${solved} / 10` : "> recovered: none",
    isAuthenticated ? "> operator session active" : "> no operator session — progress will not be stored",
    "> awaiting operator",
  ], [clearance, solved, isAuthenticated]);
  const { view: bootLines } = useTypedLog(boot, 18);

  return <div className="hacknet-shell hg-home min-h-screen bg-[#060b0d] text-[#e7f2ef]">
    <ConsoleNav />
    <main className="relative mx-auto max-w-[1180px] px-4 py-10 lg:px-6 lg:py-14">
      <section className="hg-hero hnet-panel relative overflow-hidden border border-[#34535a]">
        <HomeTelemetry solved={solved} clearance={clearance} />
        <div className="hnet-node-map absolute inset-0 opacity-40" />
        <div className="hg-hero__body">
          <div>
            <p className="hg-eyebrow"><ScrambleText value="OPERATION AVAILABLE // BLACK TRACE" /></p>
            <h1 className="hg-hero__title">브라우저에 남은 흔적을<br />회수하세요.</h1>
            <p className="hg-hero__lead">폐쇄된 보안 연구망에서 비정상 통신이 감지됐습니다. HTML, Cookie, Network, Header에 남은 단서를 찾아 첫 번째 접근 키를 복구하세요.</p>
            <button onClick={() => setLocation("/black-trace")} className="hg-cta">
              {solved > 0 ? "작전 이어서" : "작전 시작"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {/* The landing page used to end at the fold with a half-empty panel. The console fills it
              with the one thing a visitor actually wants to know: where they stand. */}
          <aside className="hg-boot">
            <div className="hg-boot__head">BOOT CONSOLE</div>
            <div className="hg-boot__log">{bootLines.map((line, index) => <p key={index}>{line}</p>)}</div>
          </aside>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatusCard icon={<Flag className="h-4 w-4" />} label="ACTIVE NODES" value={`${solved} / 10`} action={solved === 0 ? "작전 시작" : solved >= 10 ? "수료증 받기" : "이어서 하기"} onClick={() => setLocation(solved >= 10 ? "/certificate" : "/black-trace")} progress={solved / 10} />
        <StatusCard icon={<ScrollText className="h-4 w-4" />} label="ACCOUNT" value="개인 기록" action="기록 보기" onClick={() => setLocation("/records")} />
        <StatusCard icon={<Trophy className="h-4 w-4" />} label="PUBLIC RANKING" value="공개 순위" action="랭킹 보기" onClick={() => setLocation("/ranking")} />
      </section>

      <section className="mt-10">
        <p className="hg-section-label">ATTACK SURFACE</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Surface number="01" title="브라우저 관찰" text="화면 밖의 HTML과 저장 기록을 조사합니다." nodes="NODE 01 — 05" />
          <Surface number="02" title="통신 흔적" text="요청·응답·헤더에 남은 단서를 회수합니다." nodes="NODE 06 — 09" />
          <Surface number="03" title="키 복구" text="두 개의 조각을 연결해 작전을 완료합니다." nodes="NODE 10" />
        </div>
      </section>

      <LiveBoard onOpen={() => setLocation("/ranking")} />
    </main>
  </div>;
}

/** The same readout the node screens carry, so the landing page belongs to the same machine. */
function HomeTelemetry({ solved, clearance }: { solved: number; clearance: string }) {
  return <div className="hg-telemetry">
    <span className="hg-telemetry__link"><i />UPLINK</span>
    <code>blacktrace.lab</code>
    <span>NODES <strong>10</strong></span>
    <span>RECOVERED <strong>{solved} / 10</strong></span>
    <span>CLEARANCE <strong>{clearance}</strong></span>
    <SignalBars />
  </div>;
}

/** Real operators, real counts: the board is the public ranking, not decoration. */
function LiveBoard({ onOpen }: { onOpen: () => void }) {
  const ranking = useLearningRanking({ refetchOnWindowFocus: false });
  const rows: any[] = Array.isArray(ranking.data) ? ranking.data.slice(0, 5) : [];
  if (!rows.length) return null;
  return <section className="hg-board mt-10">
    <div className="hg-board__head"><span className="hg-board__live"><i />LIVE</span> RECENT OPERATORS<button onClick={onOpen}>전체 순위 →</button></div>
    <div className="hg-board__rows">{rows.map((row, index) => <div key={row.userId ?? index} className="hg-board__row">
      <span className="hg-board__rank">#{String(index + 1).padStart(2, "0")}</span>
      <span className="hg-board__name">{row.name ?? "ANONYMOUS OPERATOR"}</span>
      <span className="hg-board__track"><i style={{ width: `${Math.min(100, (row.solvedCount ?? 0) * 10)}%` }} /></span>
      <span className="hg-board__count">{row.solvedCount ?? 0} / 10</span>
    </div>)}</div>
  </section>;
}

function StatusCard({ icon, label, value, action, onClick, progress }: { icon: React.ReactNode; label: string; value: string; action: string; onClick: () => void; progress?: number }) {
  return <section className="hg-card">
    <div className="hg-card__head">{icon}<span>{label}</span></div>
    <p className="hg-card__value">{value}</p>
    {/* A bare "0 / 10" says nothing about where the operator stands; the track does. */}
    {progress === undefined ? null : <div className="hg-card__track"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div>}
    <button onClick={onClick}>{action} →</button>
  </section>;
}

function Surface({ number, title, text, nodes }: { number: string; title: string; text: string; nodes: string }) {
  return <div className="hg-surface">
    <p className="hg-surface__number">{number}</p>
    <h2>{title}</h2>
    <p className="hg-surface__text">{text}</p>
    <p className="hg-surface__nodes">{nodes}</p>
  </div>;
}
