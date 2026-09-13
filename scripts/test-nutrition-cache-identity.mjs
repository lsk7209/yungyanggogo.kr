import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/national-nutrition-db.ts", import.meta.url), "utf8");

assert.match(source, /if \(!query && result\.ok && !result\.fallback && result\.foods\.length > 0\)/);
assert.match(source, /fetchNationalNutritionItems\(\{[\s\S]*?dataset,[\s\S]*?query,/);
assert.match(source, /unstable_cache\([\s\S]*?revalidate: 3600/);

console.log("nutrition cache identity boundary: 3 assertions passed");
