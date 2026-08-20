import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Check, ChevronRight, CircleHelp, FileSearch, Flag, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { challengeById } from "@shared/learning";
import { PracticeWorkbench } from "@/components/PracticeWorkbench";
import { SignalLockOverlay } from "@/components/SignalLockOverlay";
import { practiceGuideForNode } from "@/lib/problem-brief";
import { usePlatformAuth, startPlatformLogin } from "@/hooks/usePlatformAuth";
import { useReviewDefense, useSubmitFlag } from "@/hooks/useLearningApi";

export default function Workspace() {
  const [, params] = useRoute("/workspace/:id");
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = usePlatformAuth();
  const id = Number(params?.id ?? 0);
  const challenge = useMemo(() => challengeById(id), [id]);
  const guide = challenge ? practiceGuideForNode(challenge.id) : null;
  const [flag, setFlag] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [defenseReviewed, setDefenseReviewed] = useState(false);
  const queryClient = useQueryClient();
  const submit = useSubmitFlag({
    onSuccess: result => {
      if (result.correct) {
        setIsCorrect(true);
        toast.success(result.message);
        void queryClient.invalidateQueries();
      } else toast.error(result.message);
    },
    onError: () => toast.error("플래그 제출을 기록하지 못했습니다. 로그인 상태와 연결을 확인해 주세요."),
  });
  const reviewDefense = useReviewDefense({
    onSuccess: () => {
      setDefenseReviewed(true);
      toast.success("대응 노트 확인 기록을 저장했습니다.");
      void queryClient.invalidateQueries();
    },
    onError: () => toast.error("대응 기준을 저장하지 못했습니다."),
  });

  if (!challenge || !guide) return <MissingWorkspace onBack={() => setLocation("/problems")} />;
  const nextNode = challenge.id < 50 ? challenge.id + 1 : null;
  const submitFlag = () => {
    if (!isAuthenticated) {
      startPlatformLogin();
      return;
    }
    if (!flag.trim()) {
      toast.message("문제 공간에서 캡처한 플래그를 먼저 확보해 주세요.");
      return;
    }
    submit.mutate({ problemId: challenge.id, flag, hintCount });
  };

  return <div className="min-h-screen bg-[#061012] text-[#e7f2ef] selection:bg-teal-300/30">
    <SignalLockOverlay active={isCorrect} nodeId={challenge.id} />
    <header className="sticky top-0 z-30 border-b border-[#294247] bg-[#071316]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between px-4 sm:px-6"><button onClick={() => setLocation(`/lab/${challenge.id}`)} className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-teal-100"><ArrowLeft className="h-4 w-4" />문제 안내</button><div className="text-right"><p className="font-mono-ui text-[9px] tracking-[0.18em] text-teal-300">ISOLATED PRACTICE SPACE</p><p className="mt-0.5 font-mono-ui text-[10px] text-slate-500">NODE {String(challenge.id).padStart(2, "0")} // {guide.label}</p></div></div>
    </header>
    <main className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:py-8">
      <section className="mb-6 border border-[#345157] bg-[#0c191c] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">MISSION // {challenge.category.toUpperCase()}</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">#{String(challenge.id).padStart(2, "0")} {challenge.title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{challenge.objective}</p></div><div className="border border-[#31545a] bg-[#071316] px-3 py-2"><p className="font-mono-ui text-[9px] tracking-wider text-slate-500">OPERATOR</p><p className="mt-1 text-sm text-teal-100">{loading ? "연결 확인 중" : isAuthenticated ? (user?.name ?? "분석자") : "로그인 필요"}</p></div></div><div className="mt-5 grid gap-3 border-t border-[#294247] pt-4 md:grid-cols-3"><BriefCard label="01 // 조작할 대상" value={guide.action} /><BriefCard label="02 // 확인할 결과" value={guide.successCondition} /><BriefCard label="03 // 완료 기준" value="문제 공간에서 받은 플래그를 아래 입력란에 제출합니다." /></div></section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-5"><section className="overflow-hidden border border-[#345157] bg-[#0c191c]"><div className="flex items-center justify-between border-b border-[#294247] px-5 py-4"><div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-xs tracking-[0.14em] text-slate-200">CONTROLLED EVIDENCE</span></div><span className="font-mono-ui text-[10px] text-slate-500">{challenge.evidenceLabel}</span></div><pre className="m-5 max-w-full overflow-x-auto border border-[#2b4549] bg-[#071316] p-4 font-mono-ui text-xs leading-6 text-slate-200">{challenge.evidence.join("\n")}</pre></section><PracticeWorkbench challenge={challenge} onCapture={captured => { setFlag(captured); toast.success("플래그를 캡처했습니다. 아래에서 제출해 해결을 기록하세요."); }} /><section className="border border-[#345157] bg-[#0c191c] p-5"><div className="flex items-center gap-2"><Flag className="h-4 w-4 text-teal-300" /><span className="font-mono-ui text-xs tracking-[0.14em] text-slate-200">FINAL SUBMISSION</span></div><p className="mt-3 text-sm leading-6 text-slate-400">문제 공간에서 확인한 플래그만 제출하세요. 플래그 검증은 서버에서만 수행됩니다.</p><label className="mt-4 block"><span className="font-mono-ui text-[10px] tracking-[0.14em] text-slate-500">CAPTURED FLAG</span><input value={flag} onChange={event => setFlag(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitFlag(); }} placeholder="HG{...}" className="mt-2 h-12 w-full border border-[#3a6061] bg-[#071316] px-3 font-mono-ui text-sm tracking-[0.04em] text-teal-50 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">선택형 답안은 제공되지 않습니다.</p>{isCorrect ? (nextNode ? <button onClick={() => setLocation(`/lab/${nextNode}`)} className="inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200"><ChevronRight className="h-4 w-4" />다음 문제 안내</button> : <span className="inline-flex items-center gap-2 border border-teal-300/40 px-4 py-2.5 text-sm font-semibold text-teal-100"><Check className="h-4 w-4" />FINAL GRID CLEAR</span>) : <button onClick={submitFlag} disabled={submit.isPending} className="inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submit.isPending ? "검증 중" : "플래그 제출"}</button>}</div></section></section>
        <aside className="space-y-5"><section className="border border-[#345157] bg-[#0c191c] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CircleHelp className="h-4 w-4 text-amber-200" /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-200">INTEL DROPS</span></div><span className="font-mono-ui text-[10px] text-slate-500">{hintCount}/3</span></div>{hintCount === 0 ? <p className="mt-4 text-sm leading-6 text-slate-400">막혔을 때만 단서를 열어 다음에 확인할 지점을 좁혀 보세요.</p> : <div className="mt-4 space-y-2">{challenge.hints.slice(0, hintCount).map((hint, index) => <p key={hint} className="border border-amber-200/15 bg-amber-100/[0.06] p-3 text-xs leading-5 text-amber-50"><span className="mr-2 font-mono-ui text-amber-200">0{index + 1}</span>{hint}</p>)}</div>}<button onClick={() => setHintCount(count => Math.min(count + 1, challenge.hints.length))} disabled={hintCount >= 3} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-200 transition hover:text-teal-100 disabled:cursor-not-allowed disabled:text-slate-600"><ChevronRight className="h-3.5 w-3.5" />{hintCount ? "다음 단서 열기" : "첫 번째 단서 열기"}</button></section><section className={`border p-5 ${isCorrect ? "border-teal-300/45 bg-teal-300/[0.06]" : "border-[#314d52] bg-[#101b1e]"}`}><div className="flex items-center gap-2"><LockKeyhole className={`h-4 w-4 ${isCorrect ? "text-teal-300" : "text-slate-500"}`} /><span className="font-mono-ui text-xs tracking-[0.12em] text-slate-200">POST-SOLVE NOTE</span></div>{isCorrect ? <><p className="mt-4 text-sm leading-6 text-slate-200">{challenge.defense}</p><button onClick={() => reviewDefense.mutate({ problemId: challenge.id })} disabled={defenseReviewed || reviewDefense.isPending} className="mt-4 inline-flex items-center gap-2 border border-teal-300/40 px-3 py-2 text-xs font-medium text-teal-100 transition hover:bg-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60">{defenseReviewed ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{defenseReviewed ? "대응 노트 확인 완료" : "대응 노트 확인으로 표시"}</button></> : <p className="mt-4 text-sm leading-6 text-slate-500">문제를 해결하면 이 문제의 대응 노트를 확인할 수 있습니다.</p>}</section></aside>
      </div>
    </main>
  </div>;
}

function BriefCard({ label, value }: { label: string; value: string }) {
  return <div className="border border-[#294247] bg-[#071316] p-3"><p className="font-mono-ui text-[9px] tracking-[0.14em] text-teal-300">{label}</p><p className="mt-2 text-xs leading-5 text-slate-300">{value}</p></div>;
}

function MissingWorkspace({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#061012] p-6 text-center text-slate-100"><div><p className="font-mono-ui text-xs tracking-[0.2em] text-teal-300">NODE NOT AVAILABLE</p><h1 className="mt-3 text-2xl font-semibold">요청한 문제 공간을 찾을 수 없습니다.</h1><button onClick={onBack} className="mt-6 border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 목록으로 돌아가기</button></div></main>;
}
