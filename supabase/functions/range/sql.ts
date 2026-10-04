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

export type Row = Record<string, string | number>;
export type Tables = Record<string, Row[]>;

export const sqlLimits = { query: 512, tokens: 160, depth: 12, rows: 64 };

export class SqlError extends Error {}

/* --- tokens ----------------------------------------------------------------------------------- */

type Token = { kind: "word" | "string" | "number" | "punct"; value: string };

export function tokenize(query: string): Token[] {
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
export function likeMatch(value: string, pattern: string): boolean {
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
export function runSql(query: string, tables: Tables): Row[] {
  const cursor: Cursor = { tokens: tokenize(query), at: 0, depth: 0 };
  const rows = parseSelect(cursor, tables);
  if (cursor.at < cursor.tokens.length) throw new SqlError(`trailing input at ${cursor.tokens[cursor.at].value}`);
  return rows;
}
