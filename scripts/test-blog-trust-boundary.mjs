import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const blogDetail = await source("app/blog/[slug]/page.tsx");
const sitemap = await source("app/sitemaps/core.xml/route.ts");
const blogData = await source("lib/blog.ts");

assert.doesNotMatch(blogDetail, /데이터 편집팀/);
assert.doesNotMatch(blogDetail, /<time[^>]*>검토 /);
assert.match(blogDetail, /<time dateTime=\{post\.updatedAt\}>수정 \{post\.updatedAt\}<\/time>/);
assert.doesNotMatch(blogDetail, /author:\s*\{[\s\S]*?데이터 편집팀/);
assert.match(sitemap, /getAllPosts\(\)\.filter\(\(post\) => !post\.noindex\)/);
assert.doesNotMatch(blogData, /충족은 초록색 체크/);
assert.doesNotMatch(blogData, /기준별 랭킹 화면으로 이동/);
assert.match(blogData, /확인되지 않은 법정 기준 배지를 만들지 않습니다/);
assert.match(blogData, /href: "\/nutrition-data"/);
assert.match(blogData, /function isPostPublic\(post: BlogPost\)/);
assert.match(blogData, /\.filter\(\(post\) => options\.includePending \|\| isPostPublic\(post\)\)/);
assert.match(blogData, /return keepUniqueSlugs\(eligiblePosts\)/);
assert.match(blogData, /if \(matches\.length !== 1\)/);

console.log("blog trust boundary: 13 assertions passed");
