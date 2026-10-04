import { useEffect, useRef, useState } from "react";
import { ScrambleText, SignalBars, noiseRun, useTypedLog } from "@/components/terminal-motion";
import { CipherBench, FileIndex, RequestRig, StoreProbe, SurfaceSweep, indexSurfaces, probeSurfaces, sweepSurfaces } from "@/components/instruments/shared";
import { AddressHandoff, CrawlerDialog, FormPayload, HeaderList, HopTrace, IdentityCard, RecordRestore, RelayRoute, StorageProbe, TransferGauge, VaultAssembly } from "@/components/instruments/bespoke";
import { RangeConsole } from "@/components/instruments/range";
import type { InstrumentProps } from "@/components/instruments/types";
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, LockKeyhole, Radio, ShieldAlert, TerminalSquare, Wrench, Wifi } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { blackTraceNodeCount, blackTraceStageById, composeTrace } from "@shared/black-trace";
import { useBlackTraceProgress, useBlackTraceSubmit, useBlackTraceSurface } from "@/hooks/useBlackTrace";
import { supabaseUrl, supabasePublishableKey } from "@/lib/external-supabase";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useIsMobile } from "@/hooks/useMobile";
import "./black-trace.css";

/**
 * What the console can decide without asking the server. Every refusal used to read "INVALID ACCESS
 * KEY", so a stray space and a genuinely wrong value looked identical and the operator had no way
 * to tell which one they were looking at.
 */
export function keyShapeProblem(value: string) {
  if (/\s/.test(value)) return "값에 공백이나 줄바꿈이 섞여 있습니다. 앞뒤를 정리하고 다시 제출하세요.";
  if (!value.startsWith("FLAG{")) return "형식이 다릅니다. 회수한 값은 FLAG{ 로 시작합니다.";
  if (!value.endsWith("}")) return "형식이 다릅니다. 닫는 } 까지 포함해 제출하세요.";
  if (value.length < 12) return "값이 너무 짧습니다. 중괄호 안쪽까지 전부 복사했는지 확인하세요.";
  return null;
}

/** The server refuses for four different reasons; the console used to print all four the same. */
export function submissionFailureLines(error: unknown) {
  const reason = (error as { reason?: string } | null)?.reason;
  const message = error instanceof Error && error.message ? error.message : "";
  if (reason === "rate_limited") return ["[-] SUBMISSION THROTTLED", "> 분당 제출 횟수를 넘었습니다. 1분 뒤 다시 시도하세요."];
  if (message.includes("previous node")) return ["[-] NODE LOCKED", "> 앞 거점을 먼저 장악해야 이 노드의 제출이 기록됩니다."];
  if (message.includes("Unknown operation node")) return ["[-] UNKNOWN NODE", "> 존재하지 않는 노드입니다."];
  return ["[-] CHANNEL UNAVAILABLE", `> ${message || "세션이 만료되었거나 서버에 연결하지 못했습니다."}`];
}

const traceEndpoint = (stage: number, mode: string) => `${supabaseUrl}/functions/v1/hg-black-trace?stage=${stage}&mode=${mode}`;

export default function BlackTraceStage() {
  const params = useParams<{ stage: string }>();
  const id = Number(params.stage);
  const stage = blackTraceStageById(id);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const progress = useBlackTraceProgress(isAuthenticated);
  const surface = useBlackTraceSurface(id, isAuthenticated);
  // The planted trace is derived per operator, so it is never the same string for two accounts.
  const trace = composeTrace(stage?.key ?? "", surface.data?.token ?? null) ?? "";
  // The field kit replaces the old two-step hint list: one suggestive line, opened only if the
  // operator asks for it. Being handed the tool by name is not the game.
  const [intelOpen, setIntelOpen] = useState(false);
  const [flag, setFlag] = useState("");
  // Node 10 is the only one whose answer arrives in two halves, so it is submitted in two halves.
  const [fragmentA, setFragmentA] = useState("");
  const [fragmentB, setFragmentB] = useState("");
  const [terminal, setTerminal] = useState<string[]>([]);
  // Boot chatter keeps the console alive before the first action, without ever mixing into the
  // operator's own log: whatever an action writes replaces it entirely.
  const [bootLog, setBootLog] = useState<string[]>([]);
  const isMobile = useIsMobile();
  // Nodes 01~03 and 09 hide their trace in the page itself, so the button used to return
  // without doing anything at all. The scan gives the action a visible consequence.
  const [scan, setScan] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  // A rejected key used to change one line of text to red, which is not what being locked out
  // feels like. The timestamp restarts the interference even on a second identical rejection.
  const [breachAt, setBreachAt] = useState(0);
  // Held so the cleared panel can resolve the recovered key out of noise instead of the operator
  // never seeing what they actually pulled out of the node.
  const [recovered, setRecovered] = useState("");
  const commentAnchor = useRef<HTMLDivElement>(null);
  const completed = progress.data?.completedStages ?? [];
  const maxOpen = progress.data?.currentStage ?? 1;
  const isOpen = id === 1 || completed.includes(id) || id <= maxOpen;
  const submit = useBlackTraceSubmit({
    onSuccess: response => {
      if (response.correct) {
        setResult("success");
        setTerminal(id === blackTraceNodeCount ? ["> validating fragments...", "> reconstructing master key...", "> signature verified", "[+] OPERATION BLACK TRACE COMPLETE"] : ["> validating trace...", "[+] KEY ACCEPTED", "[+] ACCESS GAINED", "[+] NODE BREACHED"]);
        return;
      }
      // The key was well-formed and the server still refused it, so the shape is not the problem.
      setResult("error");
      setBreachAt(Date.now());
      setTerminal(["[-] INVALID ACCESS KEY", "> 형식은 올바릅니다. 이 노드의 값과 일치하지 않습니다.", "> 다른 노드에서 회수한 값이 아닌지 확인하세요."]);
    },
    onError: error => {
      setResult("error");
      setBreachAt(Date.now());
      setTerminal(submissionFailureLines(error));
    },
  });

  const [jolted, setJolted] = useState(false);
  useEffect(() => {
    if (!breachAt) return;
    setJolted(true);
    const timer = window.setTimeout(() => setJolted(false), 620);
    return () => window.clearTimeout(timer);
  }, [breachAt]);

  // Whichever log is live is the one that types. Boot chatter and the operator's own log never
  // mix, so switching between them is a switch of source, not a merge.
  const logSource = terminal.length ? terminal : bootLog;
  const { view: typedLog, typing } = useTypedLog(logSource);

  useEffect(() => {
    if (!stage) return;
    setBootLog([]);
    const lines = [`> uplink ${stage.target}`, "> channel established", `> node ${String(id).padStart(2, "0")} surface mounted`, "> awaiting recovered trace"];
    const timers = lines.map((line, index) => window.setTimeout(() => setBootLog(previous => [...previous, line]), 220 * (index + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [id, stage?.target]);

  useEffect(() => { if (stage?.surface !== "comment" || !trace || !commentAnchor.current) return; const marker = document.createComment(` deleted_record: ${trace} `); commentAnchor.current.appendChild(marker); return () => marker.remove(); }, [stage?.surface, trace]);
  useEffect(() => { if (stage?.surface !== "cookie" || !trace) return; document.cookie = `trace_id=${trace}; Path=/; SameSite=Lax`; }, [stage?.surface, trace]);
  if (!stage) return <div className="bt-shell bt-empty">UNKNOWN NODE</div>;
  if (!isOpen) return <div className="bt-shell bt-empty"><LockKeyhole size={24} /><p>앞 거점을 먼저 장악해야 열립니다.</p><button onClick={() => setLocation("/black-trace")}>OPERATION BOARD</button></div>;

  /** Remote nodes are solved by watching the request, so it is always really sent. */
  const callRemote = async (mode: string) => {
    try { await fetch(traceEndpoint(id, mode), { headers: { apikey: supabasePublishableKey }, redirect: mode === "redirect" ? "manual" : "follow" }); } catch { /* the instrument reports it */ }
  };
  const isVault = stage.surface === "vault";
  const assembled = isVault ? `${fragmentA.trim()}${fragmentB.trim()}` : flag.trim();
  const submitFlag = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) { setResult("error"); setTerminal(["[-] SESSION REQUIRED", "> opening operator login..."]); startPlatformLogin(); setLocation("/black-trace"); return; }
    if (!assembled) return;
    // A malformed key is a typo, not a wrong answer. Spending a submission slot to be told so helps
    // nobody, and "INVALID ACCESS KEY" for a stray space reads as the value being wrong.
    const malformed = keyShapeProblem(assembled);
    if (malformed) {
      setResult("error");
      setTerminal(["[-] KEY REJECTED BEFORE TRANSMISSION", `> ${malformed}`]);
      return;
    }
    setResult("idle");
    setRecovered(assembled);
    setTerminal(isVault ? ["> joining fragment 01 + 02...", "> transmitting assembled key..."] : ["> transmitting extracted key..."]);
    submit.mutate({ stage: id, flag: assembled, hintCount: intelOpen ? 1 : 0 });
  };

  return <div className={`bt-shell bt-stage bt-stage--${stage.surface}${jolted ? " is-breached" : ""}`}>
    <header className="bt-topbar"><button onClick={() => setLocation("/black-trace")} className="bt-back"><ArrowLeft size={15} /> OPERATION BOARD</button><div className="bt-brand"><Radio size={16} /> OPERATION: <strong>BLACK TRACE</strong></div><div className="bt-topbar-status"><span className="bt-status-dot" /> STATUS / ACTIVE</div></header>
    <main className="bt-stage__main"><section className="bt-stage__meta"><p>NODE {String(id).padStart(2, "0")} / {blackTraceNodeCount}</p><div><span>TARGET</span><strong>{stage.target}</strong></div><div><span>ACCESS</span><strong>{stage.access}</strong></div><div><span>PROGRESS</span><strong>{completed.length} / {blackTraceNodeCount}</strong></div></section>
      <section className="bt-stage__scene"><div className="bt-scene__eyebrow">{stage.code} <span>{stage.sceneLabel}</span></div><div className={`bt-scene__center${scan === "running" ? " is-scanning" : ""}${scan === "done" ? " is-scanned" : ""}`}><SurfaceTelemetry target={stage.target} active={scan === "running"} /><div ref={commentAnchor} className="bt-scene__anchor" /><Instrument surface={stage.surface} stageId={id} nodeKey={stage.key} actionLabel={stage.actionLabel} target={stage.target} trace={trace} onLog={setTerminal} onBusy={() => setScan("running")} onDone={() => setScan("done")} onRemote={callRemote} onRoute={() => setLocation(`/black-trace/${id}?trace=${encodeURIComponent(trace)}`)} />{scan === "running" ? <ScanNoise /> : null}{scan === "done" ? <p className="bt-scene__verdict">{stage.scan.verdict}</p> : null}</div><p className="bt-scene__narrative">{stage.narrative}</p>
        {isMobile ? <p className="bt-fieldkit__warn"><ShieldAlert size={14} /> 이 작전에는 브라우저 개발자도구가 필요합니다. PC에서 진행하세요.</p> : null}<div className="bt-intel"><button onClick={() => setIntelOpen(true)} disabled={intelOpen}><Wrench size={15} /> {intelOpen ? "FIELD KIT // OPEN" : "OPEN FIELD KIT"}</button>{intelOpen ? <p className="bt-intel__line">{stage.intel}</p> : <p>막히면 FIELD KIT을 열어 볼 수 있습니다. 열어 본 기록은 남습니다.</p>}</div></section>
      <aside className="bt-stage__terminal"><div className="bt-terminal__head"><TerminalSquare size={16} /> OPERATOR CONSOLE</div><div className={`bt-terminal__log${typing ? " is-typing" : ""}`}>{typedLog.map((line, index) => <p key={index} className={line.startsWith("[-]") ? "is-error" : line.startsWith("[+]") ? "is-success" : terminal.length ? "" : "is-muted"}>{line}</p>)}{!typedLog.length ? <p className="is-muted">Waiting for recovered trace...</p> : null}</div><form onSubmit={submitFlag} className="bt-terminal__form">
          <label>&gt; {isVault ? "assemble_key" : "submit_flag"}</label>
          {isVault
            ? <div className="bt-terminal__split">
                <input value={fragmentA} onChange={event => setFragmentA(event.target.value)} placeholder="PART 01" aria-label="조각 01" autoComplete="off" />
                <span>+</span>
                <input value={fragmentB} onChange={event => setFragmentB(event.target.value)} placeholder="PART 02" aria-label="조각 02" autoComplete="off" />
              </div>
            : <input value={flag} onChange={event => setFlag(event.target.value)} placeholder="FLAG{________________}" autoComplete="off" />}
          {isVault ? <p className="bt-terminal__assembled">{assembled || "두 조각을 각각 넣으면 하나로 이어 붙입니다."}</p> : null}
          <button disabled={submit.isPending || !assembled}>{submit.isPending ? "VERIFYING" : isVault ? "ASSEMBLE" : "SUBMIT"} <ChevronRight size={15} /></button>
          {submit.isPending ? <div className="bt-verify" role="progressbar" aria-label="검증 중"><i /></div> : null}
        </form>{result === "success" ? <div className="bt-terminal__result is-success"><CheckCircle2 size={15} /> NODE BREACHED</div> : null}{result === "error" ? <div className="bt-terminal__result is-error">INVALID ACCESS KEY</div> : null}</aside>
    </main>
    {breachAt ? <BreachFlash key={breachAt} /> : null}
    {result === "success" ? <NodeCleared id={id} recovered={recovered} lesson={stage.lesson} onNext={() => { setResult("idle"); setTerminal([]); setFlag(""); setFragmentA(""); setFragmentB(""); setLocation(id >= blackTraceNodeCount ? "/certificate" : `/black-trace/${id + 1}`); }} onBoard={() => setLocation("/black-trace")} /> : null}
  </div>;
}

/**
 * Half the nodes rest on an empty frame: four dotted rows, a lone arrow, a blank gauge. Nothing on
 * the panel moved until the operator pressed the button, so a node that had not been touched read
 * as a screenshot rather than as a link that is up.
 *
 * The strip is the one thing every node shares. It reports the link, not the puzzle: naming what a
 * surface holds here would hand over the answer the instrument exists to reveal.
 */
function SurfaceTelemetry({ target, active }: { target: string; active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const [rtt, setRtt] = useState(24);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(previous => previous + 1);
      setRtt(18 + Math.floor(Math.random() * 14));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className={`bt-telemetry${active ? " is-active" : ""}`}>
    <span className="bt-telemetry__link"><i />{active ? "READING" : "LINK UP"}</span>
    <code>{target}</code>
    <span>RTT <strong>{rtt}ms</strong></span>
    <span>LOSS <strong>0.0%</strong></span>
    <span>UPTIME <strong>{clock}</strong></span>
    <SignalBars active={active} />
  </div>;
}

/** The instrument is reading bytes, so the panel shows bytes moving rather than only a sweep. */
function ScanNoise() {
  const [rows, setRows] = useState<string[]>(() => Array.from({ length: 3 }, () => noiseRun(46)));
  useEffect(() => {
    const timer = window.setInterval(() => setRows(Array.from({ length: 3 }, () => noiseRun(46))), 70);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="bt-noise" aria-hidden="true">{rows.map((row, index) => <span key={index}>{row}</span>)}</div>;
}

/** A rejected key is a tripped alarm, so the screen reacts the way a tripped alarm looks. */
function BreachFlash() {
  return <div className="bt-breach" aria-hidden="true"><p>ACCESS DENIED</p></div>;
}

/** A recovered node is the only reward the operation gives, so it is shown, not just logged. */
function NodeCleared({ id, recovered, lesson, onNext, onBoard }: { id: number; recovered: string; lesson: { risk: string; fix: string }; onNext: () => void; onBoard: () => void }) {
  const final = id >= blackTraceNodeCount;
  return <div className="bt-cleared" role="status" aria-live="polite">
    <div className="bt-cleared__panel">
      <CheckCircle2 size={34} />
      <p className="bt-cleared__eyebrow">{final ? "OPERATION COMPLETE" : "FOOTHOLD TAKEN"}</p>
      <h2>{final ? "MASTER ACCESS KEY 확보" : `NODE ${String(id).padStart(2, "0")} BREACHED`}</h2>
      {recovered ? <div className="bt-cleared__key"><span>EXTRACTED KEY</span><ScrambleText value={recovered} /></div> : null}
      <p className="bt-cleared__note">{final ? `거점 ${blackTraceNodeCount}개를 전부 장악했습니다. 이제 수료증을 받을 수 있습니다.` : "다음 노드가 열렸습니다."}</p>
      {/* The flag is the game; this is the point of the game. It appears only here, after the node
          is cleared, so it can say plainly what the field kit had to keep vague. */}
      <div className="bt-lesson">
        <div><span>WHY IT MATTERS</span><p>{lesson.risk}</p></div>
        <div><span>조치</span><p>{lesson.fix}</p></div>
      </div>
      <div className="bt-cleared__actions">
        <button className="bt-cleared__primary" onClick={onNext}>{final ? "수료증 받기" : "다음 노드"} <ChevronRight size={16} /></button>
        <button className="bt-cleared__ghost" onClick={onBoard}>작전 보드</button>
      </div>
    </div>
  </div>;
}





/**
 * Every node is operated differently. Ten nodes sharing one button made the operation read as one
 * screen with ten captions, so each surface gets the instrument its own subject calls for.
 */
function Instrument(props: InstrumentProps) {
  // Nodes that exercise the same panel share an instrument and differ by their data; the rest keep
  // the one written for their own subject.
  if (sweepSurfaces.includes(props.surface)) return <SurfaceSweep {...props} />;
  if (probeSurfaces.includes(props.surface)) return <StoreProbe {...props} />;
  if (indexSurfaces.includes(props.surface)) return <FileIndex {...props} base={props.target} />;
  // The bridge node is handed the address it refuses to call, so the operator has something to
  // copy rather than a URL they have to reconstruct from the node number.
  if (props.surface === "console") return <AddressHandoff {...props} endpoint={traceEndpoint(props.stageId, "firsthand")} />;
  if (props.surface === "request") return <RequestRig {...props} />;
  if (props.surface === "cipher") return <CipherBench {...props} />;
  // Chapter five's three surfaces all drive the same mock application, so they share its console;
  // what differs is how the reply is drawn, which the console decides from the reply itself.
  if (props.surface === "range" || props.surface === "render" || props.surface === "query") return <RangeConsole {...props} />;
  switch (props.surface) {
    case "comment": return <RecordRestore {...props} />;
    case "field": return <FormPayload {...props} />;
    case "identity": return <IdentityCard {...props} />;
    case "cookie": return <StorageProbe onLog={props.onLog} onDone={props.onDone} />;
    case "route": return <RelayRoute {...props} />;
    case "response": return <TransferGauge {...props} />;
    case "redirect": return <HopTrace {...props} />;
    case "header": return <HeaderList {...props} />;
    case "robots": return <CrawlerDialog {...props} />;
    case "vault": return <VaultAssembly {...props} />;
    // A surface with no branch used to fall through to the vault, so a node added without an
    // instrument showed a two-part key panel and looked like a different node rather than like a
    // mistake. Twice now a defect here survived because it failed quietly; this one says so.
    default: return <MissingInstrument surface={props.surface} />;
  }
}

function MissingInstrument({ surface }: { surface: string }) {
  return <div className="bt-missing">
    <p className="bt-missing__title">NO INSTRUMENT</p>
    <p className="bt-missing__body">이 노드에 연결된 계기가 없습니다. surface <code>{surface}</code> 에 해당하는 분기를 추가해야 합니다.</p>
  </div>;
}










