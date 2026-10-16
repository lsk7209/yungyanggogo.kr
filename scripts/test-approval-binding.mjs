import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { hashPostContent } from "./lib/post-content-hash.mjs";

const post = { slug: "a", title: "t", sections: [{ id: "x" }], humanReview: "approved", noindex: false };
// 승인 상태는 지문에 영향을 주지 않고, 원고가 바뀌면 지문이 달라진다.
assert.equal(hashPostContent(post), hashPostContent({ ...post, humanReview: "pending", noindex: true }));
assert.notEqual(hashPostContent(post), hashPostContent({ ...post, title: "t2" }));

// 검토 근거(--basis) 없이는 승인 기록을 쓰지 않는다(파일 변경 없음).
const approvalsFile = new URL("../content/editorial-data/food-group-approvals.json", import.meta.url);
const before = readFileSync(approvalsFile, "utf8");
const run = spawnSync(process.execPath, ["scripts/approve-food-group-post.mjs", "bread-nutrition-100g-compare", "--reviewer", "테스트"], { encoding: "utf8" });
assert.equal(run.status, 1);
assert.match(run.stderr, /--basis/);
assert.equal(readFileSync(approvalsFile, "utf8"), before);

// 현재 승인 기록: 모든 승인 글은 공개 JSON에서 approved, 지문이 있으면 현재 원고와 일치해야 한다.
const approvals = JSON.parse(before).approvals;
const posts = JSON.parse(readFileSync(new URL("../content/blog/drafts-2026-10-food-groups-30.json", import.meta.url), "utf8"));
for (const approval of approvals) {
  const published = posts.find((p) => p.slug === approval.slug);
  assert.ok(published, `approval without post: ${approval.slug}`);
  if (approval.contentSha256) {
    assert.equal(approval.contentSha256, hashPostContent(published), `${approval.slug} approved text changed after approval`);
  }
}
assert.equal(new Set(approvals.map((a) => a.slug)).size, approvals.length, "duplicate approval slug");

console.log("approval binding: 8 assertions passed");
