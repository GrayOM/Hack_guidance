import { useState } from "react";
import { useLocation } from "wouter";
import { BadgeCheck, Search } from "lucide-react";

export default function VerifyCertificate() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const normalizedCode = code.trim().toUpperCase();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizedCode) return;
    setLocation(`/certificate/print/${encodeURIComponent(normalizedCode)}`);
  };
  return <main className="grid min-h-screen place-items-center bg-[#f2f4f3] p-6 text-slate-800"><section className="w-full max-w-lg rounded-xl border border-[#c8d5d2] bg-[#fbfcfb] p-8 shadow-xl shadow-slate-900/10"><div className="grid h-11 w-11 place-items-center rounded-full border border-teal-700/20 bg-teal-700/5 text-teal-800"><BadgeCheck className="h-5 w-5" /></div><p className="mt-6 font-mono-ui text-[10px] tracking-[0.2em] text-teal-700">HACK GUIDANCE / VERIFY</p><h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">수료 기록 확인</h1><p className="mt-3 text-sm leading-6 text-slate-600">수료증에 기재된 인증번호를 입력하면 과정 완료 기록을 확인할 수 있습니다. 이 확인은 학습 수료 기록을 위한 용도이며 공인 자격 검증이 아닙니다.</p><form onSubmit={submit} className="mt-7"><label htmlFor="certificate-code" className="font-mono-ui text-[10px] tracking-[0.14em] text-slate-500">VERIFICATION CODE</label><div className="mt-2 flex gap-2"><input id="certificate-code" value={code} onChange={event => setCode(event.target.value)} placeholder="HG-WSF-2026-000001" className="h-11 min-w-0 flex-1 rounded-md border border-[#afc0bc] bg-white px-3 font-mono-ui text-sm tracking-[0.04em] outline-none placeholder:text-slate-400 focus:border-teal-700" /><button disabled={!normalizedCode} className="inline-flex items-center gap-2 rounded-md bg-[#0c3437] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" />확인</button></div></form><button onClick={() => setLocation("/")} className="mt-6 text-xs text-slate-500 hover:text-teal-800">학습 대시보드로 돌아가기</button></section></main>;
}
