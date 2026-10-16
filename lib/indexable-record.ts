import type { NationalNutritionItem } from "./national-nutrition-api";

// 색인·광고 공통 기준: 화면에 읽을 만한 영양 자료가 있는 상세만 대상으로 한다.
export const CORE_NUTRIENTS = ["energy", "protein", "fat", "carbs", "sugars", "sodium"] as const;
export const MIN_CORE_NUTRIENTS = 3;

export function hasEnoughCoreNutrients(item: Pick<NationalNutritionItem, (typeof CORE_NUTRIENTS)[number]>) {
  return CORE_NUTRIENTS.filter((key) => item[key].trim() !== "").length >= MIN_CORE_NUTRIENTS;
}

// 사이트맵 SQL용 동일 조건(컬럼명은 CORE_NUTRIENTS와 같다).
export const CORE_NUTRIENTS_SQL = `(${CORE_NUTRIENTS.map((key) => `(TRIM(${key}) <> '')`).join(" + ")}) >= ${MIN_CORE_NUTRIENTS}`;
