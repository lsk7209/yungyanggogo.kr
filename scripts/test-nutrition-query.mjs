import assert from "node:assert/strict";
import {
  normalizeNutritionSearchQuery,
  parseBoundedPositiveInteger
} from "../lib/nutrition-query.ts";

assert.equal(normalizeNutritionSearchQuery("  닭튀김  "), "닭튀김");
assert.equal(normalizeNutritionSearchQuery("<script>alert(1)</script>"), "<script>alert(1)</script>");
assert.equal(normalizeNutritionSearchQuery("a\u0000b\n"), "ab");
assert.equal(normalizeNutritionSearchQuery("가".repeat(101)).length, 100);
assert.equal(normalizeNutritionSearchQuery(undefined), "");
assert.equal(parseBoundedPositiveInteger("2", 1, 50), 2);
assert.equal(parseBoundedPositiveInteger("999", 1, 50), 50);
assert.equal(parseBoundedPositiveInteger("0", 1, 50), 1);
assert.equal(parseBoundedPositiveInteger("-1", 1, 50), 1);
assert.equal(parseBoundedPositiveInteger("1.5", 1, 50), 1);
assert.equal(parseBoundedPositiveInteger("NaN", 1, 50), 1);
assert.equal(parseBoundedPositiveInteger(undefined, 12, 50), 12);

console.log("nutrition query boundary: 12 assertions passed");
