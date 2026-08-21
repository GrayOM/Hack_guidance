import { ArchiveX, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Problems() {
  const [, setLocation] = useLocation();
  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-3xl place-items-center px-5 py-14"><section className="w-full border border-[#315057] bg-[#0a1518] p-8 text-center sm:p-12"><ArchiveX className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-6 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">OPERATION AVAILABLE // BLACK TRACE</p><h1 className="mt-3 text-2xl font-semibold text-white">브라우저 흔적 조사 작전이 열렸습니다.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">개발자도구에 남아 있는 HTML·Cookie·Network·Header 흔적을 조사해 첫 번째 접근 키를 회수하세요.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 border border-teal-300/45 px-4 py-2.5 text-sm text-teal-100 transition hover:border-teal-300 hover:bg-teal-300/[0.08]"><ArrowLeft className="h-4 w-4" />메인으로 돌아가기</button><button onClick={() => setLocation("/black-trace")} className="inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200">작전 시작 <ArrowUpRight className="h-4 w-4" /></button></div></section></main></div>;
}
