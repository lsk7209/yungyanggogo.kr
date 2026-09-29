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

export type ComparisonAmountUnit = "g" | "ml";

// Split a legacy "120g" / "300ml" amount into number + unit for the form.
export function splitComparisonAmount(amount: string): { value: string; unit: ComparisonAmountUnit } {
  const match = amount.trim().match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);
  if (!match) return { value: "120", unit: "g" };
  return { value: match[1], unit: match[2].toLowerCase() as ComparisonAmountUnit };
}

// Accept either the separated form fields (amountValue + amountUnit) or the
// legacy shared-URL `amount=120g`, always producing the legacy serialization.
export function resolveComparisonAmount({
  amount,
  amountValue,
  amountUnit,
}: {
  amount?: string;
  amountValue?: string;
  amountUnit?: string;
}): { targetServingUnit: string; invalidInput: boolean } {
  if (amountValue === undefined && amountUnit === undefined) {
    return { targetServingUnit: normalizeComparisonAmount(amount), invalidInput: false };
  }
  const value = (amountValue || "").trim();
  const unit = (amountUnit || "").trim().toLowerCase();
  const numeric = Number(value);
  if (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(numeric) || numeric <= 0 || numeric > 100_000 || (unit !== "g" && unit !== "ml")) {
    return { targetServingUnit: normalizeComparisonAmount(amount), invalidInput: true };
  }
  return { targetServingUnit: `${String(numeric)}${unit}`, invalidInput: false };
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


export type ComparisonState = { refs: ComparisonItemRef[]; basis: ComparisonBasis; targetServingUnit: string };

// Server-side reader for the shared comparison state in page searchParams.
export function readComparisonState(params: {
  item?: string | string[];
  basis?: string;
  amount?: string;
  amountValue?: string;
  amountUnit?: string;
} | undefined) {
  const requested = Array.isArray(params?.item) ? params.item : params?.item ? [params.item] : [];
  const selection = parseComparisonSelection(requested);
  const amount = resolveComparisonAmount({ amount: params?.amount, amountValue: params?.amountValue, amountUnit: params?.amountUnit });
  return {
    selection,
    invalidAmountInput: amount.invalidInput,
    state: {
      refs: selection.selectedRefs,
      basis: parseComparisonBasis(params?.basis),
      targetServingUnit: amount.targetServingUnit,
    } satisfies ComparisonState,
  };
}

// Carry comparison state only while something is selected, so plain browsing
// URLs stay clean and canonical-friendly.
export function withOptionalComparisonState(href: string, state: ComparisonState) {
  return state.refs.length > 0 ? withComparisonState(href, state) : href;
}

// Explicit source scope parameter: only the allow-listed "upstream" is kept.
export function parseSearchSource(value: string | undefined): "stored" | "upstream" {
  return value === "upstream" ? "upstream" : "stored";
}

export function buildDatasetSearchHref(
  dataset: NationalNutritionDatasetSlug,
  { query, source, page }: { query?: string; source?: "stored" | "upstream"; page?: number },
) {
  const params = new URLSearchParams();
  if (page && page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  if (source === "upstream") params.set("source", "upstream");
  const search = params.toString();
  return `/nutrition-data/${dataset}${search ? `?${search}` : ""}`;
}