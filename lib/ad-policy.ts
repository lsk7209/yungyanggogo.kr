// 광고는 사람이 쓴 글(블로그 글)에서만 요청한다. 표·정형 문구 위주의 식품 상세는 제외한다.
const eligiblePatterns = [
  /^\/blog\/[^/]+$/
];

export function canRequestAdsForPath(pathname: string) {
  return eligiblePatterns.some((pattern) => pattern.test(pathname));
}

export function isAdsenseRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
}
