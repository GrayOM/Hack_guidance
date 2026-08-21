import { ArchiveX, BookCheck } from "lucide-react";
import { useLocation } from "wouter";
import { usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Records() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  if (!isAuthenticated) return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-slate-100"><ConsoleNav /><main className="grid place-items-center p-6 pt-28 text-center"><div className="max-w-md"><BookCheck className="mx-auto h-8 w-8 text-teal-300" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">OPERATOR HISTORY</p><h1 className="mt-3 text-2xl font-semibold">개인 기록은 로그인 후 확인할 수 있습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">계정 프로필과 이후 새로 등록될 문제의 기록을 이곳에서 관리합니다.</p><button onClick={startPlatformLogin} className="mt-6 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024]">로그인</button></div></main></div>;
  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="grid min-h-[calc(100vh-5rem)] place-items-center p-6 text-center"><section className="max-w-md"><ArchiveX className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-slate-500">OPERATOR HISTORY // EMPTY</p><h1 className="mt-3 text-2xl font-semibold">표시할 문제 기록이 없습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">기존 해결 기록은 초기화되었습니다. 새 문제 인벤토리가 등록되면 이후 기록이 이곳에 쌓입니다.</p><button onClick={() => setLocation("/problems")} className="mt-6 border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 상태 보기</button></section></main></div>;
}
