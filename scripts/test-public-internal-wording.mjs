import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// 독자가 아닌 제작·운영자에게 말하는 표현이 공개 본문에 남지 않도록 막는다
const INTERNAL = /pSEO|programmatic|템플릿|검수 ?지시|콘텐츠 제작|제작자|운영자|기획 ?의도|TODO|FIXME|lorem|자리표시|프롬프트|non_overlap|evidence_plan/i;

let postCount = 0;
for (const file of readdirSync("content/blog").filter((name) => name.endsWith(".json"))) {
  const parsed = JSON.parse(readFileSync(`content/blog/${file}`, "utf8"));
  for (const post of Array.isArray(parsed) ? parsed : [parsed]) {
    postCount += 1;
    assert.ok(!INTERNAL.test(JSON.stringify(post)), `${file}/${post.slug}: internal wording in post`);
  }
}
assert.ok(postCount > 0, "scanned zero JSON posts");

// seedBlogPosts와 홈·목록·정책 안내 문구
const surfaces = ["lib/blog.ts", "app/page.tsx", "app/blog/page.tsx", "app/about/page.tsx", "app/editorial-policy/page.tsx"];
for (const file of surfaces) {
  const match = INTERNAL.exec(readFileSync(file, "utf8"));
  assert.equal(match, null, `${file}: internal wording "${match?.[0]}"`);
}

console.log(`public internal wording: ${postCount} JSON posts and ${surfaces.length} surfaces are clean`);
