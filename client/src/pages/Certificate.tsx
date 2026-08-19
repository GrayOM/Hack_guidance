import { useLocation } from "wouter";
import { CheckCircle2, FileCheck2, KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
import { useIssueCertificate, useLearningDashboard } from "@/hooks/useLearningApi";
import { ConsoleNav } from "@/components/ConsoleNav";

export default function Certificate() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const dashboard = useLearningDashboard({ enabled: isAuthenticated, retry: false });
  const issue = useIssueCertificate({
    onSuccess: result => {
      if (result.issued) toast.success(`클리어런스 기록을 발급했습니다. 인증번호: ${result.certificateCode}`);
      else toast.message(`FINAL GRID 해금까지 ${result.remaining?.modules ?? 0}개 노드가 남았습니다.`);
    },
    onError: () => toast.error("클리어런스 기록을 확인하지 못했습니다."),
  });

  if (!isAuthenticated) return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-slate-100"><ConsoleNav /><main className="grid place-items-center p-6 pt-28 text-center"><div className="max-w-md"><LockKeyhole className="mx-auto h-8 w-8 text-teal-300" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">FINAL CLEARANCE</p><h1 className="mt-3 text-2xl font-semibold">클리어런스 기록은 로그인 후 해금됩니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">50개 문제를 모두 해결한 분석자에게만 최종 기록이 표시됩니다.</p><button onClick={startPlatformLogin} className="mt-6 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024]">로그인하여 노드 확인</button></div></main></div>;

  const completed = dashboard.data?.completedIds.length ?? 0;
  const certificate = dashboard.data?.certificate;
  if (completed < 50) return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-slate-100"><ConsoleNav /><main className="grid place-items-center p-6 pt-28 text-center"><div className="max-w-md"><LockKeyhole className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-slate-500">FINAL CLEARANCE // LOCKED</p><h1 className="mt-3 text-2xl font-semibold">최종 기록은 아직 해금되지 않았습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">남은 문제를 모두 해결하면 이 노드가 열립니다. 현재 해결: {completed} / 50</p><button onClick={() => setLocation("/problems")} className="mt-6 border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 목록으로 가기</button></div></main></div>;

  return <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]"><ConsoleNav /><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="flex items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">FINAL GRID // CLEARANCE RECORD</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">50개 노드 해결 완료</h1></div><button onClick={() => setLocation("/verify")} className="font-mono-ui text-[10px] tracking-[0.12em] text-teal-200">PUBLIC_VERIFY</button></div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">모든 문제의 플래그가 확인되어 최종 클리어런스 기록을 열 수 있습니다. 이 기록은 Hack Guidance 내부 문제 보드의 해결 완료 상태를 나타냅니다.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><Requirement label="SOLVED NODES" value={`${completed} / 50`} /><Requirement label="FINAL NODE" value="UNLOCKED" /></div><section className="hnet-panel relative mt-8 overflow-hidden border border-[#335158] p-6 sm:p-8"><div className="relative"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] tracking-[0.18em] text-teal-300">CLEARANCE STATUS</p><h2 className="mt-2 text-xl font-semibold text-white">{certificate ? "클리어런스 기록이 발급되었습니다." : "최종 노드가 열렸습니다."}</h2></div><span className="border border-teal-300/35 bg-teal-300/10 px-2.5 py-1 font-mono-ui text-[10px] text-teal-100">{certificate ? "ISSUED" : "READY"}</span></div>{certificate ? <div className="hnet-terminal mt-7 border border-teal-300/25 p-5"><div className="flex items-center gap-2 text-teal-100"><KeyRound className="h-4 w-4" /><span className="font-mono-ui text-xs tracking-[0.12em]">VERIFICATION CODE</span></div><p className="mt-3 font-mono-ui text-2xl tracking-[0.08em] text-white">{certificate.certificateCode}</p><p className="mt-3 text-sm text-slate-400">발급일: {new Date(certificate.issuedAt).toLocaleDateString("ko-KR")}</p><button onClick={() => setLocation(`/certificate/print/${certificate.certificateCode}`)} className="mt-5 inline-flex items-center gap-2 border border-teal-300/40 px-3 py-2 text-xs font-medium text-teal-100"><FileCheck2 className="h-3.5 w-3.5" />클리어런스 기록 보기 및 인쇄</button></div> : <button onClick={() => issue.mutate()} disabled={issue.isPending} className="mt-7 inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{issue.isPending ? "기록 생성 중" : "클리어런스 기록 발급"}</button>}</div></section></main></div>;
}

function Requirement({ label, value }: { label: string; value: string }) { return <div className="hnet-panel border border-[#314d52] p-5"><p className="font-mono-ui text-[10px] tracking-[0.14em] text-teal-300">{label}</p><p className="mt-3 text-2xl font-semibold text-white">{value}</p></div>; }
