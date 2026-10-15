import assert from "node:assert/strict";
import { isReviewPublic, normalizeLoadedReview } from "../lib/blog-visibility.ts";

// 파일에서 불러온 글: approved 외의 모든 값은 pending(비공개)으로 처리한다
assert.equal(normalizeLoadedReview("approved"), "approved");
for (const value of [undefined, null, "pending", "rejected", "Approved", "approved ", "", 1, true, {}]) {
  assert.equal(normalizeLoadedReview(value), "pending", `loaded review ${JSON.stringify(value)} must fail closed`);
}

// 공개 판정: approved와 코드로 직접 작성한 seed 글(상태 필드 없음)만 공개
assert.equal(isReviewPublic("approved"), true);
assert.equal(isReviewPublic(undefined), true);
for (const value of ["pending", "rejected", "Approved", "", null, 0]) {
  assert.equal(isReviewPublic(value), false, `review ${JSON.stringify(value)} must not be public`);
}

console.log("blog visibility: only approved or code-authored seed posts are public (fail closed)");

// 정적 경계: 로더와 공개 판정이 이 정책 모듈을 쓰고, 'pending이 아니면 공개' 방식으로 돌아가지 않는다
import { readFileSync } from "node:fs";
const blogSource = readFileSync("lib/blog.ts", "utf8");
assert.ok(blogSource.includes("normalizeLoadedReview(post.humanReview)"), "loader must normalize review status");
assert.ok(blogSource.includes("isReviewPublic(post.humanReview)"), "public check must use isReviewPublic");
assert.ok(!/humanReview !== "pending"/.test(blogSource), "must not treat every non-pending value as public");
console.log("blog visibility: lib/blog.ts uses the fail-closed policy");
