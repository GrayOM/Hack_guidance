import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Activity, Flag, Home, List, LockKeyhole, LogOut, Mail, ScrollText, Trophy, X } from "lucide-react";
import { isExternalSupabaseDeployment } from "@/lib/external-supabase";
import { registerSupabaseAccount, signInSupabaseAccount, usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
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
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  useEffect(() => {
    const openRequestedAuth = () => {
      if (isExternalSupabaseDeployment) openLogin();
    };
    window.addEventListener("hack-guidance:open-auth", openRequestedAuth);
    return () => window.removeEventListener("hack-guidance:open-auth", openRequestedAuth);
  });

  const submitAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingLogin(true);
    const result = authMode === "signup"
      ? await registerSupabaseAccount({ email, password, displayName })
      : await signInSupabaseAccount({ email, password });
    setSendingLogin(false);
    if (result === "signed-in") {
      setLoginStatus(authMode === "signup" ? "회원가입과 로그인이 완료되었습니다. 공개 랭킹에 등록했습니다." : "로그인되었습니다.");
      setPassword("");
      return;
    }
    if (result === "confirmation-sent") {
      setLoginStatus("확인 이메일을 전송했습니다. 링크를 열면 회원가입이 완료됩니다.");
      return;
    }
    setLoginStatus(result === "invalid" ? "입력값을 다시 확인해 주세요." : "인증 요청에 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
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
          {isAuthenticated ? <div className="flex items-center gap-1.5"><span className="hidden max-w-40 truncate font-mono-ui text-[10px] text-teal-200 sm:inline" title={user?.email ?? user?.name ?? "분석자"}>{user?.email ?? user?.name ?? "분석자"}</span><button onClick={() => void logout()} className="inline-flex items-center gap-1.5 border border-teal-300/40 bg-teal-300/[0.06] px-2.5 py-1.5 text-xs text-teal-100 hover:border-teal-300 hover:bg-teal-300/10"><LogOut className="h-3.5 w-3.5" />로그아웃</button></div> : <button onClick={openLogin} className="inline-flex items-center gap-1.5 border border-[#31545a] px-2.5 py-1.5 text-xs text-slate-300 hover:border-teal-300/60 hover:text-teal-100"><Activity className="h-3.5 w-3.5" />로그인</button>}
        </div>
      </div>
      {loginOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-[#020607]/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setLoginOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="login-panel-title" className="w-full max-w-md border border-[#345157] bg-[#0c171a] shadow-[0_0_50px_rgba(23,188,179,.12)]" onMouseDown={event => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-[#294247] px-5 py-4"><div><p className="font-mono-ui text-[10px] tracking-[.16em] text-teal-300">HACK GUIDANCE ACCOUNT</p><h2 id="login-panel-title" className="mt-1 text-base font-semibold text-slate-100">{authMode === "signup" ? "회원가입" : "로그인"}</h2></div><button type="button" onClick={() => setLoginOpen(false)} aria-label="인증 창 닫기" className="p-2 text-slate-500 hover:text-teal-100"><X className="h-4 w-4" /></button></div>
          <form onSubmit={submitAccount} className="space-y-4 p-5"><div className="grid grid-cols-2 border border-[#31545a] p-1"><button type="button" onClick={() => { setAuthMode("signup"); setLoginStatus(""); }} className={`px-3 py-2 text-xs ${authMode === "signup" ? "bg-teal-300 text-[#082023]" : "text-slate-400 hover:text-teal-100"}`}>회원가입</button><button type="button" onClick={() => { setAuthMode("signin"); setLoginStatus(""); }} className={`px-3 py-2 text-xs ${authMode === "signin" ? "bg-teal-300 text-[#082023]" : "text-slate-400 hover:text-teal-100"}`}>로그인</button></div>{authMode === "signup" ? <label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">NAME</span><input required minLength={2} maxLength={24} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="공개명" className="mt-2 h-11 w-full border border-[#31545a] bg-[#071013] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label> : null}<label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">EMAIL ADDRESS</span><div className="mt-2 flex items-center border border-[#31545a] bg-[#071013] focus-within:border-teal-300"><Mail className="ml-3 h-4 w-4 shrink-0 text-teal-300" /><input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" className="h-11 w-full bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600" /></div></label><label className="block"><span className="font-mono-ui text-[10px] tracking-[.12em] text-slate-500">PASSWORD</span><input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={72} value={password} onChange={event => setPassword(event.target.value)} placeholder="8~72자" className="mt-2 h-11 w-full border border-[#31545a] bg-[#071013] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label>{authMode === "signup" ? <p className="border-l-2 border-teal-300/50 bg-teal-300/[0.05] px-3 py-2 text-xs leading-5 text-teal-100">가입이 완료되면 입력한 공개명이 공개 랭킹에 <strong>0 / 50</strong>부터 표시됩니다.</p> : null}{loginStatus ? <p role="status" className="border-l-2 border-teal-300/70 bg-teal-300/[0.06] px-3 py-2 text-xs leading-5 text-teal-100">{loginStatus}</p> : null}<button type="submit" disabled={sendingLogin} className="inline-flex w-full items-center justify-center gap-2 bg-teal-300 px-4 py-3 text-sm font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><Mail className="h-4 w-4" />{sendingLogin ? "처리 중" : authMode === "signup" ? "계정 만들기" : "로그인"}</button></form>
        </section>
      </div> : null}
    </header>
  );
}
