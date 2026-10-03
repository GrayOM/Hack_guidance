import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * The practice range: a mock application that is wrong on purpose.
 *
 * Everything it serves is fixture data held in this file. It never queries an application table,
 * never touches a filesystem, and never makes an outbound request, so a technique practised here
 * cannot reach anything real. The one piece of state it keeps is a per-operator counter for the
 * race node, in a table of its own with row level security.
 *
 * The token it issues is signed with a key that exists only for this range. Forging one grants
 * nothing anywhere else: the platform's own session is a separate Supabase JWT this function never
 * mints and never accepts as a range token.
 */

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "https://grayom.github.io,http://localhost:5173,http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

function corsHeadersFor(request: Request) {
  const origin = request.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-range-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

// An endpoint that accepts arbitrary input is a denial-of-service surface before it is anything
// else, so every field is bounded before it is looked at.
const maxField = 256;
const bounded = (value: unknown) => (typeof value === "string" ? value.slice(0, maxField) : "");

const rangeFlags = {
  order: "FLAG{the_id_was_the_only_check}",
  token: "FLAG{the_token_said_so}",
  path: "FLAG{it_walked_out_of_the_folder}",
  race: "FLAG{both_passed_the_check}",
  total: "FLAG{the_total_went_the_wrong_way}",
};

/* --- Node 40: ownership is never checked ----------------------------------------------------- */
const orders: Record<string, Record<string, unknown>> = {
  "1041": { id: 1041, customer: "you", item: "범용 어댑터", total: 18000, note: "본인 주문" },
  "1042": { id: 1042, customer: "r.kang", item: "보관함 열쇠 사본", total: 240000, note: rangeFlags.order },
  "1043": { id: 1043, customer: "s.min", item: "출입증 재발급", total: 32000, note: "타인 주문" },
};

/* --- Node 42: the name is joined onto a path that is never normalised -------------------------
   The operator cannot guess a filename, so the public folder leaks the layout a step at a time:
   the manual lists its own folder, and the notice names a file in the folder beside it. That is
   how the finding actually turns up in the field -- a public document describing the private one
   -- and it leaves the operator with the part that matters still to work out. */
const documents: Record<string, string> = {
  "public/manual.txt": [
    "열람 안내",
    "이 기능은 public/ 폴더의 문서만 제공합니다.",
    "현재 목록: manual.txt, notice.txt",
  ].join("\n"),
  "public/notice.txt": [
    "운영 공지",
    "정기 점검: 매주 화요일 02:00",
    "보관 자격 증명은 private/credentials.txt 에서 관리합니다. (최근 갱신 2026-01-14)",
    "해당 경로는 열람 기능에서 제공하지 않습니다.",
  ].join("\n"),
  "private/credentials.txt": `archive export key: ${rangeFlags.path}`,
};

/* --- Node 41: the token says what it should be checked with ----------------------------------- */
const encoder = new TextEncoder();
const rangeKey = Deno.env.get("RANGE_TOKEN_SECRET") ?? "range-only-practice-key";
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlText = (text: string) => b64url(encoder.encode(text));
const fromB64url = (part: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)));

async function signRange(data: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(rangeKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data))));
}

async function issueRangeToken() {
  const body = `${b64urlText(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64urlText(JSON.stringify({ sub: "op-0041", role: "viewer" }))}`;
  return `${body}.${await signRange(body)}`;
}

/**
 * Accepts the algorithm the token declares, which is the defect the node is about. A real verifier
 * fixes the algorithm on the server and ignores what the token says.
 */
async function readRangeToken(token: string) {
  const [head, claims, signature] = token.split(".");
  if (!head || !claims) return null;
  let header: { alg?: string };
  let payload: Record<string, unknown>;
  try {
    header = JSON.parse(fromB64url(head));
    payload = JSON.parse(fromB64url(claims));
  } catch {
    return null;
  }
  if ((header.alg ?? "").toLowerCase() === "none") return payload;
  if (signature && signature === await signRange(`${head}.${claims}`)) return payload;
  return null;
}

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

Deno.serve(async request => {
  const url = new URL(request.url);
  const corsHeaders = corsHeadersFor(request);
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), { ...init, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", ...(init.headers ?? {}) } });
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Every mode requires a platform session, including the ones that keep no state. An operator
  // reaching the range is signed in already, and tying each request to an account is what keeps an
  // open endpoint from being anyone's free compute. It also separates the two credentials the
  // operator is about to learn to tell apart: this session is not the range token below.
  const user = await requireUser(request);
  if (!user) return json({ status: "unauthorized", message: "platform session required" }, { status: 401 });

  const mode = url.searchParams.get("mode");
  const payload = request.method === "POST" ? await request.json().catch(() => ({})) as Record<string, unknown> : {};
  const service = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (mode === "order") {
    // No ownership check at all: the identifier is the whole of it.
    const order = orders[bounded(url.searchParams.get("id") ?? payload.id as string)];
    return order ? json({ status: "ok", order }) : json({ status: "not_found" }, { status: 404 });
  }

  if (mode === "issue") return json({ status: "issued", token: await issueRangeToken(), note: "role: viewer" });

  if (mode === "vault") {
    const claims = await readRangeToken(bounded(request.headers.get("x-range-token") ?? ""));
    if (!claims) return json({ status: "unauthorized", message: "range token required" }, { status: 401 });
    if (claims.role !== "operator") return json({ status: "forbidden", role: claims.role, message: "operator role required" }, { status: 403 });
    return json({ status: "ok", trace: rangeFlags.token });
  }

  if (mode === "doc") {
    // The name is joined and never normalised, so it can walk out of the public folder. The store
    // is this map: there is no filesystem behind it.
    const name = bounded(url.searchParams.get("name") ?? "");
    const body = documents[`public/${name}`.replace(/public\/\.\.\//g, "")];
    return body ? json({ status: "ok", name, body }) : json({ status: "not_found", name }, { status: 404 });
  }

  if (mode === "coupon") {
    const client = service();
    // The defect is here: the one-time check reads the counter, the request then does other work,
    // and only afterwards is the coupon applied. Two requests that arrive together both read 0 and
    // both pass. A correct implementation settles check and apply in one statement.
    const { data: before } = await client.from("hg_range_state").select("coupon_applied").eq("user_id", user.id).maybeSingle();
    if ((before?.coupon_applied ?? 0) >= 1) return json({ status: "already_applied", applied: before?.coupon_applied ?? 0 });
    await new Promise(resolve => setTimeout(resolve, 150));
    // The apply itself is atomic, which is what makes the double-apply visible rather than silently
    // lost: the second request to land is told it is the second.
    const { data: applied, error } = await client.rpc("hg_range_apply_coupon", { p_user_id: user.id });
    if (error) return json({ status: "error", message: "range state unavailable" }, { status: 503 });
    const count = Number(applied ?? 1);
    const discount = 3000 * count;
    return count >= 2
      ? json({ status: "applied", applied: count, discount, note: "일회용 쿠폰이 두 번 적용됨", trace: rangeFlags.race })
      : json({ status: "applied", applied: count, discount });
  }

  if (mode === "reset") {
    await service().from("hg_range_state").upsert({ user_id: user.id, coupon_applied: 0 });
    return json({ status: "reset" });
  }

  if (mode === "checkout") {
    // The quantity is read as a number and nothing more is asked of it.
    const unit = 12000;
    const credit = 50000;
    const quantity = Number(payload.quantity ?? url.searchParams.get("quantity") ?? 1);
    if (!Number.isFinite(quantity) || Math.abs(quantity) > 1_000_000) return json({ status: "invalid", message: "quantity out of range" }, { status: 400 });
    const total = unit * quantity;
    const balance = credit - total;
    return total < 0
      ? json({ status: "ok", quantity, unit, total, balance, note: "결제 후 잔액이 늘어남", trace: rangeFlags.total })
      : json({ status: "ok", quantity, unit, total, balance });
  }

  return json({ error: "Unknown range endpoint" }, { status: 404 });
});
