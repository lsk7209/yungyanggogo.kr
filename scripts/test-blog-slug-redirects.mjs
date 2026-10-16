import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BLOG_SLUG_REDIRECTS, BLOG_SLUG_RENAMES } from "../lib/blog-slug-redirects.ts";

const posts = JSON.parse(readFileSync("content/blog/approved-editorial-2026-09-13.json", "utf8"));
const slugs = new Set(posts.map((post) => post.slug));
for (const [from, to] of Object.entries(BLOG_SLUG_RENAMES)) {
  assert.ok(from.startsWith("phase6t-") && !to.includes("phase6t"), `${from} → ${to}`);
  assert.ok(slugs.has(to) && !slugs.has(from), `공개 글은 새 주소만 가진다: ${to}`);
}
assert.ok(BLOG_SLUG_REDIRECTS.every((r) => r.permanent && r.source.startsWith("/blog/phase6t-") && r.destination.startsWith("/blog/")));
assert.equal(new Set(Object.values(BLOG_SLUG_RENAMES)).size, Object.keys(BLOG_SLUG_RENAMES).length, "새 주소 중복 없음");
assert.ok(!JSON.stringify(posts).includes("/blog/phase6t-"), "본문 내부 링크에 옛 주소가 남지 않는다");
assert.ok(readFileSync("next.config.ts", "utf8").includes("BLOG_SLUG_REDIRECTS"));

console.log("blog slug redirects: 21 assertions passed");
