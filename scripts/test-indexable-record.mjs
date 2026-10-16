import assert from "node:assert/strict";
import { CORE_NUTRIENTS, CORE_NUTRIENTS_SQL, hasEnoughCoreNutrients } from "../lib/indexable-record.ts";

const empty = Object.fromEntries(CORE_NUTRIENTS.map((key) => [key, ""]));
assert.equal(hasEnoughCoreNutrients(empty), false);
assert.equal(hasEnoughCoreNutrients({ ...empty, energy: "100", protein: "2" }), false);
assert.equal(hasEnoughCoreNutrients({ ...empty, energy: "100", protein: "2", fat: "1" }), true);
assert.equal(hasEnoughCoreNutrients({ ...empty, energy: " ", protein: " ", fat: " ", sodium: "5" }), false);
// 사이트맵 SQL이 같은 컬럼·임계값을 쓰는지(색인 판정과 어긋나면 안 된다)
for (const key of CORE_NUTRIENTS) assert.ok(CORE_NUTRIENTS_SQL.includes(`TRIM(${key})`), key);
assert.ok(CORE_NUTRIENTS_SQL.endsWith(">= 3"));

console.log("indexable record: 8 assertions passed");
