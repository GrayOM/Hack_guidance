// GENERATED -- do not edit. Run `node scripts/bundle-range.mjs` after changing
// supabase/functions/range/index.ts or supabase/functions/range/sql.ts.
//
// This is the single-file form of hg-range, for pasting into the Supabase dashboard. It is the
// same code as the two files it is built from; a test regenerates it and fails if they differ.

/**
 * A deliberately tiny SQL interpreter, for the injection nodes.
 *
 * The whole point of these nodes is that operator input reaches a query as *structure* rather than
 * as a value. Letting that query reach Postgres would be reproducing the defect for real, against a
 * live database, so nothing here goes near one. The interpreter reads a query string and evaluates
 * it over fixture rows held in memory: `select`, `union`, `where`, `and`/`or`, `=`, `like`, and a
 * scalar subquery. That is enough for an always-true condition, a joined result set and a boolean
 * oracle, and nothing else is implemented -- an unsupported construct is a parse error, not a
 * fallback to something that does more.
 *
 * Every limit below exists because the string being parsed is written by the operator:
 *  - the query is length-capped before it is tokenised,
 *  - the token count is capped, so a long chain of cheap tokens cannot fan out,
 *  - expression recursion is depth-capped, so nested parentheses cannot exhaust the stack,
 *  - `like` is matched by walking the pattern, never by building a RegExp, so no pattern the
 *    operator writes can backtrack catastrophically.
 */

type Row = Record<string, string | number>;
type Tables = Record<string, Row[]>;

const sqlLimits = { query: 512, tokens: 160, depth: 12, rows: 64 };

class SqlError extends Error {}

/* --- tokens ----------------------------------------------------------------------------------- */

type Token = { kind: "word" | "string" | "number" | "punct"; value: string };

function tokenize(query: string): Token[] {
  if (query.length > sqlLimits.query) throw new SqlError("query too long");
  const tokens: Token[] = [];
  let index = 0;
  while (index < query.length) {
    const char = query[index];
    if (/\s/.test(char)) { index += 1; continue; }
    if (char === "'") {
      // A doubled quote is an escaped quote, as in SQL; an unterminated one is an error rather
      // than a string that swallows the rest of the query.
      let value = "";
      index += 1;
      for (;;) {
        if (index >= query.length) throw new SqlError("unterminated string");
        if (query[index] === "'") {
          if (query[index + 1] === "'") { value += "'"; index += 2; continue; }
          index += 1;
          break;
        }
        value += query[index];
        index += 1;
      }
      tokens.push({ kind: "string", value });
    } else if (/[0-9]/.test(char)) {
      let value = "";
      while (index < query.length && /[0-9]/.test(query[index])) { value += query[index]; index += 1; }
      tokens.push({ kind: "number", value });
    } else if (/[A-Za-z_]/.test(char)) {
      let value = "";
      while (index < query.length && /[A-Za-z0-9_]/.test(query[index])) { value += query[index]; index += 1; }
      tokens.push({ kind: "word", value: value.toLowerCase() });
    } else if ("(),*=<>".includes(char)) {
      if (char === "<" && query[index + 1] === ">") { tokens.push({ kind: "punct", value: "<>" }); index += 2; continue; }
      tokens.push({ kind: "punct", value: char });
      index += 1;
    } else {
      throw new SqlError(`unexpected character ${char}`);
    }
    if (tokens.length > sqlLimits.tokens) throw new SqlError("query too complex");
  }
  return tokens;
}

/* --- like ------------------------------------------------------------------------------------- */

/** `%` and `_` only, matched by walking both strings. No RegExp is built from operator input. */
function likeMatch(value: string, pattern: string): boolean {
  const text = value.toLowerCase();
  const glob = pattern.toLowerCase();
  let ti = 0, pi = 0, star = -1, mark = 0;
  while (ti < text.length) {
    if (pi < glob.length && (glob[pi] === "_" || glob[pi] === text[ti])) { ti += 1; pi += 1; }
    else if (pi < glob.length && glob[pi] === "%") { star = pi; mark = ti; pi += 1; }
    else if (star >= 0) { pi = star + 1; mark += 1; ti = mark; }
    else return false;
  }
  while (pi < glob.length && glob[pi] === "%") pi += 1;
  return pi === glob.length;
}

/* --- evaluation ------------------------------------------------------------------------------- */

type Cursor = { tokens: Token[]; at: number; depth: number };

const peek = (cursor: Cursor) => cursor.tokens[cursor.at];
const next = (cursor: Cursor) => cursor.tokens[cursor.at++];
function expect(cursor: Cursor, value: string) {
  const token = next(cursor);
  if (!token || token.value !== value) throw new SqlError(`expected ${value}`);
}
const isWord = (cursor: Cursor, value: string) => peek(cursor)?.kind === "word" && peek(cursor)!.value === value;

type Value = string | number | null;

function compare(left: Value, right: Value) {
  if (left === null || right === null) return false;
  // Loose on purpose: a concatenated query compares a number column against a quoted literal all
  // the time, and refusing that would make the node unsolvable for the wrong reason.
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function evalOr(cursor: Cursor, row: Row, tables: Tables): boolean {
  let value = evalAnd(cursor, row, tables);
  while (isWord(cursor, "or")) { next(cursor); value = evalAnd(cursor, row, tables) || value; }
  return value;
}

function evalAnd(cursor: Cursor, row: Row, tables: Tables): boolean {
  let value = evalNot(cursor, row, tables);
  while (isWord(cursor, "and")) { next(cursor); value = evalNot(cursor, row, tables) && value; }
  return value;
}

function evalNot(cursor: Cursor, row: Row, tables: Tables): boolean {
  if (isWord(cursor, "not")) { next(cursor); return !evalNot(cursor, row, tables); }
  return evalPredicate(cursor, row, tables);
}

function evalPredicate(cursor: Cursor, row: Row, tables: Tables): boolean {
  if (cursor.depth > sqlLimits.depth) throw new SqlError("expression too deep");
  if (peek(cursor)?.value === "(") {
    // A parenthesised group is a nested condition unless it opens a subquery, which is a term.
    const save = cursor.at;
    next(cursor);
    if (isWord(cursor, "select")) { cursor.at = save; return termPredicate(cursor, row, tables); }
    cursor.depth += 1;
    const value = evalOr(cursor, row, tables);
    cursor.depth -= 1;
    expect(cursor, ")");
    return value;
  }
  return termPredicate(cursor, row, tables);
}

function termPredicate(cursor: Cursor, row: Row, tables: Tables): boolean {
  const left = evalTerm(cursor, row, tables);
  const operator = peek(cursor);
  if (operator?.value === "=") { next(cursor); return compare(left, evalTerm(cursor, row, tables)); }
  if (operator?.value === "<>") { next(cursor); return !compare(left, evalTerm(cursor, row, tables)); }
  if (operator?.kind === "word" && operator.value === "like") {
    next(cursor);
    const pattern = evalTerm(cursor, row, tables);
    return left !== null && pattern !== null && likeMatch(String(left), String(pattern));
  }
  if (operator?.kind === "word" && operator.value === "is") {
    next(cursor);
    const negated = isWord(cursor, "not") ? (next(cursor), true) : false;
    expect(cursor, "null");
    return negated ? left !== null : left === null;
  }
  // A bare term is truthy the way `1` is: this is what makes `or 1=1` and `or '1'` both work.
  return left !== null && left !== "" && left !== 0 && String(left) !== "0";
}

function evalTerm(cursor: Cursor, row: Row, tables: Tables): Value {
  if (cursor.depth > sqlLimits.depth) throw new SqlError("expression too deep");
  const token = next(cursor);
  if (!token) throw new SqlError("unexpected end of query");
  if (token.kind === "string") return token.value;
  if (token.kind === "number") return Number(token.value);
  if (token.value === "(") {
    if (isWord(cursor, "select")) {
      // Scalar subquery: the first column of the first row, which is what a boolean oracle reads.
      cursor.depth += 1;
      const rows = parseSelect(cursor, tables);
      cursor.depth -= 1;
      expect(cursor, ")");
      const first = rows[0];
      if (!first) return null;
      return Object.values(first)[0] ?? null;
    }
    cursor.depth += 1;
    const value = evalTerm(cursor, row, tables);
    cursor.depth -= 1;
    expect(cursor, ")");
    return value;
  }
  if (token.kind === "word") {
    if (token.value === "null") return null;
    if (token.value in row) return row[token.value];
    // An unknown bare word is a column that does not exist on this row, which is null, not an
    // error: a union pulls rows whose columns differ from the ones named in the other branch.
    return null;
  }
  throw new SqlError(`unexpected token ${token.value}`);
}

/* --- select ----------------------------------------------------------------------------------- */

function parseSelect(cursor: Cursor, tables: Tables): Row[] {
  expect(cursor, "select");

  // Each selected column is an expression. Its token span is recorded once here and replayed per
  // row below, so the projection walks the query a single time however many rows come back.
  const columns: { label: string; from: number; to: number }[] = [];
  let star = false;
  for (;;) {
    if (peek(cursor)?.value === "*") {
      next(cursor);
      star = true;
    } else {
      const token = peek(cursor);
      if (!token) throw new SqlError("expected a column");
      const from = cursor.at;
      evalTerm(cursor, {}, tables);
      columns.push({ label: token.kind === "word" ? token.value : `col${columns.length + 1}`, from, to: cursor.at });
    }
    if (peek(cursor)?.value !== ",") break;
    next(cursor);
  }

  let source: Row[] = [{}];
  if (isWord(cursor, "from")) {
    next(cursor);
    const name = next(cursor);
    if (!name || name.kind !== "word") throw new SqlError("expected a table name");
    const table = tables[name.value];
    if (!table) throw new SqlError(`no such table: ${name.value}`);
    source = table;
  }

  if (isWord(cursor, "where")) {
    next(cursor);
    const from = cursor.at;
    let to = from;
    source = source.filter(row => {
      const probe: Cursor = { tokens: cursor.tokens, at: from, depth: cursor.depth };
      const keep = evalOr(probe, row, tables);
      to = probe.at;
      return keep;
    });
    // The condition is walked once even when it matched nothing, or the parser would resume in
    // the middle of it and read the rest of the query as garbage.
    if (to === from) {
      const probe: Cursor = { tokens: cursor.tokens, at: from, depth: cursor.depth };
      evalOr(probe, {}, tables);
      to = probe.at;
    }
    cursor.at = to;
  }

  const seen = new Map<string, number>();
  const labels = columns.map(column => {
    const count = (seen.get(column.label) ?? 0) + 1;
    seen.set(column.label, count);
    return count > 1 ? `${column.label}_${count}` : column.label;
  });

  let rows = source.slice(0, sqlLimits.rows).map(row => {
    if (star) return { ...row };
    const out: Row = {};
    columns.forEach((column, index) => {
      const probe: Cursor = { tokens: cursor.tokens, at: column.from, depth: cursor.depth };
      out[labels[index]] = evalTerm(probe, row, tables) ?? "";
    });
    return out;
  });

  if (isWord(cursor, "union")) {
    next(cursor);
    if (isWord(cursor, "all")) next(cursor);
    const more = parseSelect(cursor, tables);
    // The branches have to line up, exactly as a real engine requires. Without this the node that
    // is about matching the column count would be solvable without matching it.
    const width = (list: Row[]) => (list.length ? Object.keys(list[0]).length : star ? -1 : columns.length);
    const left = rows.length ? Object.keys(rows[0]).length : columns.length;
    const right = width(more);
    if (more.length && left !== right) throw new SqlError("each UNION query must have the same number of columns");
    // The combined set keeps the first branch's column names, as a real engine does -- even when
    // that branch matched nothing, which is the usual shape of an injected union.
    const headings = rows[0] ? Object.keys(rows[0]) : star ? [] : labels;
    rows = [...rows, ...more.map(row => {
      const values = Object.values(row);
      const keys = headings.length ? headings : Object.keys(row);
      return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? ""])) as Row;
    })].slice(0, sqlLimits.rows);
  }

  return rows;
}

/** Runs a query against fixture tables. Throws SqlError on anything it does not implement. */
function runSql(query: string, tables: Tables): Row[] {
  const cursor: Cursor = { tokens: tokenize(query), at: 0, depth: 0 };
  const rows = parseSelect(cursor, tables);
  if (cursor.at < cursor.tokens.length) throw new SqlError(`trailing input at ${cursor.tokens[cursor.at].value}`);
  return rows;
}

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
  reflected: "FLAG{the_page_ran_your_words}",
  stored: "FLAG{it_waited_for_the_next_reader}",
  bypass: "FLAG{the_condition_was_yours}",
  union: "FLAG{the_result_set_grew}",
  blind: "FLAG{one_letter_at_a_time}",
};

/* --- Nodes 47-49: the tables the interpreter reads -------------------------------------------
   Fixtures, like everything else here. The query the operator shapes is evaluated by the small
   interpreter in sql.ts against these rows. It never reaches Postgres: the one real table this
   function touches is the operator's own range state, and no operator input is ever part of that
   statement. */
const sqlTables = {
  accounts: [
    { id: 1, user: "you", pass: "hunter2", role: "viewer", name: "현장 요원" },
    { id: 2, user: "r.kang", pass: "spring-2026", role: "viewer", name: "강 책임" },
    { id: 3, user: "admin", pass: "ops-5f2a91c4", role: "admin", name: "관리자" },
  ],
  archive: [
    { id: 1, label: "export key", secret: rangeFlags.union },
    { id: 2, label: "rotation note", secret: "다음 교체 2026-04-01" },
  ],
  // Short on purpose. The blind node is recovered one letter at a time by hand, and a long value
  // would teach nothing the sixth letter had not already taught while costing an hour.
  signals: [{ id: 1, name: "recovery phrase", value: "aurora" }],
};

/* --- Nodes 45-46: what counts as "it executed" ------------------------------------------------
   The operator's input is put into the page without escaping, and the server then reads its own
   output back to decide whether that input became part of the document rather than text in it.
   This is the judgement a scanner makes, and it keeps the trace on the server: the browser is
   handed the page, never the answer. */
const executes = (html: string) =>
  /<\s*script[\s>]/i.test(html)
  || /<\s*(img|svg|body|iframe|video|audio|details|input|object|embed)\b[^>]*\son[a-z]+\s*=/i.test(html)
  || /<\s*a\b[^>]*\shref\s*=\s*["']?\s*javascript:/i.test(html);

const searchPage = (term: string) => [
  '<!doctype html><meta charset="utf-8">',
  "<style>body{font:13px/1.7 system-ui;background:#06121a;color:#9dc4c8;margin:0;padding:16px}em{color:#8affd2;font-style:normal}</style>",
  "<h3>검색 결과</h3>",
  `<p>검색어: <em>${term}</em></p>`,
  "<p>일치하는 품목이 없습니다.</p>",
].join("");

const boardPage = (note: string) => [
  '<!doctype html><meta charset="utf-8">',
  "<style>body{font:13px/1.7 system-ui;background:#06121a;color:#9dc4c8;margin:0;padding:16px}li{margin:6px 0}</style>",
  "<h3>운영 게시판</h3><ul>",
  "<li>점검 안내: 매주 화요일 02:00</li>",
  `<li>${note || "(아직 남긴 메모가 없습니다)"}</li>`,
  "</ul>",
].join("");

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

  /* --- Node 45: reflected --------------------------------------------------------------------- */
  if (mode === "search") {
    const term = bounded(url.searchParams.get("q") ?? payload.q as string);
    const html = searchPage(term);
    // Not escaped on the way in, which is the defect; read back on the way out to decide whether
    // the input stopped being text. The page goes to the browser, the verdict stays here.
    return json({ status: "ok", term, html, executed: executes(html), ...(executes(html) ? { trace: rangeFlags.reflected } : {}) });
  }

  /* --- Node 46: stored ------------------------------------------------------------------------ */
  if (mode === "note") {
    const note = bounded(payload.note as string);
    const { error } = await service().from("hg_range_state").upsert({ user_id: user.id, stored_note: note });
    if (error) return json({ status: "error", message: "range state unavailable" }, { status: 503 });
    // Saving says nothing about whether it runs. The difference between this node and the one
    // before it is that nobody has to be handed a link, so the verdict belongs to the read.
    return json({ status: "saved", note, length: note.length });
  }

  if (mode === "board") {
    const { data } = await service().from("hg_range_state").select("stored_note").eq("user_id", user.id).maybeSingle();
    const note = typeof data?.stored_note === "string" ? data.stored_note : "";
    const html = boardPage(note);
    return json({ status: "ok", html, executed: executes(html), ...(executes(html) ? { trace: rangeFlags.stored } : {}) });
  }

  /* --- Nodes 47-49: the query the operator shapes --------------------------------------------- */
  if (mode === "login" || mode === "lookup" || mode === "probe") {
    const query = mode === "login"
      ? `select id, user, role from accounts where user = '${bounded(payload.user as string)}' and pass = '${bounded(payload.pass as string)}'`
      : mode === "lookup"
        ? `select name, role from accounts where id = ${bounded(url.searchParams.get("id") ?? payload.id as string) || "0"}`
        : `select id from accounts where user = '${bounded(url.searchParams.get("user") ?? payload.user as string)}'`;
    if (query.length > sqlLimits.query) return json({ status: "invalid", query, message: "query too long" }, { status: 400 });

    let rows;
    try {
      rows = runSql(query, sqlTables);
    } catch (error) {
      // The engine's own complaint, shown as it is. A query that will not parse is the most
      // ordinary thing that happens while shaping one, and hiding why teaches nothing.
      const message = error instanceof SqlError ? error.message : "query failed";
      return json({ status: "error", query, message }, { status: 400 });
    }

    if (mode === "login") {
      const admin = rows.find(row => String(row.role) === "admin");
      // Signing in as the administrator without their password is the whole of the node. Supplying
      // it is simply signing in, and gets no trace.
      const knewTheSecret = bounded(payload.pass as string) === "ops-5f2a91c4";
      return json({
        status: rows.length ? "signed_in" : "rejected", query, rows,
        ...(admin && !knewTheSecret ? { as: admin.user, trace: rangeFlags.bypass } : admin ? { as: admin.user } : {}),
      });
    }

    if (mode === "lookup") {
      // The trace is in a row only the extended result set can carry, so it appears exactly when
      // the operator has widened the query, and never from the account table alone.
      const widened = rows.some(row => Object.values(row).some(value => String(value).includes(rangeFlags.union)));
      return json({ status: "ok", query, rows, ...(widened ? { trace: rangeFlags.union } : {}) });
    }

    // probe: an oracle and nothing more. It says whether anything matched and never what, so the
    // only way to a value it will not print is to ask about it a letter at a time.
    //
    // The trace is not handed out for a true answer -- that would make one lucky guess the whole
    // node. It is handed out for stating the recovered value, which is what having extracted it
    // actually means, and is how the technique pays off in the field: you leave with a credential.
    const answer = bounded(url.searchParams.get("answer") ?? payload.answer as string).trim().toLowerCase();
    if (answer) {
      return answer === "aurora"
        ? json({ status: "confirmed", answer, trace: rangeFlags.blind })
        : json({ status: "rejected", answer, message: "복구 문구가 일치하지 않습니다." });
    }
    return json({ status: "ok", found: rows.length > 0 });
  }

  return json({ error: "Unknown range endpoint" }, { status: 404 });
});
