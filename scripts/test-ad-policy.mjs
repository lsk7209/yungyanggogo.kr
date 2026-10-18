import assert from "node:assert/strict";
import { canRequestAdsForPath } from "../lib/ad-policy.ts";

for (const path of ["/", "/compare", "/rankings", "/blog", "/nutrition-data", "/nutrition-data/all", "/nutrition-data/food/D212-1", "/nutrition-data/food/group/샌드위치", "/health-functional-foods", "/does-not-exist", "/api/foods"]) {
  assert.equal(canRequestAdsForPath(path), false, `${path} must not request ads`);
}
assert.equal(canRequestAdsForPath("/blog/nutrition-label-comparison-basis"), true);
assert.equal(canRequestAdsForPath("/blog/a/b"), false);

console.log("ad policy: 14 assertions passed");
