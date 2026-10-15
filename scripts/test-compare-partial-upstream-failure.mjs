import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

// lib 내부의 확장자 없는 import(.ts)를 해석하기 위한 테스트 전용 resolve 훅
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function resolve(specifier, context, next) {
      try { return await next(specifier, context); }
      catch (error) { if (specifier.startsWith(".")) return next(specifier + ".ts", context); throw error; }
    }`)
);
const { fetchNationalNutritionItems } = await import("../lib/national-nutrition-api.ts");

// 제공처 오류(HTTP 500, 네트워크 예외, 키 없음)가 예외로 번지지 않고 '실패 결과'로 돌아와야
// 비교 화면이 해당 항목만 제외하고 나머지를 계속 보여줄 수 있다
const originalFetch = globalThis.fetch;
const originalKey = process.env.DATA_GO_KR_NUTRITION_KEY;
process.env.DATA_GO_KR_NUTRITION_KEY = "test-key-not-real";
try {
  globalThis.fetch = async () => new Response("upstream error", { status: 500 });
  const http500 = await fetchNationalNutritionItems({ dataset: "all", foodCode: "BAD-1", numOfRows: 1 });
  assert.equal(http500.ok, false);
  assert.deepEqual(http500.foods, []);

  globalThis.fetch = async () => { throw new Error("network down"); };
  const thrown = await fetchNationalNutritionItems({ dataset: "all", foodCode: "BAD-2", numOfRows: 1 });
  assert.equal(thrown.ok, false);
  assert.deepEqual(thrown.foods, []);

  delete process.env.DATA_GO_KR_NUTRITION_KEY;
  for (const key of ["DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY", "PUBLIC_DATA_SERVICE_KEY", "DATA_GO_KR_SERVICE_KEY"]) delete process.env[key];
  const noKey = await fetchNationalNutritionItems({ dataset: "all", foodCode: "BAD-3", numOfRows: 1 });
  assert.equal(noKey.ok, false);
  assert.equal(noKey.status, 503);
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.DATA_GO_KR_NUTRITION_KEY;
  else process.env.DATA_GO_KR_NUTRITION_KEY = originalKey;
}

// 비교 화면: 항목별로 독립 조회하고, 실패 항목만 안내하며 정상 항목은 유지
const compare = readFileSync("app/compare/page.tsx", "utf8");
assert.match(compare, /Promise\.all\(\s*selectedRefs\.map/);
assert.match(compare, /Boolean\(entry\.result\.item\)/);
assert.match(compare, /일부 식품을 불러오지 못했습니다/);

console.log("compare partial upstream failure: 500/network/no-key return failure results; page keeps other items");
