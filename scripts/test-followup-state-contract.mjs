// 2026-09-28 follow-up behavioural contract (R01–R32 subset).
// Executes the real DB adapter, pages and API route against an in-memory SQLite
// database and a mocked fetch. No production DB module or network is loaded.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const db = createClient({ url: "file::memory:" });
const control = { failDb: false, dbConfigured: true, sqlLog: [] };
globalThis.__followupTestDb = {
  batch: (...args) => db.batch(...args),
  execute: async (...args) => {
    if (control.failDb) throw new Error("synthetic DB outage");
    control.sqlLog.push(String(args[0]?.sql ?? args[0]));
    return db.execute(...args);
  },
};
globalThis.__followupControl = control;
globalThis.__followupCreateElement = createElement;

const stub = (source) => ({ url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true });
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL || "";
    if ((specifier === "./db" || specifier.endsWith("/lib/db")) && parent.startsWith("file:")) {
      return stub("export const isTursoConfigured=globalThis.__followupControl.dbConfigured;export function getDb(){return globalThis.__followupTestDb}");
    }
    if (specifier === "next/cache") return stub("export const unstable_cache=(fn)=>fn;");
    if (specifier === "next/navigation") {
      return stub("export function notFound(){const e=new Error('NEXT_NOT_FOUND');e.notFound=true;throw e}export function usePathname(){return '/'}export function useSearchParams(){return new URLSearchParams(globalThis.__followupSearch||'')}");
    }
    if (specifier === "next/link") {
      return stub("export default function Link({href,children,...rest}){return globalThis.__followupCreateElement('a',{href:typeof href==='string'?href:String(href),...rest},children)}");
    }
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith(".") && parent.startsWith("file:")) {
      const url = new URL(specifier, parent);
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
const results = [];
function check(id, condition, message) {
  assert.ok(condition, `${id}: ${message}`);
  assertions += 1;
  results.push(id);
}

const originalFetch = globalThis.fetch;
const previousKey = process.env.DATA_GO_KR_NUTRITION_KEY;
process.env.DATA_GO_KR_NUTRITION_KEY = "synthetic-followup-key";
let upstream = () => { throw new Error("unplanned upstream request"); };
let upstreamCalls = [];
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  upstreamCalls.push(url);
  return upstream(url);
};
const envelope = (rows, totalCount = rows.length, resultCode = "00") => new Response(JSON.stringify({
  response: { header: { resultCode, resultMsg: resultCode === "00" ? "OK" : "synthetic error" }, body: { totalCount, items: { item: rows } } },
}), { status: 200 });
const raw = (code, name, extra = {}) => ({ foodCd: code, foodNm: name, nutConSrtrQua: "100g", enerc: "100", prot: "5", nat: "50", dataCrtrYmd: "2025-01-01", ...extra });

async function render(element) {
  // Async server components: resolve the tree before static rendering.
  return renderToStaticMarkup(await element);
}

try {
  const api = await import("../lib/national-nutrition-api.ts");
  const cache = await import("../lib/national-nutrition-db.ts");
  const comparison = await import("../lib/nutrition-comparison.ts");
  const selection = await import("../lib/comparison-selection.ts");
  const { serializeJsonLd } = await import("../lib/json-ld.ts");
  const { GET: nutritionApi } = await import("../app/api/nutrition-data/route.ts");
  const HubPage = (await import("../app/nutrition-data/page.tsx")).default;
  const ComparePage = (await import("../app/compare/page.tsx")).default;
  const DetailPage = (await import("../app/nutrition-data/[dataset]/[foodCode]/page.tsx")).default;

  await cache.ensureNationalNutritionSchema();
  const normalize = api.normalizeNationalNutritionItem;

  // ---------- T02 search scope ----------
  const stored25 = Array.from({ length: 25 }, (_, i) => normalize(raw(`S-${String(i + 1).padStart(3, "0")}`, `저장식품 ${String(i + 1).padStart(2, "0")}`)));
  await cache.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: 100, foods: stored25 });
  upstreamCalls = [];
  upstream = () => envelope(Array.from({ length: 12 }, (_, i) => raw(`U-${i}`, `원천식품 ${i}`)), 100);
  const pages = [];
  for (const pageNo of [1, 2, 3, 4]) pages.push(await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", pageNo, numOfRows: 12 }));
  check("R07", upstreamCalls.length === 0, "stored pages 1→4 never switch to the source");
  check("R07", pages.map((p) => p.count).join(",") === "12,12,1,0" && pages.every((p) => p.searchScope === "stored" && p.totalCount === 25), "stored scope, count and denominator stay fixed");
  check("R07", pages[3].ok === true && pages[3].foods.every((f) => f.foodCode.startsWith("S-")), "page end is a stored empty page, no mixed rows");

  upstream = (url) => envelope([raw("U-X", `원천 ${url.searchParams.get("foodNm")}`)], 1);
  const storedZeroP2 = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "없는식품", pageNo: 2 });
  check("R08", upstreamCalls.length === 0 && storedZeroP2.ok && storedZeroP2.totalCount === 0 && storedZeroP2.searchScope === "stored", "past page 1 a stored zero stays stored (no mid-session switch)");
  const storedZero = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "없는식품" });
  check("R08", upstreamCalls.length === 1 && storedZero.searchScope === "upstream" && storedZero.scopeReason === "stored_no_match" && storedZero.countScope === "source", "fresh search with no stored match opens a labelled source scope at page 1");
  const storedHit = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "저장식품" });
  check("R08", upstreamCalls.length === 1 && storedHit.searchScope === "stored", "a stored match never calls the source");
  const explicit = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "없는식품", source: "upstream" });
  check("R08", explicit.ok && explicit.searchScope === "upstream" && explicit.countScope === "source" && upstreamCalls.length === 2, "explicit source search opens the source scope");
  upstream = (url) => envelope([raw(`U-P${url.searchParams.get("pageNo")}`, "원천 페이지")], 30);
  const upstreamPage2 = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "원천", source: "upstream", pageNo: 2 });
  check("R09", upstreamCalls.at(-1).searchParams.get("pageNo") === "2" && upstreamCalls.at(-1).searchParams.get("foodNm") === "원천" && upstreamPage2.totalCount === 30 && upstreamPage2.searchScope === "upstream", "source scope keeps q, page and its own denominator");

  await cache.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: null, foods: [normalize(raw("ESC-1", "100%_유기농\\주스"))] });
  const escaped = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "%_유기농\\" });
  const wildcardOnly = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", query: "%" });
  check("R11", escaped.ok && escaped.count === 1 && wildcardOnly.count === 1, "%, _ and backslash are literal characters");

  // ---------- T01 state separation ----------
  control.failDb = true;
  upstreamCalls = [];
  const dbDown2 = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", pageNo: 2 });
  check("R10", dbDown2.ok === false && dbDown2.totalCount === null && dbDown2.countScope === "unknown" && upstreamCalls.length === 0, "DB outage on page 2 is a failure, not zero, and does not switch source mid-session");
  upstream = () => envelope([raw("U-1", "원천 1")], 1);
  const dbDown1 = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food" });
  check("R10", dbDown1.ok && dbDown1.searchScope === "upstream" && dbDown1.scopeReason === "stored_unavailable", "page-1 fallback during DB outage is explicitly labelled");
  control.failDb = false;

  // data.go.kr "03" NODATA_ERROR is a successful empty answer, not an outage.
  upstream = () => envelope([], undefined, "03");
  const noData = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "health", query: "x", source: "upstream" });
  check("R05", noData.ok === true && noData.totalCount === 0 && noData.count === 0, "NODATA (03) is a valid zero");
  const noDataDetail = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "NOPE-03" });
  check("R05", noDataDetail.kind === "not_found", "NODATA (03) on a detail lookup is a confirmed absence -> 404");
  upstream = () => envelope([], 0, "30");
  const providerError = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "health", query: "x", source: "upstream" });
  check("R02", providerError.ok === false && providerError.totalCount === null, "HTTP 200 with provider error code is a failure, not zero");

  // R01/R03 on the rendered hub: food/process/material/health/all.
  await cache.saveNationalNutritionItemsToDb({ dataset: "process", totalCount: null, foods: [normalize(raw("P-1", "가공 비교식품"))] });
  await cache.saveNationalNutritionItemsToDb({ dataset: "material", totalCount: null, foods: [normalize(raw("M-1", "원재료"))] });
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: null, foods: [normalize(raw("A-1", "통합"))] });
  // "health" has no stored rows → bootstrap to source; make that source fail.
  upstream = () => new Response("upstream down", { status: 503 });
  const hubHtml = await render(HubPage({ searchParams: Promise.resolve({ q: "비교식품" }) }));
  check("R01", hubHtml.includes("현재 영양고고 저장 자료에서 일치하는 식품을 찾지 못했습니다"), "stored zero stays a normal zero when the source is down");
  check("R01", (hubHtml.match(/일시적으로 불러오지 못했습니다/g) || []).length === 1, "only the failing dataset shows a failure");
  check("R03", hubHtml.includes("가공 비교식품"), "other datasets remain visible when one fails");
  check("R25", hubHtml.includes('href="/nutrition-data/process?q=%EB%B9%84%EA%B5%90%EC%8B%9D%ED%92%88"'), "\"더 보기\" keeps the same q");
  check("R26", hubHtml.includes("데이터셋별 최대 4개") && !/고유 식품 \d/.test(hubHtml), "preview count is not presented as unique foods");

  // Stored has no match but the source does: labelled source scope, paging pinned to it.
  upstream = (url) => envelope([raw(`SRC-${url.pathname.slice(-12)}`, "원천전용식품")], 1);
  const hubSource = await render(HubPage({ searchParams: Promise.resolve({ q: "원천전용식품" }) }));
  check("R08", hubSource.includes("공식 원천 검색 결과를 표시합니다") && hubSource.includes("source=upstream"), "hub labels a source-scope answer and pins more-links to it");

  upstream = () => new Response("down", { status: 503 });
  control.failDb = true;
  await assert.rejects(render(HubPage({ searchParams: Promise.resolve({ q: "전부실패" }) })), /nutrition_lookup_unavailable/);
  check("R03", true, "hub with no successful dataset raises a server error instead of an empty 200");
  control.failDb = false;

  // R27: hub carries comparison state into cards and "more" links.
  const hubWithState = await render(HubPage({ searchParams: Promise.resolve({ q: "가공", item: "food|S-001", basis: "per100g", amount: "150g" }) }));
  check("R27", hubWithState.includes("item=food%7CS-001") && hubWithState.includes("basis=per100g") && hubWithState.includes("amount=150g"), "hub links preserve item/basis/amount");
  check("R27", hubWithState.includes("item=food%7CS-001&amp;item=process%7CP-1") || hubWithState.includes("item=food%7CS-001&item=process%7CP-1"), "add-to-compare appends to the existing selection");

  // R04/R05 detail states.
  upstream = () => new Response("timeout", { status: 504 });
  const detailTimeout = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "NOT-STORED" });
  check("R04", detailTimeout.kind === "temporarily_unavailable" && detailTimeout.retryable, "DB miss + upstream failure is not collapsed to not_found");
  await assert.rejects(DetailPage({ params: Promise.resolve({ dataset: "food", foodCode: "NOT-STORED" }) }), /nutrition_detail_unavailable/);
  check("R04", true, "detail page throws (5xx) on temporary failure instead of 404");
  upstream = () => envelope([raw("OTHER", "다른 코드")], 1);
  const detailMissing = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "NOT-STORED" });
  check("R05", detailMissing.kind === "not_found" && detailMissing.source === "upstream", "only a successful source answer without the code is not_found");
  await assert.rejects(DetailPage({ params: Promise.resolve({ dataset: "food", foodCode: "NOT-STORED" }) }), (error) => error.notFound === true);
  check("R05", true, "confirmed absence renders the 404 path");
  const detailFound = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "S-001" });
  check("R05", detailFound.kind === "found" && detailFound.provenance.source === "stored" && /^\d{4}-/.test(detailFound.provenance.storedAt) && detailFound.provenance.sourceUpdatedAt === "2025-01-01", "found record carries separated provenance dates");

  // R06/R32 comparison.
  upstream = () => new Response("down", { status: 503 });
  const compareHtml = await render(ComparePage({ searchParams: Promise.resolve({ item: ["food|S-001", "food|S-002", "food|GONE"], basis: "reported", amount: "120g" }) }));
  check("R06", compareHtml.includes("일부 식품을 일시적으로 불러오지 못했습니다") && compareHtml.includes('name="item" value="food|GONE"'), "temporary failure keeps the original selection");
  check("R06", compareHtml.includes("다시 시도") && compareHtml.includes("비교에서 제거"), "retry and remove are separate actions");
  const compareOne = await render(ComparePage({ searchParams: Promise.resolve({ item: ["food|S-001"] }) }));
  check("R32", compareOne.includes("1개를 선택했습니다") && compareOne.includes("item=food%7CS-001"), "one remaining item keeps selection and offers adding");

  // ---------- T03 identity / representative row ----------
  const sameName = [normalize(raw("SAME-1", "동명식품", { typeNm: "음식", restNm: "급식A" })), normalize(raw("SAME-2", "동명식품", { typeNm: "가공식품", mfrNm: "제조B" }))];
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: null, foods: sameName });
  const sameNameList = await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", query: "동명식품" });
  check("R12", sameNameList.count === 2 && new Set(sameNameList.foods.map((f) => f.foodCode)).size === 2, "same name, different codes stay separate");
  const hubSame = await render(HubPage({ searchParams: Promise.resolve({ q: "동명식품" }) }));
  check("R12", hubSame.includes("급식A") && hubSame.includes("제조B"), "cards show distinguishing identity");

  const dupA = normalize(raw("DUP-1", "대표행식품", { enerc: "111" }));
  const dupB = normalize(raw("DUP-1", "대표행식품", { enerc: "222" }));
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", query: "b-query", totalCount: null, foods: [dupB] });
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", query: "a-query", totalCount: null, foods: [dupA] });
  await db.execute("UPDATE national_nutrition_items SET synced_at = '2026-01-01 00:00:00' WHERE food_code = 'DUP-1'");
  const dupList = (await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "all", query: "대표행식품" })).foods;
  const dupDetail = await cache.fetchNationalNutritionItemDetail({ dataset: "all", foodCode: "DUP-1" });
  check("R13", dupList.length === 1 && dupList[0].energy === "111" && dupDetail.item.energy === "111", "list and detail choose the same representative row (tie-break query_key ASC)");

  await db.execute("UPDATE national_nutrition_items SET synced_at = '2026-02-01 00:00:00', updated_at = '2020-01-01' WHERE food_code = 'DUP-1' AND query_key = 'b-query'");
  const sitemapRows = await cache.readNationalNutritionSitemapItems({ dataset: "all", page: 0, pageSize: 100 });
  const dupDetail2 = await cache.fetchNationalNutritionItemDetail({ dataset: "all", foodCode: "DUP-1" });
  check("R14", dupDetail2.item.energy === "222" && sitemapRows.find((r) => r.foodCode === "DUP-1").updatedAt === "2020-01-01", "latest storage wins even with older source date; sitemap lastmod comes from that same row");

  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: null, foods: [
    normalize(raw("REL-BASE", "기준 김밥", { foodLv3Nm: "밥류", foodLv4Nm: "김밥" })),
    normalize(raw("REL-SAME", "참치 김밥", { foodLv3Nm: "밥류", foodLv4Nm: "김밥" })),
    normalize(raw("REL-LARGE", "볶음밥", { foodLv3Nm: "밥류", foodLv4Nm: "볶음밥" })),
    normalize(raw("REL-NONE", "최근 음료", { foodLv3Nm: "음료류", foodLv4Nm: "주스" })),
  ] });
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", query: "second", totalCount: null, foods: [normalize(raw("REL-SAME", "참치 김밥", { foodLv3Nm: "밥류", foodLv4Nm: "김밥" }))] });
  await db.execute("UPDATE national_nutrition_items SET synced_at = '2030-01-01 00:00:00' WHERE food_code = 'REL-NONE'");
  const base = (await cache.fetchNationalNutritionItemDetail({ dataset: "all", foodCode: "REL-BASE" })).item;
  const related = await cache.readRelatedNationalNutritionItemsFromDb({ dataset: "all", item: base });
  check("R15", related.filter((r) => r.foodCode === "REL-SAME").length === 1, "same code stored twice appears once");
  check("R16", !related.some((r) => r.foodCode === "REL-NONE") && related[0].foodCode === "REL-SAME" && related[0].relation === "representative_food" && related[1].relation === "large_category", "unrelated recent row is not offered; relation is labelled");
  check("R16", (await cache.readRelatedNationalNutritionItemsFromDb({ dataset: "all", item: { ...base, representativeFood: "", middleCategory: "", largeCategory: "" } })).length === 0, "no shared category → no related claim");

  // ---------- T04 values / identifiers ----------
  const liquid = normalize(raw("MEAL-ML", "덮밥", { nutConSrtrQua: "100mL" }));
  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: null, foods: [liquid] });
  const liquidDetail = await cache.fetchNationalNutritionItemDetail({ dataset: "all", foodCode: "MEAL-ML" });
  const liquidPer100g = comparison.normalizeNutrientForComparison({ rawValue: "5", unit: "g", servingUnit: liquidDetail.item.servingUnit, energy: "100", basis: "per100g" });
  check("R17", liquidDetail.item.servingUnit === "100mL" && liquidPer100g.displayValue === null, "100mL source basis is preserved and never converted to g");
  check("R18", ["", "ND", "미량", "0"].map((v) => comparison.formatNutrientForDisplay(v, "g")).join("|") === "자료 없음|미검출|미량|0 g", "blank / ND / trace / 0 keep different meanings");
  const per = (rawValue, unit, servingUnit, energy, basis, target) => comparison.normalizeNutrientForComparison({ rawValue, unit, servingUnit, energy, basis, targetServingUnit: target }).displayValue;
  check("R19", per("400", "mg", "80g", "100", "per100g") === 500 && per("400", "mg", "80g", "100", "perIntake", "120g") === 600, "80g/400mg → 500mg per 100g, 600mg per 120g");
  check("R20", per("20", "g", "250ml", "200", "per100ml") === 8 && per("20", "g", "250ml", "200", "per100kcal") === 10, "250ml/20g/200kcal → 8g per 100ml, 10g per 100kcal");
  check("R21", per("5", "g", "100g", "0", "per100kcal") === null && per("5", "g", "100g", "", "per100kcal") === null, "0kcal or blank energy refuses 100kcal");
  check("R22", per("5", "g", "200ml", "100", "per100g") === null, "ml without density refuses g conversion");
  check("R23", comparison.parseNutrientValue("1,2", "g").state === "invalid" && comparison.parseNutrientValue("12,34", "g").state === "invalid" && comparison.parseNutrientValue("1,234.5", "mg").numericValue === 1234.5, "ambiguous comma numbers are rejected, grouped numbers parsed");
  check("R23", per("1e308", "g", "0.000001g", "100", "per100g") === null && comparison.formatComparisonValue({ displayValue: Infinity }) === "계산 불가", "overflow never prints a number");
  check("R23", comparison.parseServingBasis("1,5g").dimension === "unsupported" && comparison.parseServingBasis("1,000g").amount === 1000, "serving basis comma handling");

  await cache.saveNationalNutritionItemsToDb({ dataset: "all", totalCount: null, foods: [normalize({ foodNm: "코드없는식품", enerc: "1" })] });
  const noCodeRows = Number((await db.execute("SELECT COUNT(*) AS n FROM national_nutrition_items WHERE food_name = '코드없는식품'")).rows[0].n);
  check("R24", noCodeRows === 0, "rows without a source code are not stored under a name-derived ID");
  await db.execute("INSERT INTO national_nutrition_items (dataset_slug, query_key, food_code, food_name, synced_at) VALUES ('all', '__default__', 'all-과거식품', '과거식품', CURRENT_TIMESTAMP)");
  const legacySitemap = await cache.readNationalNutritionSitemapItems({ dataset: "all", page: 0, pageSize: 100 });
  const legacyHub = await render(HubPage({ searchParams: Promise.resolve({ q: "과거식품" }) }));
  check("R24", !legacySitemap.some((r) => r.foodCode === "all-과거식품") && legacyHub.includes("원천 코드 없음"), "legacy synthetic ID is excluded from sitemap and not shown as a food code");

  // ---------- T06 amount input ----------
  const split = selection.resolveComparisonAmount({ amountValue: "150", amountUnit: "ml" });
  const legacy = selection.resolveComparisonAmount({ amount: "120g" });
  const bad = selection.resolveComparisonAmount({ amount: "120g", amountValue: "abc", amountUnit: "g" });
  check("R28", split.targetServingUnit === "150ml" && !split.invalidInput, "number + unit select serialize to the legacy form");
  check("R29", legacy.targetServingUnit === "120g" && selection.splitComparisonAmount("300ml").unit === "ml", "legacy amount=120g URLs keep working");
  check("R28", bad.invalidInput && bad.targetServingUnit === "120g", "invalid numeric input keeps the previous amount and is reported");
  const compareForm = await render(ComparePage({ searchParams: Promise.resolve({ item: ["food|S-001", "food|S-002"], basis: "perIntake", amount: "300ml" }) }));
  check("R28", compareForm.includes('name="amountValue"') && compareForm.includes('inputMode="decimal"') && /<option value="ml" selected="">ml<\/option>/.test(compareForm), "form uses a numeric field plus a unit select");
  await cache.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: null, foods: [normalize(raw("S-250", "다른기준", { nutConSrtrQua: "250g" }))] });
  const reportedHtml = await render(ComparePage({ searchParams: Promise.resolve({ item: ["food|S-001", "food|S-250"], basis: "reported" }) }));
  check("R30", reportedHtml.includes("각 열의 기준량이 서로 다릅니다") && reportedHtml.includes("원자료 기준량 250g"), "different reported bases are flagged per column");
  const four = selection.toggleComparisonSelection(["food|A", "food|B", "food|C", "food|D"], "food|A", false);
  check("R31", four.map((r) => r.value).join(",") === "food|B,food|C", "hidden fourth item never resurrects");

  // ---------- T09 JSON-LD boundary ----------
  await cache.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: null, foods: [normalize(raw("XSS-1", "</script><script>alert(1)</script>"))] });
  const xssHtml = await render(DetailPage({ params: Promise.resolve({ dataset: "food", foodCode: "XSS-1" }) }));
  const ldBlock = xssHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  check("T09-LD", !ldBlock.includes("</script") && !ldBlock.includes("<script") && JSON.parse(ldBlock).name.startsWith("</script>"), "JSON-LD cannot close its script element and still round-trips");
  check("T09-LD", serializeJsonLd({ a: "<!--&\u2028" }) === '{"a":"\\u003c!--\\u0026\\u2028"}', "HTML-significant characters escaped");
  check("T09-Schema", JSON.parse(ldBlock).publisher && !JSON.parse(ldBlock).creator, "site is publisher of the view, not creator of the source data");

  // ---------- diagnostics: safe failure reasons ----------
  upstream = () => new Response("<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><returnReasonCode>30</returnReasonCode></cmmMsgHeader></OpenAPI_ServiceResponse>", { status: 200 });
  const gw = await (await nutritionApi(new Request("http://fixture.test/api/nutrition-data?dataset=food&q=x&source=upstream"))).json();
  check("DIAG", gw.ok === false && gw.failureReason === "non_json:code30:SERVICE_KEY_IS_NOT_REGISTERED_ERROR:SERVICE_ERROR", `gateway XML error is reported as enumerated tokens (got ${gw.failureReason})`);
  check("DIAG", !JSON.stringify(gw).includes("synthetic-followup-key"), "service key never appears in the API response");
  upstream = () => new Response(JSON.stringify({ code: -4, msg: "secret-ish text synthetic-followup-key" }), { status: 200 });
  const shape = await (await nutritionApi(new Request("http://fixture.test/api/nutrition-data?dataset=food&q=x&source=upstream"))).json();
  check("DIAG", shape.failureReason === "result_missing:code();msg();code=-4" && !JSON.stringify(shape).includes("secret"), `unexpected JSON shape reports key names and numeric codes only (got ${shape.failureReason})`);
  upstream = () => new Response("Unauthorized", { status: 401 });
  check("DIAG", (await (await nutritionApi(new Request("http://fixture.test/api/nutrition-data?dataset=food&q=x&source=upstream"))).json()).failureReason === "http_401:text", "HTTP status is reported");
  upstream = () => { throw Object.assign(new Error("boom"), { name: "TypeError" }); };
  const netDetail = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "NET-ERR" });
  check("DIAG", netDetail.kind === "temporarily_unavailable" && netDetail.reasonCode === "upstream_network_TypeError", "network error reason reaches the detail state");

  // ---------- calculator component (detail + tool) ----------
  const { NutritionBasisCalculator } = await import("../components/NutritionBasisCalculator.tsx");
  const { defaultLabelNutrients } = await import("../lib/label-nutrients.ts");
  const calc = renderToStaticMarkup(createElement(NutritionBasisCalculator, {
    servingUnit: "80g", defaultIntake: "120g",
    nutrients: [{ key: "energy", label: "열량", unit: "kcal", raw: "200" }, { key: "sodium", label: "나트륨", unit: "mg", raw: "400" }, { key: "sugars", label: "당류", unit: "g", raw: "" }],
  }));
  check("CALC", calc.includes("500 mg") && calc.includes("600 mg") && calc.includes("200 mg"), "80g/400mg → 500mg per 100g, 600mg per 120g, 200mg per 100kcal");
  check("CALC", calc.includes("100g당") && /당류<\/th><td>자료 없음<\/td>/.test(calc), "blank value stays 자료 없음, never 0");
  const liquidCalc = renderToStaticMarkup(createElement(NutritionBasisCalculator, { servingUnit: "250ml", defaultIntake: "100g", nutrients: [{ key: "protein", label: "단백질", unit: "g", raw: "20" }] }));
  check("CALC", liquidCalc.includes("100ml당") && liquidCalc.includes("8 g") && liquidCalc.includes("원자료와 같은 질량 또는 부피 단위"), "ml basis uses 100ml and refuses a g intake with a visible reason");
  const tool = renderToStaticMarkup(createElement(NutritionBasisCalculator, { editable: true, servingUnit: "", nutrients: defaultLabelNutrients() }));
  check("CALC", (tool.match(/inputMode="decimal"/g) || []).length === 9 && tool.includes("환산할 수 없습니다"), "tool renders numeric inputs and asks for a valid basis");

  // ---------- T11 request counts & API bounds ----------
  control.sqlLog = [];
  upstreamCalls = [];
  await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", pageNo: 1, numOfRows: 12 });
  check("R47", upstreamCalls.length === 0 && control.sqlLog.length === 2, `stored page read = 2 SQL statements, 0 upstream (got ${control.sqlLog.length})`);
  const apiRes = await nutritionApi(new Request("http://fixture.test/api/nutrition-data?dataset=food&numOfRows=99999&pageNo=abc"));
  const apiJson = await apiRes.json();
  check("T11", apiRes.status === 200 && apiJson.count <= 50 && apiJson.searchScope === "stored", "API bounds numOfRows and reports its scope");

  // R48: a failed refresh never overwrites a good snapshot.
  upstream = () => new Response("down", { status: 503 });
  const before = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "S-001" });
  await cache.fetchNationalNutritionItemsWithDbCache({ dataset: "food", source: "upstream" });
  const after = await cache.fetchNationalNutritionItemDetail({ dataset: "food", foodCode: "S-001" });
  check("R48", before.item.energy === after.item.energy && after.kind === "found", "source failure leaves stored data intact");

  console.log(`follow-up state contract: ${assertions} assertions passed (${new Set(results).size} requirement IDs); SQLite memory + mocked fetch only`);
} finally {
  globalThis.fetch = originalFetch;
  if (previousKey === undefined) delete process.env.DATA_GO_KR_NUTRITION_KEY;
  else process.env.DATA_GO_KR_NUTRITION_KEY = previousKey;
  delete globalThis.__followupTestDb;
  delete globalThis.__followupControl;
  hooks.deregister();
  db.close();
}
