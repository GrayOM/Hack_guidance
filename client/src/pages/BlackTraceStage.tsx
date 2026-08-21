import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, CircleHelp, LockKeyhole, Radio, TerminalSquare, Wifi } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { blackTraceStageById } from "@shared/black-trace";
import { useBlackTraceProgress, useBlackTraceSubmit } from "@/hooks/useBlackTrace";
import { supabaseUrl, supabasePublishableKey } from "@/lib/external-supabase";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import "./black-trace.css";

const traceEndpoint = (stage: number, mode: string) => `${supabaseUrl}/functions/v1/hg-black-trace?stage=${stage}&mode=${mode}`;

export default function BlackTraceStage() {
  const params = useParams<{ stage: string }>();
  const id = Number(params.stage);
  const stage = blackTraceStageById(id);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const progress = useBlackTraceProgress(isAuthenticated);
  const [hintCount, setHintCount] = useState(0);
  const [flag, setFlag] = useState("");
  const [terminal, setTerminal] = useState<string[]>([]);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const commentAnchor = useRef<HTMLDivElement>(null);
  const completed = progress.data?.completedStages ?? [];
  const maxOpen = progress.data?.currentStage ?? 1;
  const isOpen = id === 1 || completed.includes(id) || id <= maxOpen;
  const submit = useBlackTraceSubmit({ onSuccess: response => { if (response.correct) { setResult("success"); setTerminal(id === 10 ? ["> validating fragments...", "> reconstructing master key...", "> signature verified", "[+] OPERATION BLACK TRACE COMPLETE"] : ["> validating trace...", "[+] FLAG ACCEPTED", "[+] TRACE RECOVERED", "[+] NODE CLEARED"]); } else { setResult("error"); setTerminal(["[-] INVALID ACCESS KEY"]); } }, onError: () => { setResult("error"); setTerminal(["[-] SESSION REQUIRED OR CHANNEL UNAVAILABLE"]); } });

  useEffect(() => { if (stage?.surface !== "comment" || !commentAnchor.current) return; const marker = document.createComment(" deleted_record: FLAG{ghost_in_the_source} "); commentAnchor.current.appendChild(marker); return () => marker.remove(); }, [stage?.surface]);
  useEffect(() => { if (stage?.surface !== "cookie") return; document.cookie = "trace_id=FLAG{cookies_leave_traces}; Path=/; SameSite=Lax"; }, [stage?.surface]);
  if (!stage) return <div className="bt-shell bt-empty">UNKNOWN NODE</div>;
  if (!isOpen) return <div className="bt-shell bt-empty"><LockKeyhole size={24} /><p>이 노드는 이전 흔적을 회수한 뒤 열립니다.</p><button onClick={() => setLocation("/black-trace")}>OPERATION BOARD</button></div>;

  const runAction = async () => {
    if (stage.surface === "route") { setLocation("/black-trace/5?trace=FLAG%7Bread_the_address%7D"); return; }
    if (!(["response", "redirect", "header", "vault"] as string[]).includes(stage.surface)) return;
    setTerminal(["> establishing connection...", "> handshake accepted...", "> requesting remote status..."]);
    try { const response = await fetch(traceEndpoint(stage.id, stage.surface), { headers: { apikey: supabasePublishableKey }, redirect: stage.surface === "redirect" ? "manual" : "follow" }); if (!response.ok && stage.surface !== "redirect") throw new Error("failed"); setTimeout(() => setTerminal(stage.surface === "response" ? ["> establishing connection...", "> handshake accepted", "> ERROR: response discarded", "CONNECTION FAILED"] : stage.surface === "redirect" ? ["> movement trace sent", "> RECORD NOT FOUND"] : stage.surface === "header" ? ["> status received", "STATUS: ONLINE", "MESSAGE: NO DATA"] : ["> vault recovery pending", "STATUS: PARTIAL"]), 240); } catch { setTerminal(["> connection interrupted", "CONNECTION FAILED"]); }
  };
  const submitFlag = (event: React.FormEvent) => { event.preventDefault(); if (!isAuthenticated) { startPlatformLogin(); return; } if (!flag.trim()) return; setResult("idle"); setTerminal(["> transmitting recovered key..."]); submit.mutate({ stage: id, flag: flag.trim(), hintCount }); };

  return <div className={`bt-shell bt-stage bt-stage--${stage.surface}`}>
    <header className="bt-topbar"><button onClick={() => setLocation("/black-trace")} className="bt-back"><ArrowLeft size={15} /> OPERATION BOARD</button><div className="bt-brand"><Radio size={16} /> OPERATION: <strong>BLACK TRACE</strong></div><div className="bt-topbar-status"><span className="bt-status-dot" /> STATUS / ACTIVE</div></header>
    <main className="bt-stage__main"><section className="bt-stage__meta"><p>NODE {String(id).padStart(2, "0")} / 10</p><div><span>TARGET</span><strong>{stage.target}</strong></div><div><span>ACCESS</span><strong>{stage.access}</strong></div><div><span>PROGRESS</span><strong>{completed.length} / 10</strong></div></section>
      <section className="bt-stage__scene"><div className="bt-scene__eyebrow">{stage.code} <span>{stage.sceneLabel}</span></div><div className="bt-scene__center" ref={commentAnchor}>{renderScene(stage.surface, stage.actionLabel, runAction)}</div><p className="bt-scene__narrative">{stage.narrative}</p><div className="bt-intel"><button onClick={() => setHintCount(value => Math.min(2, value + 1))}><CircleHelp size={15} /> INTEL {hintCount} / 2</button>{hintCount > 0 ? <p>{stage.hints[hintCount - 1]}</p> : <p>신호가 불완전합니다. 필요하면 INTEL을 열어 보세요.</p>}</div></section>
      <aside className="bt-stage__terminal"><div className="bt-terminal__head"><TerminalSquare size={16} /> RECOVERY CONSOLE</div><div className="bt-terminal__log">{terminal.length ? terminal.map((line, index) => <p key={`${line}-${index}`} className={line.startsWith("[-]") ? "is-error" : line.startsWith("[+]") ? "is-success" : ""}>{line}</p>) : <p className="is-muted">Waiting for recovered trace...</p>}</div><form onSubmit={submitFlag} className="bt-terminal__form"><label>&gt; submit_flag</label><input value={flag} onChange={event => setFlag(event.target.value)} placeholder="FLAG{________________}" autoComplete="off" /><button disabled={submit.isPending}>{submit.isPending ? "VERIFYING" : "SUBMIT"} <ChevronRight size={15} /></button></form>{result === "success" ? <div className="bt-terminal__result is-success"><CheckCircle2 size={15} /> NODE CLEARED</div> : null}{result === "error" ? <div className="bt-terminal__result is-error">INVALID ACCESS KEY</div> : null}</aside>
    </main>
  </div>;
}

function renderScene(surface: string, actionLabel: string | undefined, action: () => void) {
  if (surface === "field") return <div className="bt-auth-unit"><span>USER ID</span><input readOnly aria-label="사용자 ID" /><button type="button" onClick={action}>{actionLabel}</button><input type="hidden" name="legacy_note" value="FLAG{hidden_fields_remember}" /></div>;
  if (surface === "identity") return <div className="bt-identity-card" data-note="FLAG{attributes_tell_more}"><span>PERSONNEL FILE</span><strong>NAME: UNKNOWN</strong><strong>CLEARANCE: REVOKED</strong><strong>STATUS: MISSING</strong></div>;
  if (surface === "route") return <button type="button" className="bt-action-button" onClick={action}>{actionLabel} <ChevronRight size={18} /></button>;
  if (surface === "response" || surface === "redirect" || surface === "header") return <div className="bt-remote-unit"><Wifi size={31} /><p>{surface === "response" ? "REMOTE NODE CONNECTION" : surface === "redirect" ? "PERSONNEL TRACE" : "COMMUNICATION NODE"}</p><button type="button" className="bt-action-button" onClick={action}>{actionLabel} <ChevronRight size={18} /></button></div>;
  if (surface === "robots") return <div className="bt-robot-unit"><pre>{"[ o_o ]\n /|_|\\\n  / \\"}</pre><p>AUTOMATED SECURITY NODE</p><span>INDEXING PERIMETER...</span></div>;
  if (surface === "vault") return <div className="bt-vault-unit" id="vault-core" data-fragment="FLAG{two_places_"><LockKeyhole size={38} /><p>MASTER KEY</p><span>PART 01: UNKNOWN</span><span>PART 02: UNKNOWN</span><button type="button" className="bt-action-button" onClick={action}>{actionLabel} <ChevronRight size={18} /></button></div>;
  return <button type="button" className="bt-action-button" onClick={action}>INSPECT RECORD <ChevronRight size={18} /></button>;
}
