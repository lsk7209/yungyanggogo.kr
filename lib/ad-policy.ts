import type { NationalNutritionItem } from "./national-nutrition-api";

const eligiblePatterns = [
  /^\/nutrition-data\/(?:all|food|process|material|health)\/[^/]+$/
];

// 광고를 요청하려면 화면에 읽을 만한 영양 자료가 있어야 한다. 값이 거의 없는 상세는 제외한다.
const CORE_NUTRIENTS = ["energy", "protein", "fat", "carbs", "sugars", "sodium"] as const;
const MIN_CORE_NUTRIENTS = 3;

export function canRequestAdsForPath(pathname: string) {
  return eligiblePatterns.some((pattern) => pattern.test(pathname));
}

export function canRequestAdsForRecord(item: NationalNutritionItem, { synthetic }: { synthetic: boolean }) {
  if (synthetic) return false;
  const present = CORE_NUTRIENTS.filter((key) => item[key].trim() !== "").length;
  return present >= MIN_CORE_NUTRIENTS;
}

export function isAdsenseRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
}
