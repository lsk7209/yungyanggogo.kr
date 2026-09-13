import assert from "node:assert/strict";
import { canRequestAdsForPath } from "../lib/ad-policy.ts";

for (const path of ["/", "/compare", "/rankings", "/nutrition-data", "/nutrition-data/all", "/health-functional-foods", "/does-not-exist", "/api/foods"]) {
  assert.equal(canRequestAdsForPath(path), false, `${path} must not request ads`);
}
assert.equal(canRequestAdsForPath("/blog/nutrition-label-comparison-basis"), false);
assert.equal(canRequestAdsForPath("/nutrition-data/food/D212-1"), true);
assert.equal(canRequestAdsForPath("/nutrition-data/invalid/D212-1"), false);

console.log("ad policy: 11 assertions passed");
