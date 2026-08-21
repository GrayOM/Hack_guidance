import { ArchiveX } from "lucide-react";
import { useLocation } from "wouter";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Certificate() {
  const [, setLocation] = useLocation();
  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-slate-100"><ConsoleNav /><main className="grid min-h-[calc(100vh-5rem)] place-items-center p-6 text-center"><section className="max-w-md"><ArchiveX className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-slate-500">CLEARANCE ARCHIVE // RESET</p><h1 className="mt-3 text-2xl font-semibold">발급 가능한 수료 기록이 없습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">기존 문제 인벤토리가 초기화되어 수료 조건과 발급 기록도 새 문제 설계가 확정되기 전까지 비활성화되었습니다.</p><button onClick={() => setLocation("/problems")} className="mt-6 border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 상태 보기</button></section></main></div>;
}
