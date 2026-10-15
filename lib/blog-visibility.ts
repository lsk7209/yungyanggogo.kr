export type BlogReviewStatus = "approved" | "pending";

// 파일에서 불러온 글은 정확히 "approved"일 때만 승인으로 인정한다(그 외는 모두 비공개)
export function normalizeLoadedReview(value: unknown): BlogReviewStatus {
  return value === "approved" ? "approved" : "pending";
}

// 상태 필드가 없는 글은 코드에 직접 작성된 seed 글뿐이다(불러온 글은 정규화되어 항상 값이 있음)
export function isReviewPublic(value: unknown) {
  return value === "approved" || value === undefined;
}
