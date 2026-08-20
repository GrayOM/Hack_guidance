import { useEffect, useMemo, useState } from "react";
import { Command, Play, RotateCcw, ShieldCheck, TerminalSquare } from "lucide-react";
import type { LearningChallenge } from "@shared/learning";
import { practiceGuideForNode, type ProblemBrief } from "@/lib/problem-brief";
import { usePracticeProbe } from "@/hooks/useLearningApi";

const operationCopy: Record<ProblemBrief["operation"], { label: string; description: string }> = {
  inspect: { label: "INSPECT", description: "증거에 남은 설정·메타데이터·응답 신호를 읽어보세요." },
  replay: { label: "REPLAY", description: "안전한 로컬 요청 사본에서 경계를 재현해 보세요." },
  trace: { label: "TRACE", description: "값이 신뢰 경계를 통과하는 경로를 추적해 보세요." },
  probe: { label: "PROBE", description: "격리된 사례에서 인가 또는 자원 경계를 확인해 보세요." },
  report: { label: "REPORT", description: "증거를 사실 중심의 짧은 조사 결과로 정리해 보세요." },
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function PracticeWorkbench({ challenge, onCapture }: { challenge: LearningChallenge; onCapture?: (flag: string) => void }) {
  const guide = practiceGuideForNode(challenge.id);
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("[CONSOLE READY]\n증거 패널을 읽고, 조사 도구와 사례 표식을 조합한 명령을 입력하세요.");
  const practice = usePracticeProbe({
    onSuccess: result => {
      const serverLine = result.verified && result.capture
        ? `[ARTIFACT RECOVERED]\n${result.message}\n\nFLAG ARTIFACT\n${result.capture}`
        : `[LAB RESPONSE]\n${result.message}`;
      setOutput(current => `${current}\n\n${serverLine}`);
      if (result.verified && result.capture) onCapture?.(result.capture);
    },
    onError: () => setOutput(current => `${current}\n\n[LAB ERROR]\n실습 응답을 확인하지 못했습니다. 로그인 상태와 연결을 확인해 주세요.`),
  });

  useEffect(() => {
    setCommand("");
    setOutput("[CONSOLE READY]\n증거 패널을 읽고, 조사 도구와 사례 표식을 조합한 명령을 입력하세요.");
  }, [challenge.id, guide?.marker]);

  const localPreview = useMemo(() => {
    const input = normalize(command);
    if (!input) return "[WAITING]\n명령이 입력되면 로컬 콘솔에서 요청 형태를 먼저 확인합니다.";
    return [
      "[LOCAL COMMAND BUS]",
      `node: ${String(challenge.id).padStart(2, "0")}`,
      `submitted: ${input}`,
      "scope: isolated training environment",
      "status: transmitted to server-side verifier",
    ].join("\n");
  }, [challenge.id, command]);

  if (!guide) return null;
  const protocol = operationCopy[guide.operation];
  const runSimulation = () => {
    if (!normalize(command)) {
      setOutput("[INPUT REQUIRED]\n증거에서 조사 동사와 사례 표식을 찾아 명령을 입력하세요.");
      return;
    }
    setOutput(localPreview);
    practice.mutate({ problemId: challenge.id, method: guide.operation.toUpperCase(), input: command });
  };
  const resetSimulation = () => {
    setCommand("");
    setOutput("[CONSOLE RESET]\n새 조사 명령을 입력할 수 있습니다.");
  };

  return <section className="min-w-0 border border-teal-300/30 bg-[#0b191c] p-4 shadow-[inset_0_0_0_1px_rgba(45,212,191,.04)]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#294247] pb-3"><div><p className="font-mono-ui text-[10px] tracking-[0.15em] text-teal-300">WARGAME COMMAND CONSOLE</p><p className="mt-1 text-xs leading-5 text-slate-400">{protocol.description}</p></div><span className="inline-flex items-center gap-1 border border-teal-300/25 bg-teal-300/[0.06] px-2 py-1 font-mono-ui text-[9px] tracking-wider text-teal-100"><ShieldCheck className="h-3 w-3" />LOCAL ONLY</span></div>
    <div className="mt-4 grid gap-3 border border-[#294247] bg-[#071316] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="font-mono-ui text-[9px] tracking-[0.15em] text-teal-300">LAB PROTOCOL</p><p className="mt-2 text-xs leading-5 text-slate-400">사용 가능한 조사 동사: <span className="font-mono-ui text-teal-100">INSPECT · REPLAY · TRACE · PROBE · REPORT</span></p><p className="mt-1 text-xs leading-5 text-slate-400">현재 사례 표식: <span className="font-mono-ui text-amber-100">{guide.marker}</span></p></div><div className="border-t border-[#294247] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><p className="font-mono-ui text-[9px] tracking-[0.15em] text-slate-500">OPERATION CLASS</p><p className="mt-1 inline-flex items-center gap-1.5 font-mono-ui text-xs text-teal-200"><TerminalSquare className="h-3.5 w-3.5" />{protocol.label}</p></div></div>
    <label className="mt-4 block"><span className="font-mono-ui text-[9px] tracking-[0.12em] text-slate-500">COMMAND INPUT</span><div className="mt-1 flex items-center border border-[#31545a] bg-[#071316] focus-within:border-teal-300"><Command className="ml-3 h-4 w-4 shrink-0 text-teal-300" /><input value={command} onChange={event => setCommand(event.target.value)} onKeyDown={event => { if (event.key === "Enter") runSimulation(); }} placeholder="조사 명령 입력" className="h-11 min-w-0 flex-1 bg-transparent px-3 font-mono-ui text-xs text-slate-100 outline-none placeholder:text-slate-600" /></div></label>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={runSimulation} disabled={practice.isPending} className="inline-flex items-center gap-1.5 bg-teal-300 px-3 py-2 text-xs font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><Play className="h-3.5 w-3.5" />{practice.isPending ? "검증 중" : "명령 실행"}</button><button type="button" onClick={resetSimulation} className="inline-flex items-center gap-1.5 border border-[#31545a] px-3 py-2 text-xs text-slate-300 transition hover:border-teal-300/60 hover:text-teal-100"><RotateCcw className="h-3.5 w-3.5" />콘솔 초기화</button></div>
    <pre aria-live="polite" className="mt-4 max-w-full overflow-x-auto border border-[#294247] bg-[#071316] p-3 font-mono-ui text-[11px] leading-5 text-slate-200">{output}</pre><p className="mt-3 text-[11px] leading-5 text-slate-500">이 콘솔은 외부 시스템을 대상으로 요청을 보내거나 코드를 실행하지 않습니다. 각 문제의 서버 측 검증기는 제출한 플래그와 별도로 동작합니다.</p>
  </section>;
}
