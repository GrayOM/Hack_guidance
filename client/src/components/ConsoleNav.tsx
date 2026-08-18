import { useLocation } from "wouter";
import { Activity, Flag, Home, List, LockKeyhole, LogOut, ScrollText, Trophy } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { SignalLogo } from "@/components/SignalLogo";

const items = [
  { path: "/", label: "홈", icon: Home },
  { path: "/problems", label: "문제", icon: List },
  { path: "/records", label: "해결 기록", icon: ScrollText },
  { path: "/ranking", label: "랭킹", icon: Trophy },
];

export function ConsoleNav() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const dashboard = trpc.learning.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const solved = dashboard.data?.completedIds.length ?? 0;
  return <header className="hnet-header sticky top-0 z-40 border-b border-[#294247] bg-[#071013]/95 backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 lg:px-6"><button onClick={() => setLocation("/")} className="flex shrink-0 items-center gap-2.5 text-left"><SignalLogo className="h-7 w-7" /><span><span className="block font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">HACK // GUIDANCE</span><span className="mt-0.5 block text-[11px] text-slate-500">Challenge Grid</span></span></button><nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:order-2 sm:w-auto sm:flex-1 sm:pb-0" aria-label="주요 메뉴">{items.map(item => { const Icon = item.icon; const active = location === item.path; return <button key={item.path} onClick={() => setLocation(item.path)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition ${active ? "border-teal-300 text-teal-100" : "border-transparent text-slate-500 hover:text-slate-200"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}{solved >= 50 ? <button onClick={() => setLocation("/certificate")} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition ${location === "/certificate" ? "border-teal-300 text-teal-100" : "border-transparent text-slate-500 hover:text-slate-200"}`}><Flag className="h-3.5 w-3.5" />최종 기록</button> : <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-2 text-xs text-slate-700"><LockKeyhole className="h-3.5 w-3.5" />최종 기록</span>}</nav><div className="ml-auto flex shrink-0 items-center gap-3"><div className="hidden text-right sm:block"><p className="font-mono-ui text-[9px] tracking-[0.12em] text-slate-600">SOLVED</p><p className="font-mono-ui text-xs text-teal-200">{solved}/50</p></div>{isAuthenticated ? <button onClick={() => void logout()} className="inline-flex items-center gap-1.5 border border-[#31545a] px-2.5 py-1.5 text-xs text-slate-300 hover:border-teal-300/60 hover:text-teal-100"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">{user?.name ?? "분석자"}</span></button> : <button onClick={startLogin} className="inline-flex items-center gap-1.5 border border-[#31545a] px-2.5 py-1.5 text-xs text-slate-300 hover:border-teal-300/60 hover:text-teal-100"><Activity className="h-3.5 w-3.5" />로그인</button>}</div></div></header>;
}
