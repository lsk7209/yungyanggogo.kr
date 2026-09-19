import assert from "node:assert/strict";
import * as counts from "../lib/nutrition-count.ts";

let assertions = 0;
function equal(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  assertions += 1;
}

for (const input of [37, "37", 0, "0"]) {
  equal(counts.parseNutritionTotalCount(input), Number(input), "known count, including zero");
}
for (const input of [null, undefined, "", " ", "invalid", -1, 1.5, true, [], Infinity, "Infinity", Number.MAX_SAFE_INTEGER + 1]) {
  // Page length must never impersonate a total when the count is missing.
  equal(counts.parseNutritionTotalCount(input), null, "unknown count is not page length or zero");
}

const stored = { ok: true, totalCount: 500, countScope: "stored" };
equal(counts.describeNutritionCount(stored), "저장 자료 전체 500건", "partial local cache is labeled as stored");
equal(counts.describeNutritionCount(stored, true), "저장 자료 중 검색 일치 500건", "local search scope");
equal(counts.describeNutritionCount({ ...stored, countScope: "source" }), "원천 응답 기준 전체 500건", "source-reported total");
equal(counts.describeNutritionCount({ ...stored, countScope: "source" }, true), "원천 응답 기준 검색 일치 500건", "source query is not dataset-wide");
equal(counts.describeNutritionCount({ ...stored, totalCount: 0 }), "저장 자료 전체 0건", "valid zero stays visible");
equal(counts.describeNutritionCount({ ...stored, totalCount: null, countScope: "unknown" }), "전체 건수 미확인", "unknown total");
equal(counts.describeNutritionCount({ ...stored, totalCount: null }, true), "검색 일치 건수 미확인", "unknown search total");
equal(counts.describeNutritionCount({ ...stored, ok: false }), "조회 실패 · 전체 건수 미확인", "failure cannot show a successful total");
equal(counts.describeNutritionCount(null), "전체 건수 미확인", "unconfigured page");

equal(counts.getNutritionPagination({ ok: true, totalCount: 51, count: 50 }, 1, 50), { hasNext: true, outOfRange: false }, "known next page");
equal(counts.getNutritionPagination({ ok: true, totalCount: 51, count: 1 }, 2, 50), { hasNext: false, outOfRange: false }, "last page");
equal(counts.getNutritionPagination({ ok: true, totalCount: 0, count: 0 }, 1, 50), { hasNext: false, outOfRange: false }, "zero page one");
equal(counts.getNutritionPagination({ ok: true, totalCount: 0, count: 0 }, 2, 50), { hasNext: false, outOfRange: true }, "known invalid page");
equal(counts.getNutritionPagination({ ok: true, totalCount: null, count: 50 }, 2, 50), { hasNext: true, outOfRange: false }, "unknown total with full page remains navigable");
equal(counts.getNutritionPagination({ ok: true, totalCount: null, count: 1 }, 2, 50), { hasNext: false, outOfRange: false }, "unknown total does not reject real page-two rows");
equal(counts.getNutritionPagination({ ok: false, totalCount: 0, count: 0 }, 2, 50), { hasNext: false, outOfRange: false }, "failure is not an out-of-range claim");
console.log(`national nutrition count provenance: ${assertions} assertions passed`);
