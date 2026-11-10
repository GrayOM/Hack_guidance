import { ArchiveX, ArrowLeft, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Problems() {
  const [, setLocation] = useLocation();
  return <div className="hacknet-shell min-h-screen bg-[#06090e] text-[#e7f2eb]"><ConsoleNav /><main className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-3xl place-items-center px-5 py-14"><section className="w-full border border-[#30583f] bg-[#0b0f1a] p-8 text-center sm:p-12"><ArchiveX className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-6 font-mono-ui text-[10px] tracking-[0.2em] text-green-300">OPERATION AVAILABLE // BLACK TRACE</p><h1 className="mt-3 text-2xl font-semibold text-white">브라우저 흔적 조사 작전이 열렸습니다.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">서버가 이미 내려보낸 HTML·저장소·응답을 읽어 첫 거점을 장악하세요.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 border border-green-300/45 px-4 py-2.5 text-sm text-green-100 transition hover:border-green-300 hover:bg-green-300/[0.08]"><ArrowLeft className="h-4 w-4" />메인으로 돌아가기</button><button onClick={() => setLocation("/black-trace")} className="inline-flex items-center gap-2 bg-green-300 px-4 py-2.5 text-sm font-semibold text-[#0b1326] transition hover:bg-green-200">작전 시작 <ArrowUpRight className="h-4 w-4" /></button></div></section></main></div>;
}
