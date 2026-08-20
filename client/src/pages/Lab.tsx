import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, Crosshair, Flag, ScanSearch, type LucideIcon } from "lucide-react";
import { challengeById } from "@shared/learning";
import { practiceGuideForNode } from "@/lib/problem-brief";

export default function Lab() {
  const [, params] = useRoute("/lab/:id");
  const [, setLocation] = useLocation();
  const id = Number(params?.id ?? 0);
  const challenge = useMemo(() => challengeById(id), [id]);
  const guide = challenge ? practiceGuideForNode(challenge.id) : null;

  if (!challenge || !guide) return <MissingLab onBack={() => setLocation("/problems")} />;

  return <div className="min-h-screen bg-[#061012] text-[#e7f2ef]"><header className="border-b border-[#294247] bg-[#071316]"><div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6"><button onClick={() => setLocation("/problems")} className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-teal-100"><ArrowLeft className="h-4 w-4" />문제 목록</button><span className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">CASE BRIEF // NODE {String(challenge.id).padStart(2, "0")}</span></div></header><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">{guide.label} // {guide.marker}</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">#{String(challenge.id).padStart(2, "0")} {challenge.title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{challenge.objective}</p><section className="mt-8 grid gap-4 md:grid-cols-3"><Brief Icon={Crosshair} label="조사 목표" text={guide.mission} /><Brief Icon={ScanSearch} label="연결할 증거" text={guide.successCondition} /><Brief Icon={Flag} label="회수 조건" text="증거에서 조사 명령을 구성해 전용 콘솔의 검증기를 통과한 뒤 플래그 아티팩트를 제출합니다." /></section><section className="mt-8 border border-teal-300/30 bg-teal-300/[0.05] p-5"><p className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">CONSOLE ACCESS</p><p className="mt-2 text-sm leading-6 text-slate-200">이 브리프에는 실행 명령이나 플래그가 제공되지 않습니다. 증거 패널을 분석해 조사 동사와 사례 표식을 연결한 뒤, 격리된 전용 콘솔에서 확인하세요.</p><button onClick={() => setLocation(`/workspace/${challenge.id}`)} className="mt-5 inline-flex items-center gap-2 bg-teal-300 px-4 py-3 text-sm font-semibold text-[#092024] transition hover:bg-teal-200"><ArrowRight className="h-4 w-4" />WARGAME CONSOLE OPEN</button></section></main></div>;
}

function Brief({ Icon, label, text }: { Icon: LucideIcon; label: string; text: string }) {
  return <div className="border border-[#345157] bg-[#0c191c] p-4"><div className="flex items-center gap-2 text-teal-300"><Icon className="h-4 w-4" /><span className="font-mono-ui text-[10px] tracking-[0.14em]">{label}</span></div><p className="mt-3 text-sm leading-6 text-slate-300">{text}</p></div>;
}

function MissingLab({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#061012] p-6 text-center text-slate-100"><div><p className="font-mono-ui text-xs tracking-[0.2em] text-teal-300">NODE NOT AVAILABLE</p><h1 className="mt-3 text-2xl font-semibold">요청한 문제를 찾을 수 없습니다.</h1><button onClick={onBack} className="mt-6 border border-teal-300/40 px-4 py-2 text-sm text-teal-100">문제 목록으로 돌아가기</button></div></main>;
}
