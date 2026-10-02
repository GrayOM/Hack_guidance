import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Lock, LockKeyhole, Radio, ShieldAlert, TerminalSquare, Wrench, Wifi } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { blackTraceStageById, composeTrace } from "@shared/black-trace";
import { useBlackTraceProgress, useBlackTraceSubmit, useBlackTraceSurface } from "@/hooks/useBlackTrace";
import { supabaseUrl, supabasePublishableKey } from "@/lib/external-supabase";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useIsMobile } from "@/hooks/useMobile";
import "./black-trace.css";

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
  const trace = composeTrace(id, surface.data?.token ?? null) ?? "";
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
  const submit = useBlackTraceSubmit({ onSuccess: response => { if (response.correct) { setResult("success"); setTerminal(id === 10 ? ["> validating fragments...", "> reconstructing master key...", "> signature verified", "[+] OPERATION BLACK TRACE COMPLETE"] : ["> validating trace...", "[+] FLAG ACCEPTED", "[+] TRACE RECOVERED", "[+] NODE CLEARED"]); } else { setResult("error"); setBreachAt(Date.now()); setTerminal(["[-] INVALID ACCESS KEY", "[-] ATTEMPT LOGGED"]); } }, onError: error => { setResult("error"); setBreachAt(Date.now()); const reason = error instanceof Error && error.message ? error.message : "SESSION REQUIRED OR CHANNEL UNAVAILABLE"; setTerminal([`[-] ${reason}`]); } });

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
  if (!isOpen) return <div className="bt-shell bt-empty"><LockKeyhole size={24} /><p>이 노드는 이전 흔적을 회수한 뒤 열립니다.</p><button onClick={() => setLocation("/black-trace")}>OPERATION BOARD</button></div>;

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
    setResult("idle");
    setRecovered(assembled);
    setTerminal(isVault ? ["> joining fragment 01 + 02...", "> transmitting assembled key..."] : ["> transmitting recovered key..."]);
    submit.mutate({ stage: id, flag: assembled, hintCount: intelOpen ? 1 : 0 });
  };

  return <div className={`bt-shell bt-stage bt-stage--${stage.surface}${jolted ? " is-breached" : ""}`}>
    <header className="bt-topbar"><button onClick={() => setLocation("/black-trace")} className="bt-back"><ArrowLeft size={15} /> OPERATION BOARD</button><div className="bt-brand"><Radio size={16} /> OPERATION: <strong>BLACK TRACE</strong></div><div className="bt-topbar-status"><span className="bt-status-dot" /> STATUS / ACTIVE</div></header>
    <main className="bt-stage__main"><section className="bt-stage__meta"><p>NODE {String(id).padStart(2, "0")} / 10</p><div><span>TARGET</span><strong>{stage.target}</strong></div><div><span>ACCESS</span><strong>{stage.access}</strong></div><div><span>PROGRESS</span><strong>{completed.length} / 10</strong></div></section>
      <section className="bt-stage__scene"><div className="bt-scene__eyebrow">{stage.code} <span>{stage.sceneLabel}</span></div><div className={`bt-scene__center${scan === "running" ? " is-scanning" : ""}${scan === "done" ? " is-scanned" : ""}`}><SurfaceTelemetry target={stage.target} active={scan === "running"} /><div ref={commentAnchor} className="bt-scene__anchor" /><Instrument surface={stage.surface} actionLabel={stage.actionLabel} target={stage.target} trace={trace} onLog={setTerminal} onBusy={() => setScan("running")} onDone={() => setScan("done")} onRemote={callRemote} onRoute={() => setLocation(`/black-trace/5?trace=${encodeURIComponent(trace)}`)} />{scan === "running" ? <ScanNoise /> : null}{scan === "done" ? <p className="bt-scene__verdict">{stage.scan.verdict}</p> : null}</div><p className="bt-scene__narrative">{stage.narrative}</p>
        {isMobile ? <p className="bt-fieldkit__warn"><ShieldAlert size={14} /> 이 작전은 브라우저 개발자도구가 필요합니다. PC 브라우저에서 진행하세요.</p> : null}<div className="bt-intel"><button onClick={() => setIntelOpen(true)} disabled={intelOpen}><Wrench size={15} /> {intelOpen ? "FIELD KIT // OPEN" : "OPEN FIELD KIT"}</button>{intelOpen ? <p className="bt-intel__line">{stage.intel}</p> : <p>스스로 풀리지 않으면 FIELD KIT을 열어 보세요. 열람 기록은 남습니다.</p>}</div></section>
      <aside className="bt-stage__terminal"><div className="bt-terminal__head"><TerminalSquare size={16} /> RECOVERY CONSOLE</div><div className={`bt-terminal__log${typing ? " is-typing" : ""}`}>{typedLog.map((line, index) => <p key={index} className={line.startsWith("[-]") ? "is-error" : line.startsWith("[+]") ? "is-success" : terminal.length ? "" : "is-muted"}>{line}</p>)}{!typedLog.length ? <p className="is-muted">Waiting for recovered trace...</p> : null}</div><form onSubmit={submitFlag} className="bt-terminal__form">
          <label>&gt; {isVault ? "assemble_key" : "submit_flag"}</label>
          {isVault
            ? <div className="bt-terminal__split">
                <input value={fragmentA} onChange={event => setFragmentA(event.target.value)} placeholder="PART 01" aria-label="조각 01" autoComplete="off" />
                <span>+</span>
                <input value={fragmentB} onChange={event => setFragmentB(event.target.value)} placeholder="PART 02" aria-label="조각 02" autoComplete="off" />
              </div>
            : <input value={flag} onChange={event => setFlag(event.target.value)} placeholder="FLAG{________________}" autoComplete="off" />}
          {isVault ? <p className="bt-terminal__assembled">{assembled || "두 조각을 각각 입력하면 하나로 이어집니다."}</p> : null}
          <button disabled={submit.isPending || !assembled}>{submit.isPending ? "VERIFYING" : isVault ? "ASSEMBLE" : "SUBMIT"} <ChevronRight size={15} /></button>
          {submit.isPending ? <div className="bt-verify" role="progressbar" aria-label="검증 중"><i /></div> : null}
        </form>{result === "success" ? <div className="bt-terminal__result is-success"><CheckCircle2 size={15} /> NODE CLEARED</div> : null}{result === "error" ? <div className="bt-terminal__result is-error">INVALID ACCESS KEY</div> : null}</aside>
    </main>
    {breachAt ? <BreachFlash key={breachAt} /> : null}
    {result === "success" ? <NodeCleared id={id} recovered={recovered} onNext={() => { setResult("idle"); setTerminal([]); setFlag(""); setFragmentA(""); setFragmentB(""); setLocation(id >= 10 ? "/certificate" : `/black-trace/${id + 1}`); }} onBoard={() => setLocation("/black-trace")} /> : null}
  </div>;
}

const noiseAlphabet = "0123456789ABCDEF#$%&*/<>?@\\^|~";
const noiseChar = () => noiseAlphabet[Math.floor(Math.random() * noiseAlphabet.length)];
const noiseRun = (length: number) => Array.from({ length }, noiseChar).join("");

/**
 * The console printed each burst whole, so a sequence of instrument calls read as pages of text
 * rather than a machine answering. Lines are typed a character at a time instead.
 *
 * A burst usually repeats the lines already on screen before adding its own, so whatever matches
 * what is already typed is kept and only the tail is typed. Without that, every call would retype
 * the whole session from the top.
 */
function useTypedLog(lines: string[]) {
  const [view, setView] = useState<string[]>([]);
  const settled = useRef<string[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!lines.length) {
      settled.current = [];
      setView([]);
      setTyping(false);
      return;
    }
    let shared = 0;
    while (shared < settled.current.length && shared < lines.length && settled.current[shared] === lines[shared]) shared += 1;
    const base = lines.slice(0, shared);
    settled.current = base;
    setView(base);
    if (shared >= lines.length) {
      setTyping(false);
      return;
    }
    setTyping(true);
    let row = shared;
    let column = 0;
    const timer = window.setInterval(() => {
      column += 1;
      const next = [...lines.slice(0, row), lines[row].slice(0, column)];
      settled.current = next;
      setView(next);
      if (column >= lines[row].length) {
        row += 1;
        column = 0;
      }
      if (row >= lines.length) {
        window.clearInterval(timer);
        setTyping(false);
      }
    }, 14);
    return () => window.clearInterval(timer);
  }, [lines]);

  return { view, typing };
}

/**
 * The recovered key is the only thing the operator carries out of a node, so it resolves out of
 * noise one character at a time rather than simply being present.
 */
function DecryptedKey({ value }: { value: string }) {
  const [shown, setShown] = useState(() => noiseRun(value.length));
  useEffect(() => {
    let resolved = 0;
    const timer = window.setInterval(() => {
      resolved += 1;
      if (resolved >= value.length) {
        window.clearInterval(timer);
        setShown(value);
        return;
      }
      setShown(value.slice(0, resolved) + noiseRun(value.length - resolved));
    }, 34);
    return () => window.clearInterval(timer);
  }, [value]);
  return <code>{shown}</code>;
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
    <span className="bt-telemetry__signal" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 90}ms` }} />)}</span>
  </div>;
}

/** A recovered node is the only reward the operation gives, so it is shown, not just logged. */
function NodeCleared({ id, recovered, onNext, onBoard }: { id: number; recovered: string; onNext: () => void; onBoard: () => void }) {
  const final = id >= 10;
  return <div className="bt-cleared" role="status" aria-live="polite">
    <div className="bt-cleared__panel">
      <CheckCircle2 size={34} />
      <p className="bt-cleared__eyebrow">{final ? "OPERATION COMPLETE" : "TRACE RECOVERED"}</p>
      <h2>{final ? "MASTER ACCESS KEY 복구" : `NODE ${String(id).padStart(2, "0")} CLEARED`}</h2>
      {recovered ? <div className="bt-cleared__key"><span>RECOVERED KEY</span><DecryptedKey value={recovered} /></div> : null}
      <p className="bt-cleared__note">{final ? "10개 노드를 모두 회수했습니다. 수료증을 발급할 수 있습니다." : "다음 노드가 해금되었습니다."}</p>
      <div className="bt-cleared__actions">
        <button className="bt-cleared__primary" onClick={onNext}>{final ? "수료증 받기" : "다음 노드"} <ChevronRight size={16} /></button>
        <button className="bt-cleared__ghost" onClick={onBoard}>작전 보드</button>
      </div>
    </div>
  </div>;
}

/**
 * Node 04 is about knowing which store a browser keeps per site, so it is probed store by store
 * instead of being reported in one go. The key that survives is named; its value never is.
 */
function StorageProbe({ onLog, onDone }: { onLog: (lines: string[]) => void; onDone: () => void }) {
  const [probed, setProbed] = useState<string[]>([]);
  const stores = [
    { id: "localStorage", entries: 0, key: null },
    { id: "sessionStorage", entries: 0, key: null },
    { id: "cookie", entries: 1, key: "trace_id" },
  ];
  const probe = (id: string) => {
    if (probed.includes(id)) return;
    const next = [...probed, id];
    setProbed(next);
    const store = stores.find(item => item.id === id)!;
    onLog([`> probing ${id}...`, `> entries: ${store.entries}`, store.key ? `[!] surviving key: ${store.key}` : "> nothing retained"]);
    if (next.length === stores.length) onDone();
  };
  return <div className="bt-probe">
    <p className="bt-probe__title">SESSION MONITOR // LOCAL STORES</p>
    {stores.map(store => {
      const done = probed.includes(store.id);
      return <div key={store.id} className={`bt-probe__row${done ? " is-probed" : ""}`}>
        <code>{store.id}</code>
        {done
          ? <span className="bt-probe__result">{store.key ? <>1 entry · <strong>{store.key}</strong> = <em>████████</em></> : "0 entries"}</span>
          : <button type="button" onClick={() => probe(store.id)}>PROBE</button>}
      </div>;
    })}
    <p className="bt-probe__note">{probed.length < stores.length ? `${probed.length} / ${stores.length} 검사함` : "하나만 살아남았다. 값은 이 화면에 없다."}</p>
  </div>;
}

/**
 * Node 10 is about two halves arriving from two different places, so the bay shows both slots and
 * fills only the one the request answers. The other stays empty on purpose.
 */
function VaultAssembly({ trace, actionLabel, onLog, onRemote, onBusy, onDone }: InstrumentProps) {
  const [slot, setSlot] = useState<"idle" | "loading" | "received">("idle");
  const recover = async () => {
    if (slot !== "idle") return;
    setSlot("loading");
    onBusy();
    onLog(["> vault recovery requested...", "> negotiating with vault-node-01.lab"]);
    await onRemote("vault");
    setSlot("received");
    onLog(["> vault recovery requested...", "> fragment 02 delivered in response body", "STATUS: PARTIAL", "[!] KEY INCOMPLETE"]);
    onDone();
  };
  return <div className="bt-vault-unit" id="vault-core" data-fragment={trace}>
    <LockKeyhole size={30} />
    <p>MASTER KEY // ASSEMBLY BAY</p>
    <div className="bt-vault-slots">
      <div className="bt-vault-slot"><span>SLOT 01</span><strong>EMPTY</strong><small>source: this page</small></div>
      <div className={`bt-vault-slot${slot === "received" ? " is-filled" : ""}`}><span>SLOT 02</span><strong>{slot === "received" ? "RECEIVED" : slot === "loading" ? "····" : "EMPTY"}</strong><small>source: remote response</small></div>
    </div>
    <p className="bt-vault-state">ASSEMBLED: {slot === "received" ? "1 / 2" : "0 / 2"}</p>
    <button type="button" className="bt-action-button" onClick={recover} disabled={slot !== "idle"}>{slot === "idle" ? actionLabel : slot === "loading" ? "RECOVERING" : "FRAGMENT 02 RECEIVED"} <ChevronRight size={18} /></button>
  </div>;
}


type InstrumentProps = {
  surface: string;
  actionLabel?: string;
  target: string;
  trace: string;
  onLog: (lines: string[]) => void;
  onBusy: () => void;
  onDone: () => void;
  onRemote: (mode: string) => Promise<void>;
  onRoute: () => void;
};

/**
 * Every node is operated differently. Ten nodes sharing one button made the operation read as one
 * screen with ten captions, so each surface gets the instrument its own subject calls for.
 */
function Instrument(props: InstrumentProps) {
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
    default: return <VaultAssembly {...props} />;
  }
}

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

const carrierWave = "M0 22 L30 22 L38 8 L46 36 L54 22 L84 22 L92 14 L100 30 L108 22 L150 22 L158 6 L166 38 L174 22 L210 22 L218 16 L226 28 L234 22 L240 22";

/** 01 — the record is rebuilt block by block and one index never draws. */
function RecordRestore({ actionLabel, onLog, onBusy, onDone }: InstrumentProps) {
  const blocks = ["SYSTEM LOG — ROUTINE", "NO ANOMALY DETECTED", "TERMINAL IDLE"];
  const [shown, setShown] = useState(-1);
  const restore = async () => {
    if (shown >= 0) return;
    onBusy();
    onLog(["> rebuilding record..."]);
    for (let index = 0; index < blocks.length; index += 1) { await delay(420); setShown(index); }
    await delay(420);
    setShown(blocks.length);
    onLog(["> rebuilding record...", `> blocks found: ${blocks.length + 1}`, `> blocks drawn: ${blocks.length}`, "[!] RECORD EMPTY"]);
    onDone();
  };
  return <div className="bt-rebuild">
    <p className="bt-rebuild__title">DOCUMENT RESTORE</p>
    <ol>
      {blocks.map((text, index) => <li key={text} className={shown >= index ? "is-drawn" : ""}>{shown >= index ? text : "· · ·"}</li>)}
      <li className={shown >= blocks.length ? "is-gap" : ""}>{shown >= blocks.length ? "NOT RENDERED" : "· · ·"}</li>
    </ol>
    {shown >= blocks.length
      ? <p className="bt-rebuild__note">블록 4개 중 3개만 그려졌다.</p>
      : <button type="button" className="bt-action-button" onClick={restore}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** 02 — the payload is built in front of the operator and carries one more entry than the form. */
function FormPayload({ actionLabel, trace, onLog, onBusy, onDone }: InstrumentProps) {
  const [sent, setSent] = useState(false);
  const authenticate = async () => {
    if (sent) return;
    onBusy();
    onLog(["> submitting credentials..."]);
    await delay(620);
    setSent(true);
    onLog(["> submitting credentials...", "> entries transmitted: 2", "> visible inputs: 1", "[-] AUTH REJECTED"]);
    onDone();
  };
  return <div className="bt-auth-unit"><span>USER ID</span>
    {/* The terminal is decommissioned, so the field never accepted input. Saying so turns a
        box that looks broken into the story beat it was meant to be. */}
    <div className="bt-auth-unit__field"><input readOnly disabled aria-label="사용자 ID" placeholder="—" /><Lock size={13} /></div>
    <p className="bt-auth-unit__sealed">INPUT SEALED · 이 단말기는 폐기되었다</p>
    <button type="button" onClick={authenticate} disabled={sent}>{sent ? "REJECTED" : actionLabel}</button>
    <input type="hidden" name="legacy_note" value={trace} />
    {sent ? <div className="bt-payload"><p>OUTGOING PAYLOAD</p><code>user_id = ""</code><code className="is-masked">{"????????"} = ████████</code><small>전송 2건 · 화면의 칸 1개</small></div> : null}
  </div>;
}

/** 03 — the card turns over, and the back has one slot the front never printed. */
function IdentityCard({ actionLabel, trace, onLog, onBusy, onDone }: InstrumentProps) {
  const [flipped, setFlipped] = useState(false);
  const flip = () => {
    if (flipped) return;
    onBusy();
    setFlipped(true);
    onLog(["> turning personnel card...", "> printed fields: 3", "> attribute slots: 4", "[!] IDENTITY REDACTED"]);
    onDone();
  };
  return <div className="bt-identity-stack">
    <div className={`bt-identity-card${flipped ? " is-flipped" : ""}`} data-note={trace}>
      {flipped
        ? <><span>ATTRIBUTE SLOTS</span><strong>data-role</strong><strong>data-unit</strong><strong>data-issued</strong><strong className="is-blank">[ unlabeled ] ████</strong></>
        : <><span>PERSONNEL FILE</span><strong>NAME: UNKNOWN</strong><strong>CLEARANCE: REVOKED</strong><strong>STATUS: MISSING</strong></>}
    </div>
    {flipped
      ? <p className="bt-identity-note">인쇄된 칸은 3개, 카드가 든 값은 4개.</p>
      : <button type="button" className="bt-action-button" onClick={flip}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** 05 — the relay shows that something rides along before it forwards. */
function RelayRoute({ actionLabel, onLog, onRoute }: InstrumentProps) {
  return <div className="bt-relay">
    <p className="bt-relay__title">GATEWAY RELAY</p>
    <div className="bt-relay__path"><span>node 05</span><i /><span className="is-next">next node</span></div>
    <p className="bt-relay__carry">carried with the move: <strong>1 parameter</strong></p>
    <button type="button" className="bt-action-button" onClick={() => { onLog(["> gateway relay engaged", "> forwarding to next node..."]); onRoute(); }}>{actionLabel} <ChevronRight size={18} /></button>
  </div>;
}

/** 06 — the body arrives on a meter and the view throws it away in front of the operator. */
function TransferGauge({ actionLabel, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
  const [bytes, setBytes] = useState(-1);
  const connect = async () => {
    if (bytes >= 0) return;
    onBusy();
    onLog(["> establishing connection...", "> handshake accepted"]);
    await onRemote("response");
    for (const value of [18, 44, 71, 92]) { await delay(260); setBytes(value); }
    await delay(420);
    setBytes(-2);
    onLog(["> establishing connection...", "> handshake accepted", "> body received: 92 bytes", "> rendered: 0 bytes", "[-] CONNECTION FAILED"]);
    onDone();
  };
  const discarded = bytes === -2;
  return <div className="bt-gauge">
    <Wifi size={28} />
    <p className="bt-gauge__title">REMOTE NODE CONNECTION</p>
    <div className="bt-gauge__track"><i style={{ width: `${Math.max(0, bytes) / 92 * 100}%` }} className={discarded ? "is-discarded" : ""} /></div>
    <p className="bt-gauge__count">{discarded ? "received 92 bytes · rendered 0" : bytes < 0 ? "awaiting transfer" : `${bytes} / 92 bytes`}</p>
    {discarded
      ? <p className="bt-gauge__note">본문은 도착했고, 화면이 버렸다.</p>
      : <button type="button" className="bt-action-button" onClick={connect} disabled={bytes >= 0}>{bytes >= 0 ? "RECEIVING" : actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** 07 — the route is two hops, and the one that knew the way is not the one that answered. */
function HopTrace({ actionLabel, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
  const [hops, setHops] = useState(0);
  const trace = async () => {
    if (hops > 0) return;
    onBusy();
    onLog(["> movement trace sent"]);
    await onRemote("redirect");
    await delay(420); setHops(1);
    await delay(520); setHops(2);
    onLog(["> movement trace sent", "> hop 1: 302", "> hop 2: 404", "[-] RECORD NOT FOUND"]);
    onDone();
  };
  return <div className="bt-hops">
    <p className="bt-hops__title">PERSONNEL TRACE</p>
    <ol>
      <li className={hops >= 1 ? "is-on" : ""}><span>HOP 1</span><strong>{hops >= 1 ? "302" : "· · ·"}</strong><small>{hops >= 1 ? "headers not rendered here" : ""}</small></li>
      <li className={hops >= 2 ? "is-on is-final" : ""}><span>HOP 2</span><strong>{hops >= 2 ? "404" : "· · ·"}</strong><small>{hops >= 2 ? "record not found" : ""}</small></li>
    </ol>
    {hops >= 2
      ? <p className="bt-hops__note">404는 두 번째 응답이다. 길을 알려준 것은 첫 번째.</p>
      : <button type="button" className="bt-action-button" onClick={trace} disabled={hops > 0}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** 08 — the headers are listed and one of them has no name the operator can read here. */
function HeaderList({ actionLabel, target, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
  const known = ["content-type", "content-length", "date", "server", "cache-control"];
  const [open, setOpen] = useState(false);
  const request = async () => {
    if (open) return;
    onBusy();
    onLog(["> status requested"]);
    await onRemote("header");
    await delay(520);
    setOpen(true);
    onLog(["> status requested", "STATUS: ONLINE", "> body: { }", "> headers: 6 (1 non-standard)", "[!] BODY EMPTY"]);
    onDone();
  };
  return <div className="bt-headers">
    <p className="bt-headers__title">COMMUNICATION NODE</p>
    {/* A node whose whole subject is "the channel carries more than the body" had nothing on it
        but the empty body and a button. The carrier is drawn instead: the channel is plainly
        alive, which is the thing that makes an empty body worth a second look. */}
    <div className="bt-carrier" aria-hidden="true">
      {/* An oscilloscope keeps the trace on the tube and runs a brighter beam along it, so the
          waveform is readable at every moment instead of only while a dash happens to cross. */}
      <svg viewBox="0 0 240 44" preserveAspectRatio="none">
        <path className="is-trace" d={carrierWave} />
        <path className="is-beam" d={carrierWave} />
      </svg>
      <span className="bt-carrier__sweep" />
    </div>
    <dl className="bt-headers__channel">
      <div><dt>CHANNEL</dt><dd><code>{target}</code></dd></div>
      <div><dt>CARRIER</dt><dd className="is-live">● TRANSMITTING</dd></div>
      <div><dt>LAST BODY</dt><dd><code>{"{ }"}</code> <small>0 bytes</small></dd></div>
    </dl>
    {open
      ? <><ul>{known.map(name => <li key={name}><code>{name}</code></li>)}<li className="is-unknown"><code>x-????????</code><em>████████</em></li></ul>
          <p className="bt-headers__note">헤더 6개 중 하나는 표준이 아니다.</p></>
      : <button type="button" className="bt-action-button" onClick={request}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** 09 — the crawler gets an answer the screen never does. */
function CrawlerDialog({ actionLabel, onLog, onBusy, onDone }: InstrumentProps) {
  const [step, setStep] = useState(0);
  const ping = async () => {
    if (step > 0) return;
    onBusy();
    onLog(["> automated crawler detected"]);
    for (const value of [1, 2, 3]) { await delay(460); setStep(value); }
    onLog(["> automated crawler detected", "> crawler asked for indexing policy", "> served to crawler: 1 file", "> served to screen: 0", "[!] POLICY NOT RENDERED"]);
    onDone();
  };
  return <div className="bt-crawler">
    <pre>{"[ o_o ]\n /|_|\\\n  / \\"}</pre>
    <p className="bt-crawler__title">AUTOMATED SECURITY NODE</p>
    <ul>
      <li className={step >= 1 ? "is-on" : ""}><span>crawler → server</span><strong>{step >= 1 ? "indexing policy?" : "· · ·"}</strong></li>
      <li className={step >= 2 ? "is-on" : ""}><span>server → crawler</span><strong>{step >= 2 ? "1 file" : "· · ·"}</strong></li>
      <li className={step >= 3 ? "is-on is-empty" : ""}><span>server → screen</span><strong>{step >= 3 ? "nothing" : "· · ·"}</strong></li>
    </ul>
    {step >= 3
      ? <p className="bt-crawler__note">그 파일은 화면 바깥에 있다.</p>
      : <button type="button" className="bt-action-button" onClick={ping} disabled={step > 0}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}
