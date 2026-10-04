import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const REPO_ROOT = new URL("../../", import.meta.url).pathname;
const shared = readFileSync(`${REPO_ROOT}shared/black-trace.ts`, "utf8");
const allLabels = Object.fromEntries([...shared.slice(shared.indexOf("export const traceLabels"), shared.indexOf("const tierNames"))
  .matchAll(/^\s{2}"?([a-z-]+)"?:\s*"([a-z_]+)",$/gm)].map(m => [m[1], m[2]]));
const planted = [...shared.matchAll(/id: (\d+),\s*\n\s*key: "([a-z-]+)",[\s\S]*?title: "([^"]+)",[\s\S]*?surface: "([a-z-]+)"/g)]
  .map(m => ({ id: +m[1], key: m[2], title: m[3], surface: m[4] }))
  .filter(n => allLabels[n.key]);
const src = shared;
const labels = Object.fromEntries([...src.slice(src.indexOf("export const traceLabels"), src.indexOf("const tierNames"))
  .matchAll(/^\s{2}"?([a-z-]+)"?:\s*"([a-z_]+)",$/gm)].map(m => [m[1], m[2]]));
const TOKEN = "d4e5f6a7b8c9";
const flagFor = k => k === "fragmented-key" ? `FLAG{${labels[k]}_${TOKEN}_` : `FLAG{${labels[k]}_${TOKEN}}`;

/** The decoders an operator would reach for. A cipher node is sound when one of them returns the
 *  plain trace: readable with work, not readable at a glance. */
function reverse(value, flag) {
  if (!value) return null;
  const step = {
    "base64": v => Buffer.from(v, "base64").toString("utf8"),
    "base64url": v => Buffer.from(v, "base64url").toString("utf8"),
    "hex": v => Buffer.from(v, "hex").toString("utf8"),
    "percent": v => decodeURIComponent(v),
    "rot13": v => v.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= "Z" ? 65 : 97) + ((c.charCodeAt(0) - (c <= "Z" ? 65 : 97) + 13) % 26))),
    "xor 0x2a": v => Buffer.from(v, "hex").map(b => b ^ 0x2a).toString("utf8"),
    // A token's three segments are three places to look, and one node hides the trace in the
    // segment where a signature belongs rather than in the payload.
    "jwt 1번째조각": v => Buffer.from(v.split(".")[0] ?? "", "base64url").toString("utf8"),
    "jwt 2번째조각": v => Buffer.from(v.split(".")[1] ?? "", "base64url").toString("utf8"),
    "jwt 3번째조각": v => Buffer.from(v.split(".")[2] ?? "", "base64url").toString("utf8"),
  };
  // Up to three layers, because one node is deliberately three deep and changes method each time.
  const search = (current, path) => {
    if (path.length && current.includes(flag)) return path.join(" → ");
    if (path.length >= 3) return null;
    for (const [name, fn] of Object.entries(step)) {
      let next; try { next = fn(current); } catch { continue; }
      if (!next || next === current) continue;
      const hit = search(next, [...path, name]);
      if (hit) return hit;
    }
    return null;
  };
  return search(value, []);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.route(url => url.hostname === "stand-in.test", route => {
  const body = JSON.parse(route.request().postData() ?? "{}");
  const reply = d => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(d), headers: { "Access-Control-Allow-Origin": "*" } });
  if (body.action === "blackTraceProgress") return reply({ completedStages: Array.from({ length: 50 }, (_, i) => i + 1), currentStage: 50, accessLevel: "OPERATOR", completed: true });
  if (body.action === "blackTraceSurface") return reply({ stage: body.stage, token: TOKEN });
  if (body.action === "blackTraceSubmit") return reply({ correct: true, completedStages: [], accessLevel: "OPERATOR", operationComplete: false });
  return reply({});
});

const results = [];
for (const node of planted) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 120)));
  await page.goto(`http://localhost:5173/black-trace/${node.id}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Most instruments plant on action, so press the panel's primary button when there is one.
  const btn = await page.$(".bt-scene__center .bt-action-button");
  if (btn) { await btn.click().catch(() => {}); await page.waitForTimeout(900); }
  const flag = flagFor(node.key);

  const found = await page.evaluate(({ flag }) => {
    const hits = [];
    const walkShadow = root => {
      let out = "";
      for (const el of root.querySelectorAll("*")) if (el.shadowRoot) out += el.shadowRoot.innerHTML + walkShadow(el.shadowRoot);
      return out;
    };
    const html = document.documentElement.outerHTML;
    if (html.includes(flag)) hits.push("DOM 마크업");
    if (walkShadow(document).includes(flag)) hits.push("shadow DOM");
    for (const el of document.querySelectorAll("input,textarea")) if (el.value?.includes(flag)) hits.push("입력 칸 value");
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if ((localStorage.getItem(k) ?? "").includes(flag) || k.includes(flag)) hits.push("localStorage"); } } catch {}
    try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if ((sessionStorage.getItem(k) ?? "").includes(flag) || k.includes(flag)) hits.push("sessionStorage"); } } catch {}
    if (document.cookie.includes(flag)) hits.push("쿠키");
    // The address bar is a place a value can be planted too, and one node's whole lesson is that.
    const href = decodeURIComponent(location.href);
    if (href.includes(flag)) hits.push("주소창");
    const visible = (document.body.innerText || "").includes(flag);
    const bench = document.querySelector(".bt-bench__value")?.textContent?.trim() ?? "";
    return { hits: [...new Set(hits)], visible, bench };
  }, { flag });

  // IndexedDB is asynchronous, so it is read separately.
  if (!found.hits.length) {
    const idb = await page.evaluate(async ({ flag }) => {
      if (!indexedDB.databases) return false;
      for (const info of await indexedDB.databases()) {
        const db = await new Promise(r => { const q = indexedDB.open(info.name); q.onsuccess = () => r(q.result); q.onerror = () => r(null); });
        if (!db) continue;
        for (const store of db.objectStoreNames) {
          const rows = await new Promise(r => { const q = db.transaction(store).objectStore(store).getAll(); q.onsuccess = () => r(q.result); q.onerror = () => r([]); });
          if (JSON.stringify(rows).includes(flag)) return true;
        }
      }
      return false;
    }, { flag }).catch(() => false);
    if (idb) found.hits.push("IndexedDB");
  }
  found.decoded = node.surface === "cipher" ? reverse(found.bench, flag) : null;
  results.push({ ...node, flag, ...found, errors });
  await page.close();
}
await browser.close();

console.log("=== 심는 방식 노드: 값이 실제로 브라우저에 있는가 ===\n");
const bad = [];
for (const r of results) {
  const cipher = r.surface === "cipher";
  // "No plaintext" passes on a blank page too, so a cipher node also has to render a value that
  // actually turns back into the flag. That is the node: reversible, but not readable.
  const ok = cipher ? (r.hits.length === 0 && r.decoded) : r.hits.length > 0;
  const note = cipher
    ? (r.hits.length ? `평문이 그대로 있음 (${r.hits.join(", ")})`
       : r.decoded ? `인코딩됨 → ${r.decoded} 로 되돌림` : `되돌릴 수 없음 (표시값 ${r.bench ? r.bench.slice(0, 28) : "없음"})`)
    : (r.hits.length ? r.hits.join(", ") : "어디에도 없음");
  const vis = r.visible ? "  ⚠ 화면에 그대로 보임" : "";
  console.log(`  ${ok ? "✓" : "✗"} ${String(r.id).padStart(2)} ${r.title.padEnd(30)} ${note}${vis}`);
  if (!ok || r.visible || r.errors.length) bad.push(r);
}
console.log(`\n정상 ${results.length - bad.length} / ${results.length}`);
for (const r of bad) {
  console.log(`\n  ${r.id} ${r.title}: hits=${JSON.stringify(r.hits)} visible=${r.visible}`);
  if (r.errors.length) console.log(`     오류: ${r.errors.join(" | ")}`);
}
