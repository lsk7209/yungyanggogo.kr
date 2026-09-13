import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/national-nutrition-db.ts", import.meta.url), "utf8");

assert.match(source, /COUNT\(DISTINCT food_code\) AS total_count/);
assert.match(source, /ROW_NUMBER\(\) OVER \([\s\S]*?PARTITION BY food_code/);
assert.match(source, /food_name LIKE \? ESCAPE/);
assert.match(source, /args: \[dataset, pattern, limit, offset\]/);
assert.match(source, /ORDER BY food_name ASC, food_code ASC/);
assert.match(source, /replace\(\/%\/g, "\\\\%"\)\.replace\(\/_\/g, "\\\\_"\)/);
assert.match(source, /COUNT\(DISTINCT food_code\) AS total_count FROM national_nutrition_items WHERE dataset_slug = \?/);
assert.match(source, /WHERE row_rank = 1\s+ORDER BY food_name ASC, food_code ASC/);

console.log("nutrition DB search boundary: 8 assertions passed");
