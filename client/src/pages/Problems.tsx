import { ArchiveX, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Problems() {
  const [, setLocation] = useLocation();
  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-3xl place-items-center px-5 py-14"><section className="w-full border border-[#315057] bg-[#0a1518] p-8 text-center sm:p-12"><ArchiveX className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-6 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CHALLENGE INVENTORY // RESET</p><h1 className="mt-3 text-2xl font-semibold text-white">등록된 문제가 없습니다.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">기존 문제와 교육용 타깃을 모두 초기화했습니다. 새 문제 구조와 시나리오는 처음부터 다시 설계한 뒤 이곳에 등록됩니다.</p><button onClick={() => setLocation("/")} className="mt-8 inline-flex items-center gap-2 border border-teal-300/45 px-4 py-2.5 text-sm text-teal-100 transition hover:border-teal-300 hover:bg-teal-300/[0.08]"><ArrowLeft className="h-4 w-4" />메인으로 돌아가기</button></section></main></div>;
}
