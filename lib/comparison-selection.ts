import type { NationalNutritionDatasetSlug } from "./national-nutrition-api";
import type { ComparisonBasis } from "./nutrition-comparison";

export type ComparisonItemRef = {
  dataset: NationalNutritionDatasetSlug;
  foodCode: string;
  value: string;
};

const DATASETS = new Set<NationalNutritionDatasetSlug>(["all", "food", "process", "material", "health"]);
const BASES = new Set<ComparisonBasis>(["reported", "per100g", "per100ml", "per100kcal", "perIntake"]);

export function parseComparisonSelection(values: string[], maximum = 3) {
  const seen = new Set<string>();
  const refs: ComparisonItemRef[] = [];
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const rawValue of values) {
    const separator = rawValue.indexOf("|");
    if (separator <= 0) {
      invalidCount += 1;
      continue;
    }
    const dataset = rawValue.slice(0, separator).trim() as NationalNutritionDatasetSlug;
    const foodCode = rawValue.slice(separator + 1).trim().slice(0, 160);
    if (!DATASETS.has(dataset) || !foodCode || /[\u0000-\u001f\u007f]/.test(foodCode)) {
      invalidCount += 1;
      continue;
    }
    const value = `${dataset}|${foodCode}`;
    if (seen.has(value)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(value);
    refs.push({ dataset, foodCode, value });
  }

  return {
    refs,
    selectedRefs: refs.slice(0, maximum),
    tooMany: refs.length > maximum,
    invalidCount,
    duplicateCount,
  };
}

export function parseComparisonBasis(value: string | undefined): ComparisonBasis {
  return BASES.has(value as ComparisonBasis) ? (value as ComparisonBasis) : "reported";
}

export function normalizeComparisonAmount(value: string | undefined) {
  return (value || "120g").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 24) || "120g";
}

export function buildComparisonItemValue(
  dataset: NationalNutritionDatasetSlug,
  foodCode: string,
) {
  return `${dataset}|${foodCode.trim()}`;
}

export function buildComparisonCollectionHref(
  dataset: NationalNutritionDatasetSlug,
  refs: ComparisonItemRef[],
) {
  const params = new URLSearchParams();
  refs.forEach((ref) => params.append("item", ref.value));
  const query = params.toString();
  return `/nutrition-data/${dataset}${query ? `?${query}` : ""}`;
}

export function buildComparisonHref({
  refs,
  basis,
  targetServingUnit,
  removeValue,
}: {
  refs: ComparisonItemRef[];
  basis: ComparisonBasis;
  targetServingUnit: string;
  removeValue?: string;
}) {
  const params = new URLSearchParams({ basis, amount: targetServingUnit });
  refs
    .filter((ref) => ref.value !== removeValue)
    .forEach((ref) => params.append("item", ref.value));
  return `/compare?${params.toString()}`;
}
