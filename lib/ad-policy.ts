import { hasEnoughCoreNutrients } from "./indexable-record.ts";
import type { NationalNutritionItem } from "./national-nutrition-api";

const eligiblePatterns = [
  /^\/nutrition-data\/(?:all|food|process|material|health)\/[^/]+$/
];

export function canRequestAdsForPath(pathname: string) {
  return eligiblePatterns.some((pattern) => pattern.test(pathname));
}

export function canRequestAdsForRecord(item: NationalNutritionItem, { synthetic }: { synthetic: boolean }) {
  if (synthetic) return false;
  return hasEnoughCoreNutrients(item);
}

export function isAdsenseRuntimeEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
}
