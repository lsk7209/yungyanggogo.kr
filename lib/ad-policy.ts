const eligiblePatterns = [
  /^\/nutrition-data\/(?:all|food|process|material|health)\/[^/]+$/
];

export function canRequestAdsForPath(pathname: string) {
  return eligiblePatterns.some((pattern) => pattern.test(pathname));
}

export function isAdsenseRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
}
