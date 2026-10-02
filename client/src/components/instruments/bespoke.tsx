import { useEffect, useRef, useState } from "react";
import { ChevronRight, Lock, LockKeyhole, Wifi } from "lucide-react";
import type { InstrumentProps } from "./types";
import { delay } from "./shared";

/**
 * The instruments whose subject is genuinely their own. Ten nodes once kept these inside the node
 * screen while the shared families lived in a module of their own, which meant the screen was half
 * screen and half instrument and no single place held them all.
 */

const carrierWave = "M0 22 L30 22 L38 8 L46 36 L54 22 L84 22 L92 14 L100 30 L108 22 L150 22 L158 6 L166 38 L174 22 L210 22 L218 16 L226 28 L234 22 L240 22";

/**
 * Node 04 is about knowing which store a browser keeps per site, so it is probed store by store
 * instead of being reported in one go. The key that survives is named; its value never is.
 */
export function StorageProbe({ onLog, onDone }: { onLog: (lines: string[]) => void; onDone: () => void }) {
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
export function VaultAssembly({ trace, actionLabel, onLog, onRemote, onBusy, onDone }: InstrumentProps) {
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

/** 01 — the record is rebuilt block by block and one index never draws. */
export function RecordRestore({ actionLabel, onLog, onBusy, onDone }: InstrumentProps) {
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

/**
 * The payload is built in front of the operator and carries one more entry than the form.
 *
 * The carrier is hidden by the hidden attribute rather than by type="hidden", and its value is
 * assigned to the DOM property. On a type="hidden" input the value property reflects the content
 * attribute, so assigning it wrote the trace straight back into the markup: the node read as "find
 * the attribute in Elements", which is the node after it. On a text input the property is separate
 * state, so the markup carries no value and un-hiding the field is what reveals it.
 *
 * That is also the more useful lesson. A value a script puts into a field never appears in view
 * source and is submitted all the same, which is why "it is not in the HTML" is not an argument
 * that a value is safe.
 */
export function FormPayload({ actionLabel, trace, onLog, onBusy, onDone }: InstrumentProps) {
  const [sent, setSent] = useState(false);
  const carrier = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (carrier.current) carrier.current.value = trace;
  }, [trace]);
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
    {/* No value prop: React would write it into the markup as an attribute. */}
    <input type="text" hidden readOnly tabIndex={-1} aria-hidden="true" name="legacy_note" ref={carrier} />
    {sent ? <div className="bt-payload"><p>OUTGOING PAYLOAD</p><code>user_id = ""</code><code className="is-masked">{"????????"} = ████████</code><small>전송 2건 · 화면의 칸 1개</small></div> : null}
  </div>;
}

/** 03 — the card turns over, and the back has one slot the front never printed. */
export function IdentityCard({ actionLabel, trace, onLog, onBusy, onDone }: InstrumentProps) {
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
export function RelayRoute({ actionLabel, onLog, onRoute }: InstrumentProps) {
  return <div className="bt-relay">
    <p className="bt-relay__title">GATEWAY RELAY</p>
    <div className="bt-relay__path"><span>node 05</span><i /><span className="is-next">next node</span></div>
    <p className="bt-relay__carry">carried with the move: <strong>1 parameter</strong></p>
    <button type="button" className="bt-action-button" onClick={() => { onLog(["> gateway relay engaged", "> forwarding to next node..."]); onRoute(); }}>{actionLabel} <ChevronRight size={18} /></button>
  </div>;
}

/** 06 — the body arrives on a meter and the view throws it away in front of the operator. */
export function TransferGauge({ actionLabel, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
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
export function HopTrace({ actionLabel, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
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
export function HeaderList({ actionLabel, target, onLog, onBusy, onDone, onRemote }: InstrumentProps) {
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
export function CrawlerDialog({ actionLabel, onLog, onBusy, onDone }: InstrumentProps) {
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
