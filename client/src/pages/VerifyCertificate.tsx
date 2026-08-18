import { useState } from "react";
import { useLocation } from "wouter";
import { Activity, BadgeCheck, ChevronLeft, Search } from "lucide-react";

export default function VerifyCertificate() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const normalizedCode = code.trim().toUpperCase();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedCode) return;
    setLocation(`/certificate/print/${encodeURIComponent(normalizedCode)}`);
  };
  return <main className="hacknet-shell min-h-screen bg-[#060b0d] p-4 text-[#e7f2ef] sm:p-8"><div className="mx-auto flex max-w-5xl items-center justify-between border-b border-[#294247] pb-4"><button onClick={() => setLocation("/")} className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-teal-100"><ChevronLeft className="h-3.5 w-3.5" />학습 대시보드</button><div className="flex items-center gap-2 font-mono-ui text-[10px] tracking-[0.14em] text-teal-200"><Activity className="h-3.5 w-3.5" />EXTERNAL VERIFY TERMINAL</div></div><section className="hnet-panel mx-auto mt-[12vh] w-full max-w-xl overflow-hidden border border-[#31575a]"><div className="flex items-center justify-between border-b border-[#294247] bg-[#0a1518] px-5 py-3"><div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-[10px] tracking-[0.17em] text-teal-200">HACK // GUIDANCE</span></div><span className="font-mono-ui text-[9px] text-slate-500">VERIFY.01</span></div><div className="p-6 sm:p-8"><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CREDENTIAL CHECK</p><h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">수료 기록 신호 검증</h1><p className="mt-3 text-sm leading-6 text-slate-400">수료증에 기재된 인증번호를 입력하면 과정 완료 기록을 확인할 수 있습니다. 이 확인은 학습 수료 기록을 위한 용도이며 공인 자격 검증이 아닙니다.</p><form onSubmit={submit} className="hnet-terminal mt-7 border p-4"><label htmlFor="certificate-code" className="font-mono-ui text-[10px] tracking-[0.14em] text-slate-500">VERIFICATION CODE</label><div className="mt-2 flex gap-2"><input id="certificate-code" value={code} onChange={event => setCode(event.target.value)} placeholder="HG-WSF-2026-000001" className="h-11 min-w-0 flex-1 rounded-none border border-[#3a6061] bg-[#071316] px-3 font-mono-ui text-sm tracking-[0.04em] text-teal-50 outline-none placeholder:text-slate-600 focus:border-teal-300" /><button disabled={!normalizedCode} className="inline-flex items-center gap-2 bg-teal-300 px-4 text-sm font-semibold text-[#062023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" />신호 검증</button></div></form><p className="mt-4 font-mono-ui text-[10px] text-slate-600">STATUS: WAITING_FOR_CREDENTIAL</p></div></section></main>;
}
