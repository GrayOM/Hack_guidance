import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { likeMatch, runSql, SqlError, sqlLimits, tokenize } from "../supabase/functions/range/sql";

const interpreter = readFileSync(new URL("../supabase/functions/range/sql.ts", import.meta.url), "utf8");
const rangeFunction = readFileSync(new URL("../supabase/functions/range/index.ts", import.meta.url), "utf8");

const tables = {
  accounts: [
    { id: 1, user: "you", pass: "hunter2", role: "viewer", name: "현장 요원" },
    { id: 3, user: "admin", pass: "ops-5f2a91c4", role: "admin", name: "관리자" },
  ],
  archive: [{ id: 1, label: "export key", secret: "FLAG{the_result_set_grew}" }],
  signals: [{ id: 1, name: "recovery phrase", value: "aurora" }],
};
const run = (query: string) => runSql(query, tables);
const fails = (query: string) => expect(() => run(query)).toThrow(SqlError);

describe("the injection nodes' SQL interpreter", () => {
  it("never lets operator input reach a real database", () => {
    // This is the reason the interpreter exists. Running the concatenated query the nodes build
    // would be reproducing the defect for real, against a live database.
    expect(interpreter).not.toMatch(/createClient|supabase|\.rpc\(|\.from\(/);
    // The statements this function does send are fixed, and none of them interpolates input.
    const realStatements = [...rangeFunction.matchAll(/\.(from|rpc)\("([a-z_]+)"\)?/g)].map(match => match[2]);
    expect(new Set(realStatements)).toEqual(new Set(["hg_range_state", "hg_range_apply_coupon"]));
    expect(rangeFunction).not.toMatch(/\.(from|rpc)\(`/);
    // The query the operator shapes goes to the interpreter and nowhere else.
    expect(rangeFunction).toContain("runSql(query, sqlTables)");
  });

  it("reads the fixture tables the ordinary way", () => {
    expect(run("select name, role from accounts where id = 1")).toEqual([{ name: "현장 요원", role: "viewer" }]);
    expect(run("select * from accounts where user = 'you' and pass = 'hunter2'")).toHaveLength(1);
    expect(run("select * from accounts where user = 'admin' and pass = 'wrong'")).toEqual([]);
  });

  it("lets a condition the operator writes decide the result, which is node 47", () => {
    // The classic, and the shape a concatenated login query actually takes.
    const bypass = run("select id, user, role from accounts where user = 'admin' and pass = '' or '1'='1'");
    expect(bypass.map(row => row.role)).toContain("admin");
    // and binds tighter than or, as in SQL -- otherwise half the payloads that should fail pass.
    expect(run("select * from accounts where user = '' or 1=1 and '' = '' and pass = 'x'")).toEqual([]);
  });

  it("extends a result set only when the branches line up, which is node 48", () => {
    const widened = run("select name, role from accounts where id = 0 union select label, secret from archive");
    expect(widened).toEqual([{ name: "export key", role: "FLAG{the_result_set_grew}" }]);
    // The node is about matching the column count, so a mismatch has to be refused or there is
    // nothing to work out.
    fails("select name, role from accounts where id = 0 union select secret from archive");
    // The combined set keeps the first branch's column names, as a real engine does.
    expect(Object.keys(widened[0])).toEqual(["name", "role"]);
  });

  it("answers a subquery with true or false and never with the value, which is node 49", () => {
    const probe = (pattern: string) =>
      run(`select id from accounts where user = '' or (select value from signals) like '${pattern}'`).length > 0;
    expect(probe("a%")).toBe(true);
    expect(probe("z%")).toBe(true === false);
    expect(probe("auror%")).toBe(true);
    expect(probe("aurora")).toBe(true);
    expect(probe("aurorb")).toBe(false);
    // Recovering the value a letter at a time is the technique, so it has to actually terminate.
    let recovered = "";
    for (let step = 0; step < 12; step += 1) {
      const letter = "abcdefghijklmnopqrstuvwxyz".split("").find(candidate => probe(`${recovered}${candidate}%`));
      if (!letter) break;
      recovered += letter;
    }
    expect(recovered).toBe("aurora");
  });

  it("implements nothing beyond what those three nodes need", () => {
    // An interpreter that quietly does more than the nodes require is a larger surface for no
    // teaching value. Anything unimplemented is an error, never a silent fallback.
    for (const query of [
      "drop table accounts",
      "insert into archive values (1, 'x', 'y')",
      "update accounts set role = 'admin'",
      "delete from accounts",
      "select * from accounts; drop table archive",
      "select * from pg_catalog.pg_tables",
      "select * from secrets",
    ]) fails(query);
  });

  it("bounds every input the operator controls", () => {
    fails(`select * from accounts where user = '${"a".repeat(sqlLimits.query)}'`);
    fails(`select ${"(".repeat(sqlLimits.depth + 4)}1${")".repeat(sqlLimits.depth + 4)}`);
    fails("select * from accounts where user = 'unterminated");
    expect(() => tokenize("select 1 " + "+ ".repeat(400))).toThrow(SqlError);
    // At most this many rows come back however the query is shaped, so neither a wide table nor a
    // union chain can make the function build an unbounded response.
    const wide = { big: Array.from({ length: 400 }, (_, index) => ({ id: index })) };
    expect(runSql("select id from big", wide).length).toBe(sqlLimits.rows);
    expect(runSql("select id from big union select id from big", wide).length).toBe(sqlLimits.rows);
  });

  it("matches LIKE by walking the pattern, so no operator pattern can hang the function", () => {
    // Compiling the pattern into a RegExp would hand the operator a backtracking bomb. The
    // pathological case below is the one that would hang a naive translation.
    expect(interpreter).not.toMatch(/new RegExp|RegExp\(/);
    expect(likeMatch("FLAG{abc}", "FLAG{a%")).toBe(true);
    expect(likeMatch("abc", "a_c")).toBe(true);
    expect(likeMatch("abc", "a_")).toBe(false);
    expect(likeMatch("ABC", "abc")).toBe(true);
    const started = Date.now();
    expect(likeMatch("a".repeat(600), `${"%".repeat(60)}b`)).toBe(false);
    expect(Date.now() - started).toBeLessThan(200);
  });
});
