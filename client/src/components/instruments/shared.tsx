import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { InstrumentProps as Common } from "./types";

/**
 * The first ten nodes each got a component written for them by hand. Twenty cannot be built that
 * way and fifty certainly cannot, so the nodes that exercise the same panel share an instrument and
 * differ by their data: the rows it reads, the count that does not add up, and the line it closes
 * on. What stays bespoke is the nodes whose subject is genuinely its own.
 */

export const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

/* --- The browser holds more of the page than it draws ------------------------------------------
   Five nodes make that point from five directions, so the sweep counts what is present against
   what is painted and says which one is short. Where the trace is planted differs every time, and
   that is the part the operator has to find. */

type SweepConfig = { title: string; rows: string[]; present: number; painted: number; note: string };

const sweeps: Record<string, SweepConfig> = {
  tooltip: { title: "LABEL INSPECTOR", rows: ["라벨 1 · 접수 단말기", "라벨 2 · 반출 기록", "라벨 3 · 폐기 대기"],
    present: 3, painted: 3, note: "세 개 모두 그려졌다. 다만 한 라벨은 화면에 나온 글자보다 길다." },
  "invisible-ink": { title: "RENDER AUDIT", rows: ["블록 1 · 접수", "블록 2 · 검토", "블록 3 · 승인", "블록 4 · 반출"],
    present: 4, painted: 3, note: "네 개가 왔고 세 개가 그려졌다. 나머지 하나는 버려진 것이 아니다." },
  "template-tag": { title: "RENDER QUEUE", rows: ["대기 1 · 승인 안내", "대기 2 · 반려 안내", "대기 3 · 관리자 안내"],
    present: 3, painted: 0, note: "세 조각 모두 아직 그려지지 않았다. 그려지지 않았다는 것이 오지 않았다는 뜻은 아니다." },
  "shadow-root": { title: "COMPONENT TREE", rows: ["호스트 · widget-host", "자식 · (문서에서 조회 불가)"],
    present: 2, painted: 1, note: "이 구성요소는 자기 안쪽을 따로 들고 있다. 바깥 문서에서 찾으면 걸리지 않는다." },
};

export function SurfaceSweep({ surface, trace, actionLabel, onLog, onBusy, onDone }: Common & { surface: string }) {
  const config = sweeps[surface];
  const [shown, setShown] = useState(-1);
  const host = useRef<HTMLDivElement>(null);

  // Each node plants its trace in the layer its own lesson is about.
  useEffect(() => {
    const node = host.current;
    if (!node || !trace) return;
    if (surface === "template-tag") {
      const template = document.createElement("template");
      template.innerHTML = `<p data-queued="approval">${trace}</p>`;
      node.appendChild(template);
      return () => template.remove();
    }
    if (surface === "shadow-root") {
      // An element may only be given one shadow root, so a mounted host is reused.
      const root = node.shadowRoot ?? node.attachShadow({ mode: "open" });
      root.innerHTML = `<span part="note">${trace}</span>`;
      return;
    }
    const planted = document.createElement("span");
    if (surface === "tooltip") {
      planted.title = trace;
      planted.textContent = "반출 기록";
      planted.className = "bt-sweep__label";
    } else if (surface === "invisible-ink") {
      planted.textContent = trace;
      planted.style.display = "none";
    } else {
      planted.textContent = trace;
      planted.style.cssText = "position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden";
    }
    node.appendChild(planted);
    return () => planted.remove();
  }, [surface, trace]);

  const run = async () => {
    if (shown >= 0) return;
    onBusy();
    onLog([`> sweeping ${surface}...`]);
    for (let index = 0; index < config.rows.length; index += 1) {
      await delay(360);
      setShown(index);
    }
    await delay(360);
    setShown(config.rows.length);
    onLog([`> sweeping ${surface}...`, `> present: ${config.present}`, `> painted: ${config.painted}`,
      config.present === config.painted ? "[!] COUNT MATCHES — CONTENT DOES NOT" : "[!] COUNT MISMATCH"]);
    onDone();
  };

  return <div className="bt-sweep">
    <p className="bt-sweep__title">{config.title}</p>
    <ol>{config.rows.map((row, index) => <li key={row} className={shown >= index ? "is-read" : ""}>{shown >= index ? row : "· · ·"}</li>)}</ol>
    <div ref={host} className="bt-sweep__host" />
    {shown >= config.rows.length
      ? <><p className="bt-sweep__count">발견 {config.present} · 그려짐 {config.painted}</p><p className="bt-sweep__note">{config.note}</p></>
      : <button type="button" className="bt-action-button" onClick={run}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/* --- Everything the browser keeps for a site ---------------------------------------------------
   The cookie node already probed store by store. The three stores after it are the same gesture on
   different shelves, which is exactly the point, so they share it. */

type StoreConfig = { title: string; stores: { id: string; entries: number; key: string | null }[]; closing: string };

const probes: Record<string, StoreConfig> = {
  "local-memory": { title: "PERSISTENT STORE", closing: "탭을 닫아도 남는 자리다. 값은 이 화면에 없다.",
    stores: [{ id: "sessionStorage", entries: 0, key: null }, { id: "localStorage", entries: 1, key: "profile_hint" }, { id: "cookie", entries: 0, key: null }] },
  "until-you-leave": { title: "VOLATILE STORE", closing: "이 탭이 닫히면 사라진다. 아직 닫히지 않았다.",
    stores: [{ id: "localStorage", entries: 0, key: null }, { id: "sessionStorage", entries: 1, key: "draft_note" }, { id: "cookie", entries: 0, key: null }] },
  "deeper-store": { title: "OBJECT STORE", closing: "열쇠-값 한 쌍보다 깊은 저장 수단이 있다.",
    stores: [{ id: "localStorage", entries: 0, key: null }, { id: "sessionStorage", entries: 0, key: null }, { id: "IndexedDB", entries: 1, key: "offline_notes" }] },
};

export function StoreProbe({ surface, trace, onLog, onDone }: Common & { surface: string }) {
  const config = probes[surface];
  const [probed, setProbed] = useState<string[]>([]);

  useEffect(() => {
    if (!trace) return;
    try {
      if (surface === "local-memory") {
        window.localStorage.setItem("profile_hint", trace);
        return () => window.localStorage.removeItem("profile_hint");
      }
      if (surface === "until-you-leave") {
        window.sessionStorage.setItem("draft_note", trace);
        return () => window.sessionStorage.removeItem("draft_note");
      }
      const open = window.indexedDB.open("offline-db", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("offline_notes");
      open.onsuccess = () => {
        const database = open.result;
        database.transaction("offline_notes", "readwrite").objectStore("offline_notes").put(trace, "archive_note");
      };
    } catch {
      // A browser with storage blocked still gets a working node; only the trace is unreachable.
    }
  }, [surface, trace]);

  const probe = (id: string) => {
    if (probed.includes(id)) return;
    const next = [...probed, id];
    setProbed(next);
    const store = config.stores.find(item => item.id === id)!;
    onLog([`> probing ${id}...`, `> entries: ${store.entries}`, store.key ? `[!] surviving key: ${store.key}` : "> nothing retained"]);
    if (next.length === config.stores.length) onDone();
  };

  return <div className="bt-probe">
    <p className="bt-probe__title">{config.title} // LOCAL STORES</p>
    {config.stores.map(store => {
      const done = probed.includes(store.id);
      return <div key={store.id} className={`bt-probe__row${done ? " is-probed" : ""}`}>
        <code>{store.id}</code>
        {done
          ? <span className="bt-probe__result">{store.key ? <>1 entry · <strong>{store.key}</strong> = <em>████████</em></> : "0 entries"}</span>
          : <button type="button" onClick={() => probe(store.id)}>PROBE</button>}
      </div>;
    })}
    <p className="bt-probe__note">{probed.length < config.stores.length ? `${probed.length} / ${config.stores.length} 검사함` : config.closing}</p>
  </div>;
}

/* --- Files the server hands out without being asked --------------------------------------------
   The index listing is the same move for both: fetch what the server publishes and notice the
   entry nothing on the site links to. */

const indexes: Record<string, { title: string; path: string; files: string[]; note: string }> = {
  sitemap: { title: "INDEX FILE", path: "sitemap.xml", note: "목록에 화면 어디에서도 연결되지 않은 주소가 하나 섞여 있다.",
    files: ["/", "/black-trace", "/ranking", "/certificate", "/internal/… (링크 없음)"] },
  "source-map": { title: "BUILD OUTPUT", path: "legacy/report.js", note: "압축된 파일 옆에 원본으로 되돌릴 안내서가 함께 올라가 있다.",
    files: ["report.js  (압축됨)", "report.js.map  (원본 복원용)"] },
};

export function FileIndex({ surface, actionLabel, onLog, onBusy, onDone }: Common & { surface: string; base: string }) {
  const config = indexes[surface];
  const [listed, setListed] = useState(false);
  const run = async () => {
    if (listed) return;
    onBusy();
    onLog([`> requesting /${config.path}...`]);
    await delay(620);
    setListed(true);
    onLog([`> requesting /${config.path}...`, `> served by the server, linked by nothing`, `> entries: ${config.files.length}`, "[!] UNLINKED ENTRY PRESENT"]);
    onDone();
  };
  return <div className="bt-index">
    <p className="bt-index__title">{config.title}</p>
    <code className="bt-index__path">/{config.path}</code>
    {listed
      ? <><ul>{config.files.map(file => <li key={file}>{file}</li>)}</ul><p className="bt-index__note">{config.note}</p></>
      : <button type="button" className="bt-action-button" onClick={run}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/* --- Requests the operator has to shape ---------------------------------------------------------
   Up to here the answer was in a response that arrived on its own. From here the request itself is
   the puzzle: the same address answers differently depending on how it is asked. The rig sends the
   plain request so the refusal is visible, and says what the refusal is about without saying what
   to change. */

type RigConfig = { title: string; mode: string; method?: string; probe: string; refusal: string; note: string };

const rigs: Record<string, RigConfig> = {
  "wrong-method": { title: "INTAKE API", mode: "method", probe: "GET /intake", refusal: "405 METHOD NOT ALLOWED",
    note: "창구는 열려 있다. 두드리는 방식이 이 방식은 아니다." },
  "cookie-flags": { title: "SESSION ISSUER", mode: "cookie", probe: "GET /session", refusal: "200 · 세션 발급됨",
    note: "값은 평범하다. 값과 함께 나온 것이 평범하지 않다." },
  "claimed-role": { title: "CONTENT GATE", mode: "role", probe: "GET /gate", refusal: "200 · public summary only",
    note: "서버가 요구하는 것이 응답에 적혀 있다. 그것을 적어 보내는 쪽은 당신이다." },
  referer: { title: "PARTNER PORTAL", mode: "referer", probe: "GET /portal", refusal: "403 INTERNAL REFERRAL REQUIRED",
    note: "내부에서 넘어온 요청만 받는다. 어디서 왔는지는 요청에 적힌다." },
  etag: { title: "ASSET CACHE", mode: "etag", probe: "GET /asset", refusal: "200 · size 2048",
    note: "본문은 평범하다. 같은 파일임을 알아보는 표가 따로 붙어 나온다." },
  range: { title: "ARCHIVE STORE", mode: "range", probe: "GET /archive", refusal: "200 · FULL TRANSFER REFUSED",
    note: "통째로는 주지 않는다. 어디부터 어디까지인지 말하면 다르다." },
  preflight: { title: "CROSS ORIGIN", mode: "preflight", method: "OPTIONS", probe: "OPTIONS /resource", refusal: "204 · 본문 없음",
    note: "본 요청 전에 오가는 대화가 따로 있다. 그 답에 서버의 사정이 적힌다." },
  "status-only": { title: "ACK NODE", mode: "ack", probe: "GET /ack", refusal: "204 NO CONTENT",
    note: "본문이 없다. 응답이 없는 것과는 다르다." },
  "content-type": { title: "REPORT EXPORT", mode: "export", probe: "GET /export", refusal: "200 · 화면에 열리지 않음",
    note: "내용이 잘못된 것이 아니다. 종류를 잘못 적어 보냈을 뿐이다." },
  "two-requests": { title: "DISPATCH NODE", mode: "dispatch", probe: "GET /dispatch", refusal: "200 · STAGED",
    note: "첫 응답은 답이 아니다. 다음에 어디로 물어야 하는지를 알려줄 뿐이다." },
};

export function RequestRig({ nodeKey, actionLabel, onLog, onBusy, onDone, onRemote }: Common & { surface: string }) {
  const config = rigs[nodeKey];
  const [sent, setSent] = useState(false);
  const send = async () => {
    if (sent) return;
    onBusy();
    onLog([`> ${config.probe}`]);
    // The plain request really is sent: the refusal the operator reads is the server's own.
    await onRemote(config.mode);
    await delay(560);
    setSent(true);
    onLog([`> ${config.probe}`, `> ${config.refusal}`, "[!] REQUEST DID NOT MATCH THE NODE"]);
    onDone();
  };
  return <div className="bt-rig">
    <p className="bt-rig__title">{config.title}</p>
    <div className="bt-rig__wire">
      <span className="bt-rig__out">{config.probe}</span>
      <span className="bt-rig__arrow">→</span>
      <span className={`bt-rig__in${sent ? " is-answered" : ""}`}>{sent ? config.refusal : "· · ·"}</span>
    </div>
    {sent
      ? <p className="bt-rig__note">{config.note}</p>
      : <button type="button" className="bt-action-button" onClick={send}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/* --- Values that have to be read before they can be submitted ----------------------------------
   The trace is derived per operator as everywhere else; the bench encodes that derived value when
   it renders. The bundle therefore carries the encoders and never a value, and two operators are
   not looking at the same blob.

   The readout names what can be observed about the shape — the alphabet in use, how many segments,
   how long — and never the method. Naming the method is the answer. */

const toBytes = (text: string) => Array.from(new TextEncoder().encode(text));
const b64 = (text: string) => btoa(String.fromCharCode(...toBytes(text)));
const b64Bytes = (bytes: number[]) => btoa(String.fromCharCode(...bytes));
const b64urlBytes = (bytes: number[]) => b64Bytes(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64url = (text: string) => b64(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (text: string) => toBytes(text).map(byte => byte.toString(16).padStart(2, "0")).join("");
const rot13 = (text: string) => text.replace(/[a-zA-Z]/g, letter => {
  const base = letter <= "Z" ? 65 : 97;
  return String.fromCharCode(((letter.charCodeAt(0) - base + 13) % 26) + base);
});
// encodeURIComponent only escapes the braces, which left the label itself readable and the node
// with nothing to solve. Every byte is escaped instead, which is also what the loggers and the
// evasion payloads a diagnostic meets in the field actually look like.
const percentAll = (text: string) => toBytes(text).map(byte => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`).join("");
const xorHex = (text: string, key: number) => toBytes(text).map(byte => (byte ^ key).toString(16).padStart(2, "0")).join("");
const jwt = (payload: Record<string, unknown>, header: Record<string, unknown>, tail: string) =>
  `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}.${tail}`;

type BenchConfig = { title: string; label: string; encode: (trace: string) => string; observed: (value: string) => string[]; note: string };

const benches: Record<string, BenchConfig> = {
  "plain-sight": { title: "CONFIG STORE", label: "stored_value", encode: b64,
    observed: value => [`길이 ${value.length}`, "A–Z a–z 0–9 + / 와 끝의 = 만 사용", "열쇠 없이 되돌아감"],
    note: "포장을 벗기는 데 아무것도 필요하지 않았다." },
  "bytes-as-text": { title: "MEMORY DUMP", label: "dump_slice", encode: hex,
    observed: value => [`길이 ${value.length} (짝수)`, "0–9 a–f 만 사용", "두 글자가 한 덩어리"],
    note: "두 글자씩 한 바이트다." },
  "percent-signs": { title: "ACCESS LOG", label: "query_value", encode: percentAll,
    observed: value => [`길이 ${value.length}`, "% 뒤에 두 글자가 따라붙음", "주소에 실려 기록된 형태"],
    note: "주소에 실릴 때 자리를 바꿔 적은 글자다." },
  shifted: { title: "OPERATOR NOTE", label: "note_body", encode: rot13,
    observed: value => [`길이 ${value.length}`, "글자 종류가 원문과 같음", "중괄호와 밑줄은 그대로"],
    note: "모양은 그대로다. 자리만 밀렸다." },
  "one-byte-key": { title: "FIRMWARE BLOB", label: "blob_slice", encode: text => xorHex(text, 0x2a),
    observed: value => [`길이 ${value.length} (짝수)`, "0–9 a–f 만 사용", "앞머리가 늘 같은 네 덩어리로 시작"],
    note: "앞머리는 어느 흔적이나 같다. 그 네 글자가 열쇠를 알려 준다." },
  // The node is about the variant alphabet, so the value has to actually use it — and base64 of
  // plain ASCII essentially never does. Reaching 111110 or 111111 in a six-bit group needs a byte
  // above 0x7F in every position but the last, so a trace made of letters and braces encodes to a
  // string identical to the plain-base64 node's. A binary tail is appended, which is also what a
  // real token looks like: text followed by bytes that are not text.
  "two-alphabets": { title: "TOKEN STORE", label: "token_value",
    encode: trace => b64urlBytes([...toBytes(trace), 0xff, 0xfe, 0xfd]),
    observed: value => [`길이 ${value.length}`, "- 또는 _ 가 섞여 있음", "끝에 = 가 없음", "벗기면 뒤쪽에 글자가 아닌 것이 붙어 있음"],
    note: "익숙한 포장인데 쓰인 글자 둘이 다르다. 표준 해독기는 여기서 막힌다." },
  "three-parts": { title: "AUTH ISSUER", label: "access_token",
    encode: trace => jwt({ sub: "op-7f21", role: "operator", note: trace }, { alg: "HS256", typ: "JWT" }, "c2lnbmF0dXJlLXdpdGhoZWxk"),
    observed: value => [`점으로 나뉜 ${value.split(".").length} 조각`, "앞 두 조각만 글자 종류가 같음", "서명이 붙어 있음"],
    note: "서명은 위조를 막는다. 가리지는 않는다." },
  "no-signature": { title: "LEGACY ISSUER", label: "access_token",
    encode: trace => jwt({ sub: "op-0004", role: "operator" }, { alg: "none", typ: "JWT" }, b64url(trace)),
    observed: value => [`점으로 나뉜 ${value.split(".").length} 조각`, "첫 조각이 서명 방식을 선언함", "세 조각 모두 같은 글자 종류"],
    note: "서명이 있어야 할 자리가 서명이 아니다." },
  "wrapped-twice": { title: "RELAY QUEUE", label: "message_body", encode: trace => b64(percentAll(trace)),
    observed: value => [`길이 ${value.length}`, "A–Z a–z 0–9 + / 와 끝의 =", "한 겹을 벗겨도 아직 읽히지 않음"],
    note: "한 겹 아래에 또 한 겹이 있다." },
  "layer-by-layer": { title: "EXFIL CAPTURE", label: "captured_chunk", encode: trace => hex(b64(rot13(trace))),
    observed: value => [`길이 ${value.length} (짝수)`, "0–9 a–f 만 사용", "벗길 때마다 글자 종류가 달라짐"],
    note: "겹마다 방식이 다르다. 벗긴 뒤 무엇이 남는지를 보고 다음을 정한다." },
};

export function CipherBench({ nodeKey, trace, actionLabel, onLog, onBusy, onDone }: Common & { surface: string }) {
  const config = benches[nodeKey];
  const value = trace ? config.encode(trace) : "";
  const [read, setRead] = useState(false);
  const run = async () => {
    if (read) return;
    onBusy();
    onLog([`> reading ${config.label}...`]);
    await delay(540);
    setRead(true);
    onLog([`> reading ${config.label}...`, `> length: ${value.length}`, "> charset: observed", "[!] VALUE NOT IN PLAIN FORM"]);
    onDone();
  };
  return <div className="bt-bench">
    <p className="bt-bench__title">{config.title}</p>
    <p className="bt-bench__label">{config.label}</p>
    <code className="bt-bench__value">{read ? value : "· · · · · · · ·"}</code>
    {read
      ? <><ul className="bt-bench__observed">{config.observed(value).map(line => <li key={line}>{line}</li>)}</ul>
          <p className="bt-bench__note">{config.note}</p></>
      : <button type="button" className="bt-action-button" onClick={run}>{actionLabel} <ChevronRight size={18} /></button>}
  </div>;
}

/** Exposed so the encoders can be exercised directly: a node whose value does not reverse to the
 *  plain trace is unsolvable, and nothing on screen would say so. */
export const cipherBenches = benches;
export const benchNodeKeys = Object.keys(benches);

export const rigNodeKeys = Object.keys(rigs);

export const sweepSurfaces = Object.keys(sweeps);
export const probeSurfaces = Object.keys(probes);
export const indexSurfaces = Object.keys(indexes);
