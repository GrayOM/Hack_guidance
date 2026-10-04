/**
 * Flattens the two-file hg-range function into one file for the dashboard.
 *
 * The function is deployed by pasting it into the Supabase dashboard. `sql.ts` is a separate file
 * because the interpreter is the riskiest code in the project and deserves to be imported and run
 * by the test suite directly -- but a deploy that pastes one of two files leaves every injection
 * node returning 500, which is a confusing failure to debug from the dashboard. This writes the
 * combined file so there is always a one-paste path, and a test regenerates it and compares, so
 * the copy cannot drift away from the sources.
 *
 *   node scripts/bundle-range.mjs          writes the bundle
 *   node scripts/bundle-range.mjs --check  exits non-zero if the committed bundle is stale
 */
import { readFileSync, writeFileSync } from "node:fs";

const read = name => readFileSync(new URL(`../supabase/functions/range/${name}`, import.meta.url), "utf8");
export const bundlePath = new URL("../supabase/deploy/hg-range.ts", import.meta.url);

export function buildBundle() {
  const sql = read("sql.ts").replace(/^export /gm, "");
  const index = read("index.ts").replace(/^import \{[^}]*\} from "\.\/sql\.ts";\n/m, "");
  return [
    "// GENERATED -- do not edit. Run `node scripts/bundle-range.mjs` after changing",
    "// supabase/functions/range/index.ts or supabase/functions/range/sql.ts.",
    "//",
    "// This is the single-file form of hg-range, for pasting into the Supabase dashboard. It is the",
    "// same code as the two files it is built from; a test regenerates it and fails if they differ.",
    "",
    sql.trimEnd(),
    "",
    index.trimStart(),
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const built = buildBundle();
  if (process.argv.includes("--check")) {
    const current = readFileSync(bundlePath, "utf8");
    if (current !== built) { console.error("supabase/deploy/hg-range.ts is stale"); process.exit(1); }
    console.log("bundle is current");
  } else {
    writeFileSync(bundlePath, built);
    console.log(`wrote ${bundlePath.pathname} (${built.length} bytes)`);
  }
}
