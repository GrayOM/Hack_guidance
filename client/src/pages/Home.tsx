/**
 * Design reminder — Signal Room Console: non-gamified security-learning workspace.
 * Use precise panels, concrete observations, and restrained Signal Teal feedback.
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileCode2,
  Flag,
  Gauge,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Menu,
  Network,
  PanelRightOpen,
  Play,
  Search,
  ShieldCheck,
  TerminalSquare,
  Trophy,
  X,
} from "lucide-react";
import { SignalLogo } from "@/components/SignalLogo";
import { getProblem, levels, problems } from "@/lib/curriculum";

const badgeTone: Record<string, string> = {
  Foundation: "border-teal-300/25 bg-teal-300/10 text-teal-200",
  Core: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  Practice: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  Final: "border-violet-300/25 bg-violet-300/10 text-violet-200",
};

const sectorLabels = ["SURFACE SCAN", "ACCESS VECTOR", "INPUT VECTOR", "PRIVILEGE PATH", "FINAL GRID"];
const sectorDescriptions = ["표면에 드러난 단서와 브라우저 정보를 분석합니다.", "인증·세션·다운로드 경로의 검증 지점을 찾습니다.", "입력과 출력이 만나는 취약한 경계를 추적합니다.", "권한·토큰·API 응답의 신뢰 경계를 확인합니다.", "여러 단서를 조합해 최종 문제를 해결합니다."];

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const dashboard = trpc.learning.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  const [activeLevel, setActiveLevel] = useState(1);
  const [selectedId, setSelectedId] = useState(1);
  const [hintStep, setHintStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = getProblem(selectedId);
  const activeProblems = useMemo(
    () => problems.filter((problem) => problem.level === activeLevel && problem.title.toLowerCase().includes(query.toLowerCase())),
    [activeLevel, query],
  );
  const completed = dashboard.data?.completedIds ?? [];
  const completeCount = completed.length;
  const activeComplete = completed.filter((id) => getProblem(id).level === activeLevel).length;
  const overallPercent = Math.round((completeCount / 50) * 100);

  function chooseProblem(id: number) {
    setSelectedId(id);
    setHintStep(0);
    setSidebarOpen(false);
    setActiveLevel(getProblem(id).level);
  }

  function openSelectedLab() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    setLocation(`/lab/${selected.id}`);
  }

  return (
    <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef] selection:bg-teal-300/30">
      <div className="pointer-events-none fixed inset-0 console-grid opacity-50" />
      <header className="hnet-header sticky top-0 z-40 h-16 border-b border-[#284045]/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-md p-2 text-slate-300 hover:bg-white/5 lg:hidden" aria-label="학습 경로 열기"><Menu className="h-5 w-5" /></button>
            <SignalLogo className="h-8 w-8" />
            <div className="leading-none">
              <p className="font-mono-ui text-[10px] tracking-[0.22em] text-teal-300">HACK // GUIDANCE</p>
              <p className="mt-1 text-xs text-slate-400">Web Security Fundamentals</p>
            </div>
          </div>
          <div className="hidden items-center gap-7 md:flex">
            <div className="flex items-center gap-2 text-xs text-slate-400"><Activity className="h-3.5 w-3.5 text-teal-300" /><span className="font-mono-ui text-teal-100">CHALLENGE GRID ONLINE</span></div>
            <div className="h-7 w-px bg-[#294146]" />
            <div className="text-right"><p className="font-mono-ui text-[10px] tracking-wider text-slate-500">SOLVED NODES</p><p className="mt-0.5 text-sm font-semibold text-teal-200">{completeCount} <span className="font-normal text-slate-500">/ 50</span></p></div>
          </div>
          {isAuthenticated ? <button onClick={() => void logout()} className="flex items-center gap-2 rounded-md border border-[#31545a] bg-[#132226] px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-teal-300/60 hover:text-teal-100"><span className="grid h-5 w-5 place-items-center rounded bg-teal-300/15 font-mono-ui text-[10px] text-teal-200">HG</span><span className="hidden sm:inline">{user?.name ?? "분석자"} · 로그아웃</span></button> : <button onClick={startLogin} className="flex items-center gap-2 rounded-md border border-[#31545a] bg-[#132226] px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-teal-300/60 hover:text-teal-100"><span className="grid h-5 w-5 place-items-center rounded bg-teal-300/15 font-mono-ui text-[10px] text-teal-200">HG</span><span className="hidden sm:inline">문제 풀이 시작</span></button>}
        </div>
      </header>

      <div className="relative mx-auto flex max-w-[1600px]">
        <aside className={`hnet-sidebar fixed inset-y-0 left-0 z-50 w-[284px] border-r border-[#294247] pt-4 transition-transform duration-200 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between px-5 lg:hidden"><span className="font-mono-ui text-xs text-teal-200">NETWORK INDEX</span><button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400"><X className="h-5 w-5" /></button></div>
          <div className="flex h-full flex-col overflow-y-auto px-4 pb-5 pt-3 lg:pt-1">
            <div className="mb-5 rounded-lg border border-[#294247] bg-[#111d20] p-3.5">
              <div className="mb-2 flex items-center justify-between"><span className="font-mono-ui text-[10px] tracking-[0.16em] text-slate-500">NETWORK CLEARANCE</span><span className="font-mono-ui text-xs text-teal-200">{overallPercent}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#23363a]"><div className="h-full rounded-full bg-teal-300 transition-all duration-500 signal-line" style={{ width: `${Math.max(overallPercent, 4)}%` }} /></div>
              <p className="mt-2 text-xs leading-5 text-slate-400">50개 노드로 구성된 안전한 웹 보안 문제 보드입니다. 해결한 문제만 풀이 기록에 남습니다.</p>
            </div>
            <nav className="space-y-1.5" aria-label="레벨 선택">
              {levels.map((level) => {
                const selectedLevel = level.id === activeLevel;
                const levelDone = completed.filter((id) => getProblem(id).level === level.id).length;
                return <button key={level.id} onClick={() => setActiveLevel(level.id)} className={`group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${selectedLevel ? "border-teal-300/45 bg-teal-300/[0.09]" : "border-transparent hover:border-[#294247] hover:bg-white/[0.025]"}`}>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border font-mono-ui text-xs ${selectedLevel ? "border-teal-300/60 bg-teal-300/15 text-teal-100" : "border-[#30484d] bg-[#132124] text-slate-400"}`}>{String(level.id).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1"><span className={`block truncate text-sm font-medium ${selectedLevel ? "text-teal-50" : "text-slate-300"}`}>{sectorLabels[level.id - 1]}</span><span className="mt-0.5 block font-mono-ui text-[10px] text-slate-500">NODES {level.range} · {levelDone}/10 · OPEN</span></span>
                  <ChevronRight className={`h-4 w-4 shrink-0 ${selectedLevel ? "text-teal-200" : "text-slate-600 group-hover:text-slate-400"}`} />
                </button>;
              })}
            </nav>
            <div className="mt-auto border-t border-[#294247] pt-4">
              <button onClick={() => setLocation("/records")} className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-100"><BookOpen className="h-4 w-4 text-teal-300" />해결 기록</button>
              <button onClick={() => setLocation("/ranking")} className="mt-1 flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-100"><Trophy className="h-4 w-4 text-amber-200" />공개 랭킹</button>
              {completeCount >= 50 ? <button onClick={() => setLocation("/certificate")} className="mt-1 flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm text-teal-100 transition hover:bg-white/[0.04]"><GraduationCap className="h-4 w-4 text-teal-300" />클리어런스 기록</button> : <div className="mt-1 flex w-full items-center gap-3 rounded-lg p-2 text-sm text-slate-600"><LockKeyhole className="h-4 w-4" />최종 기록 잠김</div>}
            </div>
          </div>
        </aside>
        {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" aria-label="학습 경로 닫기" />}

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-6 lg:py-7">
          <section className="hnet-panel hnet-hero relative overflow-hidden rounded-lg border border-[#34535a]">
            <img src="/manus-storage/hg-console-hero_47c504c4.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-screen" />
            <div className="hnet-node-map absolute inset-0 opacity-75" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061316] via-[#0a2425]/90 to-[#061316]/45" />
            <div className="relative grid min-h-[205px] gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-end lg:px-9 lg:py-8">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-300 signal-line" /><span className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-200">CHALLENGE BOARD // 50 NODES</span></div>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">단서를 확보하고,<br className="hidden sm:block" /> 문제를 해결하세요.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Hack Guidance는 요청, 응답, 쿠키, 입력값에 남은 단서를 분석해 50개의 안전한 웹 보안 문제를 해결하는 콘솔형 문제 보드입니다.</p>
              </div>
              <div className="flex gap-3"><div className="rounded-lg border border-white/10 bg-[#0a1316]/70 px-4 py-3 backdrop-blur-sm"><p className="font-mono-ui text-[10px] tracking-wider text-slate-500">ACTIVE SECTOR</p><p className="mt-1 text-sm font-semibold text-teal-100">{sectorLabels[activeLevel - 1]}</p></div><div className="rounded-lg border border-white/10 bg-[#0a1316]/70 px-4 py-3 backdrop-blur-sm"><p className="font-mono-ui text-[10px] tracking-wider text-slate-500">NEXT NODE</p><p className="mt-1 text-sm font-semibold text-slate-100">#{String(selected.id).padStart(2, "0")} OPEN</p></div></div>
            </div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric icon={<Layers3 className="h-4 w-4" />} label="문제 구역" value="5 Sectors" note="Surface → Final Grid" />
            <Metric icon={<ClipboardCheck className="h-4 w-4" />} label="해결한 문제" value={`${completeCount} / 50`} note={completeCount ? "해결 기록 저장됨" : "첫 번째 노드를 선택하세요"} />
            <Metric icon={<Flag className="h-4 w-4" />} label="플래그 검증" value="50 Nodes" note="모든 노드 즉시 접근 가능" />
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CHALLENGE INDEX</p><h2 className="mt-1 text-lg font-semibold text-white">{sectorLabels[activeLevel - 1]}</h2><p className="mt-1 text-sm text-slate-400">{sectorDescriptions[activeLevel - 1]}</p></div><div className="relative"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이 구역의 문제 검색" className="h-9 w-48 rounded-md border border-[#31494d] bg-[#111d20] pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-teal-300/70" /></div></div>
              <div className="overflow-hidden rounded-xl border border-[#2d454a] bg-[#101b1e]">
                <div className="hidden grid-cols-[52px_minmax(0,1fr)_120px_94px] border-b border-[#294247] bg-[#142225] px-4 py-2.5 font-mono-ui text-[10px] tracking-[0.14em] text-slate-500 sm:grid"><span>ID</span><span>CHALLENGE</span><span>RISK</span><span>EST.</span></div>
                <div className="divide-y divide-[#263d42]">
                  {activeProblems.map((problem) => { const isSelected = problem.id === selected.id; const isDone = completed.includes(problem.id); return <button key={problem.id} onClick={() => chooseProblem(problem.id)} className={`grid w-full gap-2 px-4 py-3 text-left transition sm:grid-cols-[52px_minmax(0,1fr)_120px_94px] sm:items-center ${isSelected ? "bg-teal-300/[0.08]" : "hover:bg-white/[0.025]"}`}><span className={`font-mono-ui text-xs ${isSelected ? "text-teal-200" : "text-slate-500"}`}>{String(problem.id).padStart(2, "0")}</span><span className="min-w-0"><span className="flex items-center gap-2 truncate text-sm font-medium text-slate-100">{problem.title}{problem.source && <span className="rounded border border-teal-300/20 bg-teal-300/10 px-1.5 py-0.5 font-mono-ui text-[9px] tracking-wider text-teal-200">EXISTING</span>}{isDone && <Check className="h-3.5 w-3.5 text-teal-300" />}</span><span className="mt-1 block truncate font-mono-ui text-[10px] text-slate-500">{problem.category}</span></span><span className={`w-fit rounded border px-2 py-1 font-mono-ui text-[10px] ${badgeTone[problem.difficulty]}`}>{problem.difficulty}</span><span className="font-mono-ui text-xs text-slate-500">{problem.duration}</span></button>; })}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#294247] bg-[#101b1e] px-4 py-3"><div className="flex items-center gap-3"><span className="font-mono-ui text-xs text-teal-200">{activeComplete}/10</span><span className="text-xs text-slate-500">현재 구역 해결 현황</span></div><div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#25383c]"><div className="h-full rounded-full bg-teal-300 transition-all" style={{ width: `${activeComplete * 10}%` }} /></div></div>
            </div>

            <aside className="panel-surface rounded-xl border border-[#345157] p-4 shadow-2xl shadow-black/15 xl:sticky xl:top-23 xl:h-fit">
              <div className="flex items-start justify-between gap-3 border-b border-[#294247] pb-4"><div><p className="font-mono-ui text-[10px] tracking-[0.18em] text-teal-300">PROBLEM BRIEF</p><h2 className="mt-1 text-base font-semibold text-white">#{String(selected.id).padStart(2, "0")} {selected.shortTitle}</h2></div><span className={`rounded border px-2 py-1 font-mono-ui text-[9px] ${badgeTone[selected.difficulty]}`}>{selected.difficulty}</span></div>
              <div className="mt-4 rounded-lg border border-[#2c474d] bg-[#0a1316] p-3.5 dot-grid"><div className="mb-3 flex items-center justify-between"><span className="font-mono-ui text-[10px] text-slate-500">TARGET SURFACE</span><span className="flex items-center gap-1.5 font-mono-ui text-[10px] text-teal-200"><span className="h-1.5 w-1.5 rounded-full bg-teal-300" />READY</span></div><div className="rounded border border-[#2a454a] bg-[#111d20] p-3"><div className="flex gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#d96b62]" /><span className="h-1.5 w-1.5 rounded-full bg-[#cba961]" /><span className="h-1.5 w-1.5 rounded-full bg-[#51ba91]" /></div><div className="mt-3 space-y-2"><div className="h-2 w-2/3 rounded bg-slate-600/45" /><div className="h-7 rounded border border-[#3a5558] bg-[#0e181b]" /><div className="h-7 rounded border border-[#3a5558] bg-[#0e181b]" /><div className="h-6 w-20 rounded bg-teal-300/70" /></div></div></div>
              <div className="mt-4"><p className="font-mono-ui text-[10px] tracking-[0.15em] text-slate-500">OBJECTIVE</p><p className="mt-2 text-sm leading-6 text-slate-200">{selected.goal}</p></div>
              <div className="mt-4 border-t border-[#294247] pt-4"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] tracking-[0.15em] text-slate-500">EVIDENCE POINTS</p><PanelRightOpen className="h-3.5 w-3.5 text-slate-500" /></div><ul className="mt-2.5 space-y-2">{selected.observation.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-300"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-300" />{item}</li>)}</ul></div>
              <div className="mt-4 border-t border-[#294247] pt-4"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] tracking-[0.15em] text-slate-500">INTEL DROPS</p><span className="font-mono-ui text-[10px] text-slate-500">{hintStep}/3</span></div>{hintStep > 0 ? <p className="mt-2.5 rounded-md border border-amber-200/15 bg-amber-100/[0.06] p-2.5 text-xs leading-5 text-amber-100/90">{selected.hints[hintStep - 1]}</p> : <p className="mt-2 text-xs leading-5 text-slate-500">단서는 관찰 방향만 제공합니다. 정답은 직접 공개하지 않습니다.</p>}<button disabled={hintStep >= 3} onClick={() => setHintStep((step) => Math.min(step + 1, 3))} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-200 transition hover:text-teal-100 disabled:cursor-not-allowed disabled:text-slate-600"><CircleHelp className="h-3.5 w-3.5" />{hintStep ? "다음 단서 열기" : "첫 번째 단서 열기"}</button></div>
              <div className="mt-5 flex gap-2"><a href="#request-inspector" className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[#3b5c60] bg-[#16292d] px-3 py-2.5 text-xs font-medium text-teal-100 transition hover:border-teal-300/70 hover:bg-[#193237]"><Play className="h-3.5 w-3.5" />트레이스 보기</a><button onClick={openSelectedLab} className="flex items-center justify-center gap-2 rounded-md bg-teal-300 px-3 py-2.5 text-xs font-semibold text-[#092024] transition hover:bg-teal-200 active:scale-[0.98]">{completed.includes(selected.id) ? <><Check className="h-3.5 w-3.5" />해결 기록 확인</> : <><ShieldCheck className="h-3.5 w-3.5" />문제 열기</>}</button></div>
            </aside>
          </section>

          <section className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div id="request-inspector" className="overflow-hidden rounded-xl border border-[#2e494f] bg-[#101b1e]"><div className="flex items-center justify-between border-b border-[#294247] px-5 py-3.5"><div className="flex items-center gap-2"><TerminalSquare className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-300">REQUEST INSPECTOR</span></div><span className="font-mono-ui text-[10px] text-slate-500">SAFE TRACE VIEW</span></div><div className="grid gap-5 p-5 sm:grid-cols-2"><div><p className="font-mono-ui text-[10px] text-slate-500">REQUEST</p><pre className="mt-2 overflow-x-auto text-xs leading-6 text-slate-300"><span className="text-teal-200">POST</span> /node/{String(selected.id).padStart(2, "0")}/trace{`\n`}Content-Type: application/x-www-form-urlencoded{`\n`}session=challenge-grid{`\n`}status=inspect</pre></div><div><p className="font-mono-ui text-[10px] text-slate-500">RESPONSE</p><pre className="mt-2 overflow-x-auto text-xs leading-6 text-slate-300"><span className="text-sky-200">HTTP/1.1 200 OK</span>{`\n`}X-Node-Mode: sandbox{`\n`}X-Evidence: available{`\n`}Hint-Policy: three-step</pre></div></div></div>
            <div id="completion-track" className="relative overflow-hidden rounded-xl border border-[#335158] bg-[#101b1e] p-5"><img src="/manus-storage/hg-certificate-mark_099b5170.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-screen" /><div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-300">FINAL CLEARANCE</span></div><span className="rounded border border-[#35555a] px-2 py-1 font-mono-ui text-[9px] text-slate-400">50 FLAGS</span></div><h3 className="mt-5 text-lg font-semibold text-white">모든 플래그를 확보하면 최종 기록이 열립니다.</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">클리어런스 기록은 50개 문제를 모두 해결한 분석자에게만 표시됩니다.</p><div className="mt-5 grid grid-cols-2 gap-3"><CertificateMetric label="SOLVED NODES" value={`${completeCount}/50`} /><CertificateMetric label="STATUS" value={completeCount >= 50 ? "UNLOCKED" : "LOCKED"} /></div>{completeCount >= 50 ? <button onClick={() => setLocation("/certificate")} className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-teal-200 transition hover:text-teal-100"><FileCode2 className="h-3.5 w-3.5" />최종 기록 열기 <ArrowUpRight className="h-3.5 w-3.5" /></button> : null}</div></div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-[#294247] bg-[#101b1e]/90 px-4 py-3.5"><div className="flex items-center gap-2 text-teal-300">{icon}<span className="font-mono-ui text-[10px] tracking-[0.14em] text-slate-500">{label}</span></div><div className="mt-3 flex items-end justify-between gap-3"><span className="text-lg font-semibold tracking-tight text-white">{value}</span><span className="text-right text-[11px] text-slate-500">{note}</span></div></div>;
}

function CertificateMetric({ label, value }: { label: string; value: string }) {
  return <div className="border-l border-[#355156] pl-3"><p className="font-mono-ui text-[9px] tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-100">{value}</p></div>;
}
