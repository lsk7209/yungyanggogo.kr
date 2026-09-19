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

export function toggleComparisonSelection(values: string[], value: string, checked: boolean) {
  // An over-limit URL shows only the first three. Do not resurrect its hidden
  // fourth value when the user removes one of the displayed selections.
  const current = parseComparisonSelection(values).selectedRefs.map((ref) => ref.value).filter((item) => item !== value);
  if (checked) current.push(value);
  return parseComparisonSelection(current).selectedRefs;
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
  options?: { basis: ComparisonBasis; targetServingUnit: string },
) {
  if (options) return withComparisonState(`/nutrition-data/${dataset}`, { refs, ...options });
  const params = new URLSearchParams();
  refs.forEach((ref) => params.append("item", ref.value));
  const query = params.toString();
  return `/nutrition-data/${dataset}${query ? `?${query}` : ""}`;
}

export function withComparisonState(href: string, {
  refs, basis, targetServingUnit,
}: { refs: ComparisonItemRef[]; basis: ComparisonBasis; targetServingUnit: string }) {
  const url = new URL(href, "https://local.invalid");
  url.searchParams.delete("item");
  parseComparisonSelection(refs.map((ref) => ref.value)).selectedRefs.forEach((ref) => url.searchParams.append("item", ref.value));
  url.searchParams.set("basis", parseComparisonBasis(basis));
  url.searchParams.set("amount", normalizeComparisonAmount(targetServingUnit));
  return `${url.pathname}?${url.searchParams}${url.hash}`;
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
