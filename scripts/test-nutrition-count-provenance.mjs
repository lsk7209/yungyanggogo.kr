// Execute the real adapters against an in-memory SQLite database and mocked fetch.
// Neither the production DB module nor a real network request is loaded.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const db = createClient({ url: "file::memory:" });
let missingAggregate = false;
globalThis.__nutritionCountTestDb = {
  batch: (...args) => db.batch(...args),
  execute: async (...args) => {
    const result = await db.execute(...args);
    if (missingAggregate && String(args[0]?.sql).includes("COUNT(DISTINCT")) {
      return { ...result, rows: result.rows.map((row) => ({ ...row, total_count: null })) };
    }
    return result;
  },
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@libsql/client" && context.parentURL?.includes("/scripts/sync-national-nutrition.mjs")) {
      return { url: "data:text/javascript,export function createClient(){return globalThis.__nutritionCountTestDb}", shortCircuit: true };
    }
    if (specifier === "./db" && context.parentURL?.endsWith("/lib/national-nutrition-db.ts")) {
      return { url: "data:text/javascript,export const isTursoConfigured=true;export function getDb(){return globalThis.__nutritionCountTestDb}", shortCircuit: true };
    }
    if (specifier.endsWith("/lib/db") && context.parentURL?.endsWith("/app/api/nutrition-data/route.ts")) {
      return { url: "data:text/javascript,export const isTursoConfigured=true;", shortCircuit: true };
    }
    if (specifier === "next/cache") return { url: "data:text/javascript,export const unstable_cache=(fn)=>fn;", shortCircuit: true };
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.tsx?$/.test(url)) {
      return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

let assertions = 0;
function equal(actual, expected, message) { assert.deepEqual(actual, expected, message); assertions += 1; }
function matches(actual, pattern, message) { assert.match(actual, pattern, message); assertions += 1; }
const originalFetch = globalThis.fetch;
const previousKey = process.env.DATA_GO_KR_NUTRITION_KEY;
process.env.DATA_GO_KR_NUTRITION_KEY = "synthetic-count-test-key";
let payload;
let requestCount = 0;
globalThis.fetch = async () => {
  requestCount += 1;
  assert.ok(payload, "unplanned upstream request is blocked");
  return new Response(JSON.stringify(payload), { status: 200 });
};
const envelope = (totalCount, rows = []) => ({ response: {
  header: { resultCode: "00" },
  body: { ...(totalCount === undefined ? {} : { totalCount }), items: { item: rows } },
} });

try {
  const api = await import("../lib/national-nutrition-api.ts");
  const cache = await import("../lib/national-nutrition-db.ts");
  const { NutritionCountSummary } = await import("../components/NutritionCountSummary.tsx");
  const { GET } = await import("../app/api/nutrition-data/route.ts");
  for (const value of [0, "0", 5000, "5000", undefined, "invalid", -1]) {
    payload = envelope(value);
    const result = await api.fetchNationalNutritionItems();
    equal(result.ok, true, "successful empty response is still success");
    equal(result.totalCount, [undefined, "invalid", -1].includes(value) ? null : Number(value), "only reported valid count is known");
    equal(result.countScope, "source", "API count origin remains source even when unknown");
    equal(result.count, 0, "visible page count is independent");
    matches(result.countCheckedAt, /^\d{4}-\d{2}-\d{2}T/, "observation timestamp");
  }
  payload = envelope(undefined, [{ foodCd: "API-1", foodNm: "fixture" }]);
  const unknown = await api.fetchNationalNutritionItems({ pageNo: 2 });
  equal(unknown.totalCount, null, "one row on page two is not a total");
  equal(unknown.count, 1, "page size remains available");
  const renderedUnknown = renderToStaticMarkup(createElement(NutritionCountSummary, { result: unknown }));
  matches(renderedUnknown, /전체 건수 미확인/, "unknown UI");
  matches(renderedUnknown, /캐시된 자료/, "response freshness caveat");

  await cache.ensureNationalNutritionSchema();
  const foods = Array.from({ length: 52 }, (_, i) => api.normalizeNationalNutritionItem({
    foodCd: `COUNT-${String(i + 1).padStart(3, "0")}`, foodNm: `검증 식품 ${i + 1}`,
    nutConSrtrQua: "100g", enerc: "100", dataCrtrYmd: "2020-01-01",
  }));
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: 5000, foods });
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", query: "old-query", totalCount: 5000, foods: [foods[0]] });
  await db.execute("UPDATE national_nutrition_items SET synced_at = '2026-01-02 03:04:05'");
  const beforeDbRead = requestCount;
  const stored = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", numOfRows: 50 });
  equal(requestCount, beforeDbRead, "stored records do not need a network call");
  equal(stored.totalCount, 52, "distinct stored IDs, not source 5000 or page length 50");
  equal(stored.count, 50, "visible page size");
  equal(stored.countScope, "stored", "stored scope");
  equal(stored.latestStoredAt, "2026-01-02T03:04:05.000Z", "storage timestamp is SQLite UTC");
  assert.notEqual(stored.countCheckedAt, stored.latestStoredAt); assertions += 1;
  const rendered = renderToStaticMarkup(createElement(NutritionCountSummary, { result: stored }));
  matches(rendered, /저장 자료 전체 52건/, "public total is stored scope");
  matches(rendered, /원천 전체 수집을 뜻하지 않습니다/, "partial cache caveat");
  matches(rendered, /원자료 갱신일이 아닙니다/, "does not relabel storage as source update");
  const second = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", pageNo: 2, numOfRows: 50 });
  equal(second.count, 2, "page two");
  equal(second.totalCount, 52, "page-two count remains dataset scope");
  const search = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", query: "식품 52" });
  equal(search.totalCount, 1, "matching stored records");
  matches(renderToStaticMarkup(createElement(NutritionCountSummary, { result: search, filtered: true })), /저장 자료 중 검색 일치 1건/, "search label");
  equal((await cache.readNationalNutritionItemsFromDb({ dataset: "all", query: "no match" })).totalCount, 0, "SQL valid zero preserved");

  const json = await (await GET(new Request("http://fixture.test/api/nutrition-data?dataset=all"))).json();
  equal(json.totalCount, 52, "public JSON count");
  equal(json.countScope, "stored", "public JSON provenance");
  equal(json.latestStoredAt, stored.latestStoredAt, "public JSON storage time");
  matches(json.countCheckedAt, /^\d{4}-/, "public JSON observation time");

  missingAggregate = true;
  const missing = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", numOfRows: 4 });
  equal(missing.totalCount, null, "invalid aggregate not replaced with four visible rows");
  equal(missing.count, 4, "available rows survive missing total");
  await assert.rejects(cache.countNationalNutritionSitemapItems("all"), /count is unavailable/); assertions += 1;
  missingAggregate = false;
  equal(await cache.countNationalNutritionSitemapItems("all"), 52, "sitemap still counts distinct stored records");

  await cache.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: null, foods: [foods[0]] });
  equal(Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_items WHERE dataset_slug='food'")).rows[0].n), 1, "unknown source count still saves rows");
  equal(Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_syncs WHERE dataset_slug='food'")).rows[0].n), 0, "unknown source count is not persisted as zero or row length");
  payload = envelope(0);
  const zeroResponse = await GET(new Request("http://fixture.test/api/nutrition-data?dataset=health"));
  const zero = await zeroResponse.json();
  equal(zeroResponse.status, 200, "successful zero HTTP status");
  equal(zero.totalCount, 0, "successful zero API contract");
  matches(renderToStaticMarkup(createElement(NutritionCountSummary, { result: zero })), /원천 응답 기준 전체 0건/, "zero renders as source 0");
  payload = envelope(undefined);
  equal((await (await GET(new Request("http://fixture.test/api/nutrition-data?dataset=health"))).json()).totalCount, null, "unknown API total");
  payload = { response: { header: { resultCode: "30", resultMsg: "synthetic failure" } } };
  const failureResponse = await GET(new Request("http://fixture.test/api/nutrition-data?dataset=health"));
  const failure = await failureResponse.json();
  equal(failureResponse.status, 502, "upstream error remains failure");
  equal(failure.totalCount, null, "failure is not zero");
  equal(failure.countScope, "unknown", "failure count scope");
  equal(failure.countCheckedAt, null, "failure has no confirmed-count timestamp");
  const aggregate = await (await GET(new Request("http://fixture.test/api/nutrition-data"))).json();
  equal(aggregate.datasets.find((row) => row.dataset.slug === "all").countScope, "stored", "multi-dataset scope");
  equal(aggregate.datasets.find((row) => row.dataset.slug === "health").ok, false, "multi-dataset individual failure is explicit");

  // Exercise the actual sync CLI only with the intercepted client and fetch.
  const syncEnvironment = { TURSO_DATABASE_URL: "file:synthetic-only", TURSO_AUTH_TOKEN: "synthetic-only", NUTRITION_SYNC_PAGES: "1", NUTRITION_SYNC_ROWS: "2" };
  const previousEnvironment = Object.fromEntries(Object.keys(syncEnvironment).map(key => [key, process.env[key]]));
  const log = console.log;
  try {
    Object.assign(process.env, syncEnvironment);
    await db.execute("DELETE FROM national_nutrition_syncs");
    const summaries = [];
    console.log = value => summaries.push(JSON.parse(value));
    payload = envelope(undefined, [{ foodCd: "SYNC-UNKNOWN", foodNm: "sync fixture" }]);
    await import("./sync-national-nutrition.mjs?unknown-count-fixture");
    equal(summaries[0].summary.every(row => row.totalCount === null && row.saved === 1), true, "sync summary retains unknown despite saved rows");
    equal(Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_syncs")).rows[0].n), 0, "sync never writes row length as source total");
    equal(Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_items WHERE food_code='SYNC-UNKNOWN'")).rows[0].n), 5, "sync still stores all five dataset rows");
    payload = envelope(0);
    await import("./sync-national-nutrition.mjs?zero-count-fixture");
    equal(summaries[1].summary.every(row => row.totalCount === 0 && row.saved === 0), true, "sync summary preserves known zero");
    payload = envelope(5000, [{ foodCd: "SYNC-KNOWN", foodNm: "known fixture" }]);
    await import("./sync-national-nutrition.mjs?known-count-fixture");
    equal(summaries[2].summary.every(row => row.totalCount === 5000 && row.saved === 1), true, "sync source total separate from saved count");
    equal(Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_syncs WHERE total_count=5000")).rows[0].n), 5, "sync known source metadata retained");
  } finally {
    console.log = log;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  console.log(`nutrition count provenance integration: ${assertions} assertions passed; SQLite memory + mocked fetch only`);
} finally {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.DATA_GO_KR_NUTRITION_KEY;
  else process.env.DATA_GO_KR_NUTRITION_KEY = previousKey;
  delete globalThis.__nutritionCountTestDb;
  hooks.deregister();
  db.close();
}
