import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = {
  api: await readFile(new URL("../app/api/nutrition-data/route.ts", import.meta.url), "utf8"),
  index: await readFile(new URL("../app/nutrition-data/page.tsx", import.meta.url), "utf8"),
  dataset: await readFile(new URL("../app/nutrition-data/[dataset]/page.tsx", import.meta.url), "utf8"),
  cache: await readFile(new URL("../lib/national-nutrition-db.ts", import.meta.url), "utf8")
};

for (const [name, source] of Object.entries({ api: files.api, index: files.index, dataset: files.dataset })) {
  assert.match(source, /isTursoConfigured/, `${name} must recognize the DB provider`);
}

assert.match(files.api, /!hasKey\s*&&\s*!isTursoConfigured/, "API must fail only when neither provider exists");
assert.match(files.index, /hasApiKey\s*\|\|\s*isTursoConfigured/, "index must load from API or DB");
assert.match(files.dataset, /hasApiKey\s*\|\|\s*isTursoConfigured/, "dataset page must load from API or DB");
assert.match(files.cache, /readNationalNutritionItemsFromDb[\s\S]*?if \(cached\.foods\.length > 0\)/, "DB lookup must precede API fallback");

console.log("nutrition provider boundary: 7 assertions passed");
