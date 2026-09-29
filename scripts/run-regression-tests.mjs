// Explicit allow-list regression runner. Each test runs in its own Node process;
// any failure makes the whole run fail. Nothing here deploys, submits to search
// consoles, syncs production data or changes content approval.
// The HTTP contract test needs a production build and runs via `npm run test:http`.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const REGRESSION_TESTS = [
  "test-ad-policy.mjs",
  "test-affiliate-ad-boundary.mjs",
  "test-blog-pagination-boundary.mjs",
  "test-blog-trust-boundary.mjs",
  "test-canonical-metadata-boundary.mjs",
  "test-comparison-selection.mjs",
  "test-editorial-blocks.mjs",
  // The next three regenerate docs/quality reports deterministically (local files only).
  "test-editorial-contract-risk-priority.mjs",
  "test-editorial-corpus-map.mjs",
  "test-editorial-five-candidate-checkpoint.mjs",
  "test-editorial-generation-boundary.mjs",
  "test-editorial-persona-writer-gates.mjs",
  "test-editorial-promotion-boundary.mjs",
  "test-editorial-public-output.mjs",
  "test-example-boundary.mjs",
  "test-fetch-retry-boundary.mjs",
  "test-followup-state-contract.mjs",
  "test-national-nutrition-db-count.mjs",
  "test-national-nutrition-parser.mjs",
  "test-nutrition-cache-identity.mjs",
  "test-nutrition-comparison.mjs",
  "test-nutrition-count-provenance.mjs",
  "test-nutrition-db-search-boundary.mjs",
  "test-nutrition-failure-integrity.mjs",
  "test-nutrition-provider-boundary.mjs",
  "test-nutrition-query.mjs",
  "test-nutrition-sync-parser-boundary.mjs",
  "test-public-quality-boundary.mjs",
  "test-query-index-policy.mjs",
  "test-remaining-acceptance-boundary.mjs",
  "test-runtime-script-boundary.mjs",
  "test-sitemap-sharding-boundary.mjs",
  "test-thumbnail-origin-boundary.mjs",
];
// Tests intentionally outside this runner, with the reason.
const EXCLUDED = { "test-http-contract.mjs": "needs a production build; run `npm run test:http`" };

// A new test file must be classified, so it can never be silently skipped.
const discovered = readdirSync(path.join(root, "scripts")).filter((f) => /^test-.*\.mjs$/.test(f));
const unclassified = discovered.filter((f) => !REGRESSION_TESTS.includes(f) && !(f in EXCLUDED));
const missing = REGRESSION_TESTS.filter((f) => !discovered.includes(f));
if (unclassified.length || missing.length) {
  console.error(`regression runner: unclassified=${JSON.stringify(unclassified)} missing=${JSON.stringify(missing)}`);
  process.exit(2);
}

const only = process.argv.slice(2);
const selected = only.length ? REGRESSION_TESTS.filter((f) => only.includes(f)) : REGRESSION_TESTS;
// Never let a test reach real providers, even if the shell has credentials.
const safeEnv = { ...process.env };
for (const key of Object.keys(safeEnv)) {
  if (/^(TURSO_|DATA_GO_KR_|PUBLIC_DATA_SERVICE_KEY|FOOD_|FOODSAFETY|MFDS_|HEALTH_FUNCTIONAL_FOOD_|GSC_|VERCEL_)/.test(key)) delete safeEnv[key];
}

const results = [];
for (const file of selected) {
  const started = Date.now();
  const run = spawnSync(process.execPath, [path.join("scripts", file)], { cwd: root, env: safeEnv, encoding: "utf8" });
  const passed = run.status === 0;
  const summary = (run.stdout || "").trim().split("\n").filter(Boolean).at(-1) ?? "";
  results.push({ file, passed, ms: Date.now() - started });
  console.log(`${passed ? "PASS" : "FAIL"} ${file} (${Date.now() - started}ms) ${summary}`);
  if (!passed) console.log((run.stderr || run.stdout || "").trim().split("\n").slice(-15).join("\n"));
}
const failed = results.filter((r) => !r.passed);
console.log(`\nregression: ${results.length - failed.length}/${results.length} passed${failed.length ? `; FAILED: ${failed.map((r) => r.file).join(", ")}` : ""}`);
process.exit(failed.length ? 1 : 0);
