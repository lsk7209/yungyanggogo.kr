import assert from "node:assert/strict";
import { resolveNationalNutritionDbTotalCount } from "../lib/nutrition-count.ts";

assert.equal(resolveNationalNutritionDbTotalCount(37, 20), 37);
assert.equal(resolveNationalNutritionDbTotalCount("37", 20), 37);
assert.equal(resolveNationalNutritionDbTotalCount(0, 20), 0);
assert.equal(resolveNationalNutritionDbTotalCount("0", 20), 0);
assert.equal(resolveNationalNutritionDbTotalCount(null, 20), 20);
assert.equal(resolveNationalNutritionDbTotalCount(undefined, 20), 20);
assert.equal(resolveNationalNutritionDbTotalCount("invalid", 20), 20);
assert.equal(resolveNationalNutritionDbTotalCount(-1, 20), 20);

console.log("national nutrition DB count: 8 assertions passed");
