import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paths = [
  "app/nutrition-data/[dataset]/[foodCode]/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "lib/ad-policy.ts",
  ".env.example",
];
const source = (await Promise.all(paths.map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")))).join("\n");

assert.doesNotMatch(source, /CoupangPartnersBanner/);
assert.doesNotMatch(source, /NEXT_PUBLIC_AFFILIATE_ENABLED/);
assert.doesNotMatch(source, /coupang-partners-banner/);
assert.doesNotMatch(source, /banner-management|banner-measurement/);

console.log("affiliate removal boundary: 4 assertions passed");
