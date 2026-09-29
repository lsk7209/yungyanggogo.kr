import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const indexRoute = await source("app/sitemap.xml/route.ts");
const coreRoute = await source("app/sitemaps/core.xml/route.ts");
const shardRoute = await source("app/sitemaps/nutrition/[id]/route.ts");
const db = await source("lib/national-nutrition-db.ts");
const xml = await source("lib/sitemap-xml.ts");
const config = await source("lib/sitemap-config.ts");
const robots = await source("app/robots.ts");

assert.match(config, /NUTRITION_SITEMAP_PAGE_SIZE = 10_000/);
assert.match(indexRoute, /Math\.ceil\(totalCount \/ NUTRITION_SITEMAP_PAGE_SIZE\)/);
assert.match(indexRoute, /renderSitemapIndex/);
assert.match(indexRoute, /dynamic = "force-dynamic"/);
assert.match(indexRoute, /status: 503[\s\S]*cacheControl: "no-store"/);
assert.match(coreRoute, /getAllPosts\(\)\.filter\(\(post\) => !post\.noindex\)/);
assert.match(shardRoute, /readNationalNutritionSitemapItems/);
assert.match(shardRoute, /pageSize: NUTRITION_SITEMAP_PAGE_SIZE/);
assert.match(shardRoute, /notFound\(\)/);
assert.match(shardRoute, /dynamic = "force-dynamic"/);
assert.match(db, /SELECT COUNT\(DISTINCT food_code\) AS total_count/);
// lastmod comes from the same representative row as the detail page.
assert.match(db, /SELECT food_code, updated_at, ROW_NUMBER\(\) OVER \([\s\S]*WHERE row_rank = 1\s+ORDER BY food_code ASC\s+LIMIT \? OFFSET \?/);
assert.match(xml, /escapeXml/);
assert.match(xml, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.match(robots, /sitemap: absoluteUrl\("\/sitemap\.xml"\)/);

console.log("sitemap sharding boundary: 15 assertions passed");
