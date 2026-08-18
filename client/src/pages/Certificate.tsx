/**
 * Design reminder — Signal Room Console: completion is a verifiable learning record, never a game reward.
 */
import { useLocation } from "wouter";
import { ArrowLeft, Award, CheckCircle2, FileCheck2, KeyRound, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";

export default function Certificate() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const dashboard = trpc.learning.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const issue = trpc.learning.issueCertificate.useMutation({
    onSuccess: result => {
      if (result.issued) toast.success(`수료 기록을 발급했습니다. 인증번호: ${result.certificateCode}`);
      else if (result.remaining) toast.message(`아직 수료 요건이 남아 있습니다. 문제 ${result.remaining.modules}개, 방어 노트 ${result.remaining.defense}개, 평가 ${result.remaining.assessments}개를 완료해 주세요.`);
    },
    onError: () => toast.error("수료 기록을 확인하지 못했습니다."),
  });

  if (!isAuthenticated) {
    return <main className="grid min-h-screen place-items-center bg-[#091014] p-6 text-center text-slate-100"><div className="max-w-md"><LockKeyhole className="mx-auto h-8 w-8 text-teal-300" /><p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">COMPLETION RECORD</p><h1 className="mt-3 text-2xl font-semibold">수료 기록은 로그인 후 확인할 수 있습니다.</h1><p className="mt-3 text-sm leading-6 text-slate-400">개인별 문제 완료 기록, 평가 결과, 방어 노트 학습 상태를 바탕으로 수료 여부를 계산합니다.</p><button onClick={startLogin} className="mt-6 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024]">로그인하여 수료 현황 확인</button></div></main>;
  }

  const completed = dashboard.data?.completedIds.length ?? 0;
  const defense = dashboard.data?.defenseReviewedIds.length ?? 0;
  const assessments = dashboard.data?.passedLevels.length ?? 0;
  const certificate = dashboard.data?.certificate;
  const eligible = completed >= 50 && defense >= 50 && assessments >= 5;
  return <div className="min-h-screen bg-[#091014] text-[#e7f2ef]"><header className="border-b border-[#294247] bg-[#0b1316]"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-teal-100"><ArrowLeft className="h-4 w-4" />학습 대시보드</button><button onClick={() => setLocation("/verify")} className="text-xs text-teal-200 transition hover:text-teal-100">인증번호 공개 확인</button></div></header><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">WEB SECURITY FUNDAMENTALS</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">수료 기록 및 인증번호</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">수료 기록은 50개 실습 문제, 5개 레벨 평가, 각 문제의 방어 기준 확인을 모두 완료한 학습자에게 발급됩니다. 이는 Hack Guidance 과정의 학습 완료 기록이며 공인 자격증이 아닙니다.</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Requirement icon={<FileCheck2 className="h-4 w-4" />} label="학습 문제" value={`${completed} / 50`} met={completed >= 50} /><Requirement icon={<ShieldIcon />} label="방어 기준" value={`${defense} / 50`} met={defense >= 50} /><Requirement icon={<Award className="h-4 w-4" />} label="레벨 평가" value={`${assessments} / 5`} met={assessments >= 5} /></div><section className="relative mt-8 overflow-hidden rounded-xl border border-[#335158] bg-[#101b1e] p-6 sm:p-8"><img src="/manus-storage/hg-certificate-mark_099b5170.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-screen" /><div className="relative"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] tracking-[0.18em] text-teal-300">CERTIFICATE STATUS</p><h2 className="mt-2 text-xl font-semibold text-white">{certificate ? "수료 기록이 발급되었습니다." : eligible ? "수료 요건을 모두 충족했습니다." : "수료 요건을 진행 중입니다."}</h2></div><span className={`rounded border px-2.5 py-1 font-mono-ui text-[10px] ${certificate || eligible ? "border-teal-300/35 bg-teal-300/10 text-teal-100" : "border-[#466064] text-slate-400"}`}>{certificate ? "ISSUED" : eligible ? "READY" : "IN PROGRESS"}</span></div>{certificate ? <div className="mt-7 rounded-lg border border-teal-300/25 bg-teal-300/[0.06] p-5"><div className="flex items-center gap-2 text-teal-100"><KeyRound className="h-4 w-4" /><span className="font-mono-ui text-xs tracking-[0.12em]">VERIFICATION CODE</span></div><p className="mt-3 font-mono-ui text-2xl tracking-[0.08em] text-white">{certificate.certificateCode}</p><p className="mt-3 text-sm text-slate-400">발급일: {new Date(certificate.issuedAt).toLocaleDateString("ko-KR")}</p><button onClick={() => setLocation(`/certificate/print/${certificate.certificateCode}`)} className="mt-5 inline-flex items-center gap-2 rounded-md border border-teal-300/40 px-3 py-2 text-xs font-medium text-teal-100 transition hover:bg-teal-300/10"><FileCheck2 className="h-3.5 w-3.5" />수료증 보기 및 인쇄</button></div> : <button onClick={() => issue.mutate()} disabled={issue.isPending} className="mt-7 inline-flex items-center gap-2 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{issue.isPending ? "수료 요건 확인 중" : "수료 기록 발급 가능 여부 확인"}</button>}</div></section></main></div>;
}

function ShieldIcon() { return <CheckCircle2 className="h-4 w-4" />; }
function Requirement({ icon, label, value, met }: { icon: React.ReactNode; label: string; value: string; met: boolean }) { return <div className="rounded-xl border border-[#314d52] bg-[#101b1e] p-5"><div className={`flex items-center gap-2 ${met ? "text-teal-300" : "text-slate-500"}`}>{icon}<span className="font-mono-ui text-[10px] tracking-[0.14em]">{label}</span></div><p className="mt-4 text-2xl font-semibold text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{met ? "충족" : "진행 중"}</p></div>; }
