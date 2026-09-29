import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/national-nutrition-db.ts", import.meta.url), "utf8");

// Only the dataset-level bootstrap (nothing stored yet) writes a source page back.
assert.match(source, /if \(!query && result\.ok && !result\.fallback && result\.foods\.length > 0 && scopeReason === "stored_dataset_empty"\)/);
assert.match(source, /fetchNationalNutritionItems\(\{[\s\S]*?dataset,[\s\S]*?query,/);
assert.match(source, /unstable_cache\([\s\S]*?revalidate: 3600/);
// Failures are thrown inside the cached function so they are never cached.
assert.match(source, /if \(!result\.ok\) throw new UncachedNutritionFailure\(result\)/);

console.log("nutrition cache identity boundary: 4 assertions passed");
