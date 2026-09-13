import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveNationalNutritionDbTotalCount } from "../lib/nutrition-count.ts";

const healthAdapter = readFileSync(new URL("../lib/health-functional-food-api.ts", import.meta.url), "utf8");
const datasetPage = readFileSync(new URL("../app/nutrition-data/[dataset]/page.tsx", import.meta.url), "utf8");
const nutritionIndex = readFileSync(new URL("../app/nutrition-data/page.tsx", import.meta.url), "utf8");
const homePage = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const healthPage = readFileSync(new URL("../app/health-functional-foods/page.tsx", import.meta.url), "utf8");
const blogModule = readFileSync(new URL("../lib/blog.ts", import.meta.url), "utf8");

assert.equal(resolveNationalNutritionDbTotalCount(0, 3), 0);
assert.equal(resolveNationalNutritionDbTotalCount("0", 3), 0);
assert.equal(resolveNationalNutritionDbTotalCount("bad", 3), 3);
assert.equal(resolveNationalNutritionDbTotalCount(-1, 3), 3);
assert.equal(resolveNationalNutritionDbTotalCount(undefined, 3), 3);
assert.match(healthAdapter, /resolveNationalNutritionDbTotalCount\(record\.total_count, rows\.length\)/);

assert.match(datasetPage, /result\?\.ok && page \* 50 < result\.totalCount/);
assert.match(datasetPage, /\(page - 1\) \* 50 >= result\.totalCount/);
assert.match(datasetPage, /실패를 0건으로 해석하지 않습니다/);
assert.match(nutritionIndex, /successfulResults = results\.filter\(\(result\) => result\.ok\)/);
assert.match(nutritionIndex, /원천 전체 건수 확인 불가/);

assert.doesNotMatch(homePage, /const categories =/);
assert.match(homePage, /카테고리별 결과를 가장하지 않습니다/);
assert.doesNotMatch(healthPage, /name="q"/);
assert.match(healthPage, /전체 품목 검색은 준비 중입니다/);
assert.match(healthPage, /첫 12개 확인 범위/);

assert.match(blogModule, /humanReview\?: "approved" \| "pending"/);
assert.match(blogModule, /post\.humanReview === "approved" \? post\.noindex : true/);

console.log("remaining acceptance boundary: 18 assertions passed");
