import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Check, Flag, Search } from "lucide-react";
import { usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
import { useLearningDashboard } from "@/hooks/useLearningApi";
import { ConsoleNav } from "@/components/ConsoleNav";
import { filterProblemDirectory, getUniqueProblems, levels } from "@/lib/curriculum";

const sectorLabels = ["SURFACE SCAN", "ACCESS VECTOR", "INPUT VECTOR", "PRIVILEGE PATH", "FINAL GRID"];
const badgeTone: Record<string, string> = {
  Foundation: "border-teal-300/25 bg-teal-300/10 text-teal-200",
  Core: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  Practice: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  Final: "border-violet-300/25 bg-violet-300/10 text-violet-200",
};

export default function Problems() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const dashboard = useLearningDashboard({ enabled: isAuthenticated, retry: false });
  const [sector, setSector] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const completed = dashboard.data?.completedIds ?? [];
  const uniqueProblems = useMemo(() => getUniqueProblems(), []);
  const visible = useMemo(
    () => filterProblemDirectory({ sector, query }),
    [sector, query],
  );
  function openProblem(id: number) {
    if (!isAuthenticated) {
      startPlatformLogin();
      return;
    }
    setLocation(`/lab/${id}`);
  }

  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="relative mx-auto max-w-[1440px] px-4 py-8 lg:px-6"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#294247] pb-6"><div><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">WARGAME DIRECTORY // 50 OPEN NODES</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">문제 <span className="font-mono-ui text-base font-normal text-teal-200">{visible.length} / 50</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">각 노드는 서로 다른 증거와 신뢰 경계를 가진 독립 사례입니다. 브리프에서 목표를 파악한 뒤, 별도 교육용 웹 타깃을 직접 탐색해 플래그 아티팩트를 회수하세요.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="문제 이름 또는 분류 검색" className="h-10 w-full border border-[#315057] bg-[#0a1518] pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><button onClick={() => setSector("all")} className={`border px-3 py-2 font-mono-ui text-[10px] tracking-[0.12em] ${sector === "all" ? "border-teal-300/60 bg-teal-300/10 text-teal-100" : "border-[#315057] text-slate-500 hover:text-slate-200"}`}>ALL // 50</button>{levels.map(level => <button key={level.id} onClick={() => setSector(level.id)} className={`border px-3 py-2 font-mono-ui text-[10px] tracking-[0.12em] ${sector === level.id ? "border-teal-300/60 bg-teal-300/10 text-teal-100" : "border-[#315057] text-slate-500 hover:text-slate-200"}`}>{String(level.id).padStart(2, "0")} // {sectorLabels[level.id - 1]}</button>)}</div><section className="mt-6 overflow-hidden border border-[#315057] bg-[#0b1518]"><div className="hidden grid-cols-[76px_minmax(0,1fr)_140px_100px_110px] border-b border-[#294247] bg-[#0a1316] px-5 py-3 font-mono-ui text-[10px] tracking-[0.14em] text-slate-500 md:grid"><span>NODE</span><span>CASE FILE</span><span>SECTOR</span><span>RISK</span><span>STATUS</span></div><div className="divide-y divide-[#294247]">{visible.map(problem => { const solved = completed.includes(problem.id); return <button key={problem.id} onClick={() => openProblem(problem.id)} className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-teal-300/[0.05] sm:px-5 md:grid-cols-[76px_minmax(0,1fr)_140px_100px_110px] md:items-center"><span className="font-mono-ui text-sm text-teal-200">#{String(problem.id).padStart(2, "0")}</span><span className="min-w-0"><span className="flex items-center gap-2 truncate text-sm font-medium text-slate-100">{problem.title}<span className="border border-teal-300/20 bg-teal-300/10 px-1.5 py-0.5 font-mono-ui text-[9px] text-teal-200">WARGAME</span>{problem.source ? <span className="border border-teal-300/20 bg-teal-300/10 px-1.5 py-0.5 font-mono-ui text-[9px] text-teal-200">CASE</span> : null}</span><span className="mt-1 block truncate text-xs text-slate-500">{problem.goal}</span></span><span className="font-mono-ui text-[10px] text-slate-500">{sectorLabels[problem.level - 1]}</span><span className={`w-fit border px-2 py-1 font-mono-ui text-[10px] ${badgeTone[problem.difficulty]}`}>{problem.difficulty}</span><span className={`flex items-center gap-1.5 font-mono-ui text-[10px] ${solved ? "text-teal-200" : "text-slate-600"}`}>{solved ? <Check className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}{solved ? "SOLVED" : "OPEN"}</span></button>; })}</div>{visible.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">조건에 맞는 문제가 없습니다.</p> : null}</section></main></div>;
}
