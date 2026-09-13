import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const robots = await readFile(new URL("../app/robots.ts", import.meta.url), "utf8");
const nutritionIndex = await readFile(new URL("../app/nutrition-data/page.tsx", import.meta.url), "utf8");
const dataset = await readFile(new URL("../app/nutrition-data/[dataset]/page.tsx", import.meta.url), "utf8");
const blog = await readFile(new URL("../app/blog/page.tsx", import.meta.url), "utf8");
const healthFoods = await readFile(new URL("../app/health-functional-foods/page.tsx", import.meta.url), "utf8");
const healthNutrition = await readFile(new URL("../app/health-functional-food-nutrition/page.tsx", import.meta.url), "utf8");

assert.doesNotMatch(robots, /"\/\*\?"/);
assert.match(robots, /const CRAWL_BLOCK = \["\/api\/"\]/);
assert.match(nutritionIndex, /robots: hasSearch \? \{ index: false, follow: true \} : undefined/);
assert.match(dataset, /robots: query \|\| queryParams\?\.item \? \{ index: false, follow: true \} : undefined/);
assert.match(dataset, /`\/nutrition-data\/\$\{dataset\}\?page=\$\{page\}`/);
assert.match(dataset, /url: absoluteUrl\(canonicalPath\)/);
assert.match(blog, /`\/blog\?page=\$\{page\}`/);
assert.match(healthFoods, /robots: hasSearchParams \? \{ index: false, follow: true \} : undefined/);
assert.match(healthNutrition, /robots: query \? \{ index: false, follow: true \} : undefined/);

await assert.rejects(access(new URL("../middleware.ts", import.meta.url)));

console.log("query index policy: 10 assertions passed");
