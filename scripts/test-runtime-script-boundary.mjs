import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const layout = await source("app/layout.tsx");
const detail = await source("app/nutrition-data/[dataset]/[foodCode]/page.tsx");
const analytics = await source("components/GAProvider.tsx");
const envExample = await source(".env.example");

assert.doesNotMatch(layout, /<AdsenseScript\s*\/>/);
assert.doesNotMatch(layout, /<CoupangPartnersBanner\s*\/>/);
assert.match(detail, /if \(!item\) \{\s*notFound\(\);\s*\}/);
assert.match(detail, /<AdsenseScript\s*\/>/);
assert.doesNotMatch(detail, /CoupangPartnersBanner/);
assert.match(analytics, /NEXT_PUBLIC_ANALYTICS_ENABLED !== "true"/);
assert.match(analytics, /const measurementId = process\.env\.NEXT_PUBLIC_GA_ID/);
assert.doesNotMatch(analytics, /G-92QVJS88F8/);
assert.equal(envExample.match(/^NEXT_PUBLIC_GA_ID=/gm)?.length, 1);

console.log("runtime script boundary: 9 assertions passed");
