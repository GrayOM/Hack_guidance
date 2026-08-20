import { useEffect, useMemo, useState } from "react";
import { Play, RotateCcw, ShieldCheck } from "lucide-react";
import type { LearningChallenge } from "@shared/learning";
import { practiceTrackForNode, type PracticeTrack } from "@/lib/practice-workspace";
import { practiceGuideForNode } from "@/lib/problem-brief";
import { usePracticeProbe } from "@/hooks/useLearningApi";

const trackCopy: Record<PracticeTrack, { label: string; instruction: string; placeholder: string }> = {
  surface: { label: "SOURCE & STORAGE INSPECTOR", instruction: "표시 방식과 브라우저가 보관하는 값을 분리해 관찰하세요.", placeholder: "role=admin" },
  request: { label: "LOCAL REQUEST REPLAY", instruction: "외부로 전송되지 않는 요청 사본에서 경로·메서드·입력값을 바꿔 보세요.", placeholder: "topic=session" },
  input: { label: "SAFE OUTPUT SANDBOX", instruction: "입력값이 데이터로 취급되는지, 출력 문맥에 맞게 처리되는지 비교하세요.", placeholder: "<sample>" },
  access: { label: "AUTHORIZATION GATE", instruction: "리소스 식별자와 현재 권한을 구분해 서버가 확인해야 할 경계를 살펴보세요.", placeholder: "104" },
  report: { label: "EVIDENCE NOTEBOARD", instruction: "관찰한 사실·추정·권장 조치를 분리해 짧은 분석 기록을 작성하세요.", placeholder: "fact: response header" },
};

const escapeText = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function PracticeWorkbench({ challenge, onCapture }: { challenge: LearningChallenge; onCapture?: (flag: string) => void }) {
  const track = practiceTrackForNode(challenge.id) ?? "report";
  const copy = trackCopy[track];
  const guide = practiceGuideForNode(challenge.id);
  const [method, setMethod] = useState("GET");
  const [input, setInput] = useState(guide?.practiceInput ?? "");
  const [output, setOutput] = useState("[READY] 문제 안내의 조작 대상을 입력한 뒤 시뮬레이션을 실행하세요.");
  const practice = usePracticeProbe({
    onSuccess: result => {
      const serverLine = result.verified ? `[SANDBOX VERIFIED]\n${result.message}\n\nCAPTURED FLAG\n${result.capture}` : `[SANDBOX RESPONSE]\n${result.message}`;
      setOutput(current => `${current}\n\n${serverLine}`);
      if (result.verified && result.capture) onCapture?.(result.capture);
    },
    onError: () => setOutput(current => `${current}\n\n[SANDBOX ERROR]\n실습 응답을 확인하지 못했습니다. 로그인 상태와 연결을 확인해 주세요.`),
  });

  useEffect(() => {
    setMethod("GET");
    setInput(guide?.practiceInput ?? "");
    setOutput("[READY] 문제 안내의 조작 대상을 입력한 뒤 시뮬레이션을 실행하세요.");
  }, [challenge.id, guide?.practiceInput]);

  const simulatedResponse = useMemo(() => {
    const value = input.trim() || "(값 없음)";
    const evidence = challenge.evidence.slice(0, 2).join("\n");
    if (track === "surface") return ["[LOCAL SOURCE VIEW]", `focus: ${value}`, "storage: browser-controlled value", "server decision: must be revalidated", "", evidence].join("\n");
    if (track === "request") return [`${method} /sandbox/node/${challenge.id}?${value}`, "Host: local-practice", "", "HTTP/1.1 200 SIMULATED", "Input reached the request boundary.", "Server-side validation and authorization are still required."].join("\n");
    if (track === "input") return ["[LOCAL OUTPUT COMPARISON]", `raw input: ${value}`, `text-safe output: ${escapeText(value)}`, "", "This panel renders text only. No browser code is executed."].join("\n");
    if (track === "access") return [`${method} /sandbox/records/${value}`, "session role: learner", "authorization: DENY", "reason: identifier knowledge is not permission", "", "A real server must check owner and action on every request."].join("\n");
    return ["[LOCAL ANALYSIS NOTE]", `fact: ${value}`, "hypothesis: separate from verified facts", "recommendation: state a server-side control", "", `evidence reference: ${challenge.evidence[0]}`].join("\n");
  }, [challenge.evidence, challenge.id, input, method, track]);

  const runSimulation = () => {
    setOutput(simulatedResponse);
    practice.mutate({ problemId: challenge.id, method, input });
  };
  const resetSimulation = () => {
    setMethod("GET");
    setInput(guide?.practiceInput ?? "");
    setOutput("[READY] 문제 안내의 조작 대상을 입력한 뒤 시뮬레이션을 실행하세요.");
  };

  return <section className="min-w-0 border border-teal-300/30 bg-[#0b191c] p-4 shadow-[inset_0_0_0_1px_rgba(45,212,191,.04)]">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#294247] pb-3"><div><p className="font-mono-ui text-[10px] tracking-[0.15em] text-teal-300">{copy.label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{copy.instruction}</p></div><span className="inline-flex items-center gap-1 border border-teal-300/25 bg-teal-300/[0.06] px-2 py-1 font-mono-ui text-[9px] tracking-wider text-teal-100"><ShieldCheck className="h-3 w-3" />LOCAL ONLY</span></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">{(track === "request" || track === "access") ? <label className="block"><span className="font-mono-ui text-[9px] tracking-[0.12em] text-slate-500">METHOD</span><select value={method} onChange={event => setMethod(event.target.value)} className="mt-1 h-10 w-full border border-[#31545a] bg-[#071316] px-2 font-mono-ui text-xs text-teal-100 outline-none focus:border-teal-300"><option>GET</option><option>POST</option></select></label> : <div className="hidden sm:block" />}<label className="block"><span className="font-mono-ui text-[9px] tracking-[0.12em] text-slate-500">SANDBOX INPUT</span><input value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter") runSimulation(); }} placeholder={copy.placeholder} className="mt-1 h-10 w-full border border-[#31545a] bg-[#071316] px-3 font-mono-ui text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300" /></label></div>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={runSimulation} disabled={practice.isPending} className="inline-flex items-center gap-1.5 bg-teal-300 px-3 py-2 text-xs font-semibold text-[#082023] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"><Play className="h-3.5 w-3.5" />{practice.isPending ? "확인 중" : "시뮬레이션 실행"}</button><button type="button" onClick={resetSimulation} className="inline-flex items-center gap-1.5 border border-[#31545a] px-3 py-2 text-xs text-slate-300 transition hover:border-teal-300/60 hover:text-teal-100"><RotateCcw className="h-3.5 w-3.5" />초기화</button></div>
    <pre aria-live="polite" className="mt-4 max-w-full overflow-x-auto border border-[#294247] bg-[#071316] p-3 font-mono-ui text-[11px] leading-5 text-slate-200">{output}</pre><p className="mt-3 text-[11px] leading-5 text-slate-500">이 워크스페이스는 외부 대상 시스템에 요청을 보내거나 코드를 실행하지 않으며, 안전한 학습 서버와만 통신합니다.</p>
  </section>;
}
