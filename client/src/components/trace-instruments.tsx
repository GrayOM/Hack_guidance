import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

/**
 * The first ten nodes each got a component written for them by hand. Twenty cannot be built that
 * way and fifty certainly cannot, so the nodes that exercise the same panel share an instrument and
 * differ by their data: the rows it reads, the count that does not add up, and the line it closes
 * on. What stays bespoke is the nodes whose subject is genuinely its own.
 */

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

type Common = {
  actionLabel?: string;
  trace: string;
  onLog: (lines: string[]) => void;
  onBusy: () => void;
  onDone: () => void;
};

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
  "off-screen": { title: "LAYOUT PROBE", rows: ["요소 1 · 좌측 패널", "요소 2 · 본문", "요소 3 · ???"],
    present: 3, painted: 2, note: "세 번째 요소는 자리를 차지하고 있다. 그 자리가 화면 안이 아닐 뿐이다." },
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

export const sweepSurfaces = Object.keys(sweeps);
export const probeSurfaces = Object.keys(probes);
export const indexSurfaces = Object.keys(indexes);
