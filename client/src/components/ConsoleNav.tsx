import { useLocation } from "wouter";
import { useState } from "react";
import { Activity, Flag, Home, List, LockKeyhole, LogOut, Mail, ScrollText, Trophy, X } from "lucide-react";
import { isExternalSupabaseDeployment } from "@/lib/external-supabase";
import { sendSupabaseMagicLink, usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
import { useLearningDashboard } from "@/hooks/useLearningApi";
import { SignalLogo } from "@/components/SignalLogo";

const items = [
  { path: "/", label: "홈", icon: Home },
  { path: "/problems", label: "문제", icon: List },
  { path: "/records", label: "해결 기록", icon: ScrollText },
  { path: "/ranking", label: "랭킹", icon: Trophy },
];

export function ConsoleNav() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = usePlatformAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [sendingLogin, setSendingLogin] = useState(false);
  const dashboard = useLearningDashboard({ enabled: isAuthenticated, retry: false });
  const solved = dashboard.data?.completedIds.length ?? 0;

  const openLogin = () => {
    if (!isExternalSupabaseDeployment) {
      startPlatformLogin();
      return;
    }
    setLoginStatus("");
    setLoginOpen(true);
  };

  const submitMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingLogin(true);
    const result = await sendSupabaseMagicLink(email);
    setSendingLogin(false);
    if (result === "sent") {
      setLoginStatus("매직 링크를 전송했습니다. 이메일에서 링크를 열어 로그인해 주세요.");
      return;
    }
    if (result === "invalid") {
      setLoginStatus("이메일 주소 형식을 확인해 주세요.");
      return;
    }
    setLoginStatus("매직 링크 전송에 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
  };

  return (
    <header className="hnet-header sticky top-0 z-40 border-b border-[#294247] bg-[#071013]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 lg:px-6">
        <button onClick={() => setLocation("/")} className="flex shrink-0 items-center gap-2.5 text-left" aria-label="Hack Guidance 홈으로 이동">
          <SignalLogo className="h-7 w-7" />
          <span>
            <span className="block font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">HACK // GUIDANCE</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">Challenge Grid <span className="text-slate-600">· by GrayOM</span></span>
          </span>
        </button>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:order-2 sm:w-auto sm:flex-1 sm:pb-0" aria-label="주요 메뉴">
          {items.map(item => {
            const Icon = item.icon;
            const active = location === item.path;
            return <button key={item.path} onClick={() => setLocation(item.path)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition ${active ? "border-teal-300 text-teal-100" : "border-transparent text-slate-500 hover:text-slate-200"}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>;
          })}
          {solved >= 50 ? <button onClick={() => setLocation("/certificate")} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition ${location === "/certificate" ? "border-teal-300 text-teal-100" : "border-transparent text-slate-500 hover:text-slate-200"}`}><Flag className="h-3.5 w-3.5" />최종 기록</button> : <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-2 text-xs text-slate-700"><LockKeyhole className="h-3.5 w-3.5" />최종 기록</span>}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block"><p className="font-mono-ui text-[9px] tracking-[0.12em] text-slate-600">SOLVED</p><p className="font-mono-ui text-xs text-teal-200">{solved}/50</p></div>
          {isAuthenticated ? <div className="flex items-center gap-1.5"><span className="hidden max-w-40 truncate font-mono-ui text-[10px] text-teal-200 sm:inline" title={user?.email ?? user?.name ?? "분석자"}>{user?.email ?? user?.name ?? "분석자"}</span><button onClick={() => void logout()} className="inline-flex items-center gap-1.5 border border-teal-300/40 bg-teal-300/[0.06] px-2.5 py-1.5 text-xs text-teal-100 hover:border-teal-300 hover:bg-teal-300/10"><LogOut className="h-3.5 w-3.5" />로그아웃</button></div> : <button onClick={openLogin} className="inline-flex items-center gap-1.5 border border-[#31545a] px-2.5 py-1.5 text-xs text-slate-300 hover:border-teal-300/60 hover:text-teal-100"><Activity className="h-3.5 w-3.5" />간편 시작</button>}
        </div>
      </div>
      {loginOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#020607]/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setLoginOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="login-panel-title" className="w-full max-w-md border border-[#345157] bg-[#0c171a] shadow-[0_0_50px_rgba(23,188,179,.12)]" onMouseDown={event => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-[#294247] px-5 py-4"><div><p className="font-mono-ui text-[10px] tracking-[.16em] text-teal-300">MEMBERSHIP GATEWAY</p><h2 id="login-panel-title" className="mt-1 text-base font-semibold text-slate-100">이메일로 간편 시작</h2></div><button type="button" onClick={() => setLoginOpen(false)} aria-label="간편 시작 창 닫기" className="p-2 text-slate-500 hover:text-teal-100"><X className="h-4 w-4" /></button></div>
          <form onSubmit={submitMagicLink} className="space-y-4 p-5"><p className="text-sm leading-6 text-slate-400">처음 입력한 이메일은 계정을 만들고, 기존 이메일은 바로 로그인합니다. 외부 OAuth와 비밀번호는 사용하지 않습니다.</p><p className="border-l-2 border-teal-300/50 bg-teal-300/[0.05] px-3 py-2 text-xs leading-5 text-teal-100">가입이 완료되면 이메일 앞부분으로 만든 분석자명이 공개 랭킹에 <strong>0 / 50</strong>부터 표시됩니다.</p><label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">EMAIL ADDRESS</span><div className="mt-2 flex items-center border border-[#31545a] bg-[#071013] focus-within:border-teal-300"><Mail className="ml-3 h-4 w-4 shrink-0 text-teal-300" /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" className="h-11 w-full bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600" /></div></label>{loginStatus ? <p role="status" className="border-l-2 border-teal-300/70 bg-teal-300/[0.06] px-3 py-2 text-xs leading-5 text-teal-100">{loginStatus}</p> : null}<button type="submit" disabled={sendingLogin} className="inline-flex w-full items-center justify-center gap-2 bg-teal-300 px-4 py-3 text-sm font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><Mail className="h-4 w-4" />{sendingLogin ? "전송 중" : "이메일로 시작하기"}</button></form>
        </section>
      </div> : null}
    </header>
  );
}
