import { createHash } from "node:crypto";

// 승인 상태(humanReview·noindex)를 제외한 글 내용의 지문. 승인 시점의 원고와
// 현재 원고가 같은지 확인하는 데 쓴다.
export function hashPostContent(post) {
  const { humanReview, noindex, ...content } = post;
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}
