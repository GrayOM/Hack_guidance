/**
 * Design reminder — Signal Room Console: a safe challenge terminal, not an exploit terminal.
 */
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Check, ChevronRight, CircleHelp, FileSearch, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { challengeById } from "@shared/learning";
import { SignalLockOverlay } from "@/components/SignalLockOverlay";

export default function Lab() {
  const [, params] = useRoute("/lab/:id");
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const id = Number(params?.id ?? 0);
  const challenge = useMemo(() => challengeById(id), [id]);
  const [flag, setFlag] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [defenseReviewed, setDefenseReviewed] = useState(false);
  const utils = trpc.useUtils();
  const submit = trpc.learning.submit.useMutation({
    onSuccess: result => {
      if (result.correct) {
        setIsCorrect(true);
        toast.success(result.message);
        void utils.learning.dashboard.invalidate();
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error("해결 시도를 기록하지 못했습니다. 로그인 상태와 연결을 확인해 주세요."),
  });
  const reviewDefense = trpc.learning.reviewDefense.useMutation({
    onSuccess: () => {
      setDefenseReviewed(true);
      toast.success("대응 노트 확인 기록을 저장했습니다.");
      void utils.learning.dashboard.invalidate();
    },
    onError: () => toast.error("방어 기준을 저장하지 못했습니다."),
  });

  if (!challenge) {
    return <MissingLab onBack={() => setLocation("/")} />;
  }

  const showNextHint = () => setHintCount(count => Math.min(count + 1, challenge.hints.length));
  const nextNode = challenge.id < 50 ? challenge.id + 1 : null;
  const submitFlag = () => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!flag.trim()) {
      toast.message("확보한 플래그를 입력해 주세요.");
      return;
    }
    submit.mutate({ problemId: challenge.id, flag, hintCount });
  };

  return (
    <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef] selection:bg-teal-300/30">
      <SignalLockOverlay active={isCorrect} nodeId={challenge.id} />
      <div className="pointer-events-none fixed inset-0 console-grid opacity-45" />
      <header className="hnet-header sticky top-0 z-30 border-b border-[#294247] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-teal-100"><ArrowLeft className="h-4 w-4" />문제 보드</button>
          <div className="flex items-center gap-3"><span className="hidden font-mono-ui text-[10px] tracking-[0.16em] text-slate-500 sm:block">SECTOR {challenge.level} / NODE {String(challenge.id).padStart(2, "0")}</span><span className="rounded border border-teal-300/25 bg-teal-300/10 px-2 py-1 font-mono-ui text-[10px] text-teal-100">SAFE NODE</span></div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-[#294247] pb-5">
          <div><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CHALLENGE TERMINAL / SAFE SIMULATION</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">#{String(challenge.id).padStart(2, "0")} {challenge.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{challenge.objective}</p></div>
          <div className="rounded-lg border border-[#314d52] bg-[#111d20] px-3 py-2.5"><p className="font-mono-ui text-[9px] tracking-wider text-slate-500">OPERATOR</p><p className="mt-1 text-sm text-teal-100">{loading ? "연결 확인 중" : isAuthenticated ? (user?.name ?? "분석자") : "로그인 필요"}</p></div>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#345157] bg-[#101b1e]">
            <div className="flex items-center justify-between border-b border-[#294247] px-5 py-4"><div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-xs tracking-[0.14em] text-slate-200">EVIDENCE REVIEW</span></div><span className="font-mono-ui text-[10px] text-slate-500">{challenge.category}</span></div>
            <div className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <div className="min-w-0 rounded-lg border border-[#2b484e] bg-[#0a1316] p-4 dot-grid"><p className="font-mono-ui text-[10px] tracking-[0.15em] text-slate-500">{challenge.evidenceLabel.toUpperCase()}</p><pre className="mt-4 max-w-full overflow-x-auto rounded-md border border-[#2b4549] bg-[#0e181b] p-4 font-mono-ui text-xs leading-6 text-slate-200">{challenge.evidence.join("\n")}</pre><p className="mt-4 text-xs leading-5 text-slate-400">이 화면은 학습 목적의 읽기 전용 시뮬레이션입니다. 외부 시스템에 요청을 보내지 않습니다.</p></div>
              <div className="min-w-0 overflow-hidden rounded-lg border border-[#2c474d] bg-[#132124] p-4"><p className="font-mono-ui text-[10px] tracking-[0.15em] text-teal-300">FLAG SUBMISSION</p><h2 className="mt-3 break-words text-lg font-medium leading-7 text-white">{challenge.question}</h2><p className="mt-3 text-sm leading-6 text-slate-400">증거를 분석해 플래그를 확보한 뒤 제출하세요. 형식: <span className="font-mono-ui text-teal-200">HG&#123;...&#125;</span></p><label className="mt-5 block"><span className="font-mono-ui text-[10px] tracking-[0.14em] text-slate-500">CAPTURED FLAG</span><input value={flag} onChange={event => setFlag(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitFlag(); }} placeholder="HG{...}" className="mt-2 h-12 w-full rounded-none border border-[#3a6061] bg-[#071316] px-3 font-mono-ui text-sm tracking-[0.04em] text-teal-50 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#294247] bg-[#0d171a] px-5 py-4"><p className="text-xs text-slate-500">플래그는 이 문제의 해결 기록에만 사용되며, 안전한 시뮬레이션 안에서 검증됩니다.</p>{isCorrect ? (nextNode ? <button onClick={() => setLocation(`/lab/${nextNode}`)} className="inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200"><ChevronRight className="h-4 w-4" />다음 문제 열기</button> : <span className="inline-flex items-center gap-2 border border-teal-300/40 px-4 py-2.5 text-sm font-semibold text-teal-100"><Check className="h-4 w-4" />FINAL GRID CLEAR</span>) : <button onClick={submitFlag} disabled={submit.isPending} className="inline-flex items-center gap-2 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submit.isPending ? "검증 중" : "플래그 제출"}</button>}</div>
          </section>

          <aside className="space-y-5">
            <section className="panel-surface rounded-xl border border-[#345157] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-amber-200" /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-200">INTEL DROPS</span></div><span className="font-mono-ui text-[10px] text-slate-500">{hintCount}/3</span></div>{hintCount === 0 ? <p className="mt-4 text-sm leading-6 text-slate-400">단서는 답을 대신하지 않고, 다음에 확인할 증거를 안내합니다.</p> : <div className="mt-4 space-y-2">{challenge.hints.slice(0, hintCount).map((hint, index) => <p key={hint} className="rounded-md border border-amber-200/15 bg-amber-100/[0.06] p-3 text-xs leading-5 text-amber-50"><span className="mr-2 font-mono-ui text-amber-200">0{index + 1}</span>{hint}</p>)}</div>}<button onClick={showNextHint} disabled={hintCount >= 3} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-200 transition hover:text-teal-100 disabled:cursor-not-allowed disabled:text-slate-600"><ChevronRight className="h-3.5 w-3.5" />{hintCount ? "다음 단서 열기" : "첫 번째 단서 열기"}</button></section>
            <section className={`rounded-xl border p-5 transition ${isCorrect ? "border-teal-300/45 bg-teal-300/[0.06]" : "border-[#314d52] bg-[#101b1e]"}`}><div className="flex items-center gap-2"><LockKeyhole className={`h-4 w-4 ${isCorrect ? "text-teal-300" : "text-slate-500"}`} /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-200">POST-SOLVE NOTE</span></div>{isCorrect ? <><p className="mt-4 text-sm leading-6 text-slate-200">{challenge.defense}</p><button onClick={() => reviewDefense.mutate({ problemId: challenge.id })} disabled={defenseReviewed || reviewDefense.isPending} className="mt-4 inline-flex items-center gap-2 rounded-md border border-teal-300/40 px-3 py-2 text-xs font-medium text-teal-100 transition hover:bg-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60">{defenseReviewed ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{defenseReviewed ? "대응 노트 확인 완료" : "대응 노트 확인으로 표시"}</button></> : <p className="mt-4 text-sm leading-6 text-slate-500">문제를 해결하면 이 문제의 대응 노트를 확인할 수 있습니다.</p>}</section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function MissingLab({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#091014] p-6 text-center text-slate-100"><div><p className="font-mono-ui text-xs tracking-[0.2em] text-teal-300">NODE NOT AVAILABLE</p><h1 className="mt-3 text-2xl font-semibold">요청한 문제를 찾을 수 없습니다.</h1><p className="mt-2 text-sm text-slate-400">문제 보드에서 제공되는 노드를 선택해 주세요.</p><button onClick={onBack} className="mt-6 rounded-md border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 보드로 돌아가기</button></div></main>;
}
