import type { NationalNutritionItem } from "./national-nutrition-api";

// 같은 식품코드가 서로 다른 데이터셋에 있을 때 같은 자료인지 판정한다.
// 코드가 같다는 이유만으로 합치지 않고, 값이 실제로 같은 경우만 "동일 수치"로 본다.
export type RecordIdentity =
  | "same-record" // 기준량·영양성분·제품명이 모두 같음
  | "same-values-different-name" // 수치는 같지만 제품명 표기가 다름(확인 필요)
  | "different-data" // 같은 코드지만 값이 다른 별개 자료
  | "insufficient"; // 판정할 수 있는 영양값이 부족함

const COMPARED_FIELDS = [
  "servingUnit", "energy", "water", "protein", "fat", "carbs", "sugars", "fiber", "calcium",
  "iron", "potassium", "sodium", "vitaminA", "vitaminC", "vitaminD", "saturatedFat", "transFat",
] as const satisfies readonly (keyof NationalNutritionItem)[];

// 판정에 필요한 최소 영양값 개수(기준량 제외)
const MIN_COMPARABLE_VALUES = 3;

const normalizeName = (name: string) => name.replace(/\s+/g, "").toLowerCase();
const normalizeValue = (value: string) => {
  const trimmed = value.trim().replace(/,/g, "");
  const numeric = Number(trimmed);
  return trimmed !== "" && Number.isFinite(numeric) ? String(numeric) : trimmed.toLowerCase().replace(/\s+/g, "");
};

export function classifyRecordIdentity(a: NationalNutritionItem, b: NationalNutritionItem): RecordIdentity | null {
  if (!a.foodCode || a.foodCode !== b.foodCode) return null;
  let bothPresent = 0;
  for (const field of COMPARED_FIELDS) {
    const left = normalizeValue(a[field]);
    const right = normalizeValue(b[field]);
    if (left && right) {
      if (left !== right) return "different-data";
      if (field !== "servingUnit") bothPresent += 1;
    } else if (left || right) {
      // 한쪽에만 값이 있으면 같은 자료라고 단정하지 않는다.
      return "different-data";
    }
  }
  if (bothPresent < MIN_COMPARABLE_VALUES) return "insufficient";
  return normalizeName(a.name) === normalizeName(b.name) ? "same-record" : "same-values-different-name";
}


// 비교 목록 안에서 식품코드가 같은 항목 쌍을 찾아 판정 결과를 돌려준다.
export function findSameCodePairs<T extends { value: string; item: NationalNutritionItem }>(entries: T[]) {
  const pairs: { first: T; second: T; identity: RecordIdentity }[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const identity = classifyRecordIdentity(entries[i].item, entries[j].item);
      if (identity) pairs.push({ first: entries[i], second: entries[j], identity });
    }
  }
  return pairs;
}
