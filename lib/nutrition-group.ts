import type { NationalNutritionItem } from "./national-nutrition-api";
import { normalizeNutrientForComparison, parseServingBasis, type ComparisonBasis } from "./nutrition-comparison";

// Groups are only published where a same-dimension comparison is meaningful.
export const GROUP_DATASETS = ["food", "process", "material"] as const;
export type GroupDataset = (typeof GROUP_DATASETS)[number];
export const MIN_GROUP_SIZE = 5;

export const GROUP_NUTRIENTS = [
  { key: "energy", label: "열량", unit: "kcal" },
  { key: "protein", label: "단백질", unit: "g" },
  { key: "fat", label: "지방", unit: "g" },
  { key: "carbs", label: "탄수화물", unit: "g" },
  { key: "sugars", label: "당류", unit: "g" },
  { key: "sodium", label: "나트륨", unit: "mg" },
] as const;

export function isGroupDataset(value: string): value is GroupDataset {
  return (GROUP_DATASETS as readonly string[]).includes(value);
}

// URL-safe, stable slug for a representative-food name. "/" and spaces would
// otherwise produce ambiguous or double-encoded paths.
export function groupSlug(name: string) {
  return name.trim().replace(/[\s/\\?#%&+]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export type GroupValue = { value: number | null; reason: string };
export type GroupRow = { item: NationalNutritionItem; values: Record<string, GroupValue> };
export type GroupStat = { key: string; label: string; unit: string; n: number; min: number | null; median: number | null; max: number | null };

export type GroupAnalysis = {
  basis: "per100g" | "per100ml";
  basisLabel: string;
  comparable: GroupRow[];
  otherDimension: NationalNutritionItem[];
  unsupportedBasis: NationalNutritionItem[];
  stats: GroupStat[];
};

export function analyzeGroup(items: NationalNutritionItem[]): GroupAnalysis {
  const mass: NationalNutritionItem[] = [];
  const volume: NationalNutritionItem[] = [];
  const unsupportedBasis: NationalNutritionItem[] = [];
  for (const item of items) {
    const dimension = parseServingBasis(item.servingUnit).dimension;
    if (dimension === "mass") mass.push(item);
    else if (dimension === "volume") volume.push(item);
    else unsupportedBasis.push(item);
  }
  // Compare within the dominant dimension; never convert g <-> ml.
  const useVolume = volume.length > mass.length;
  const basis: ComparisonBasis & ("per100g" | "per100ml") = useVolume ? "per100ml" : "per100g";
  const primary = useVolume ? volume : mass;
  const otherDimension = useVolume ? mass : volume;

  const comparable: GroupRow[] = primary.map((item) => ({
    item,
    values: Object.fromEntries(GROUP_NUTRIENTS.map((nutrient) => {
      const result = normalizeNutrientForComparison({
        rawValue: item[nutrient.key],
        unit: nutrient.unit,
        servingUnit: item.servingUnit,
        energy: item.energy,
        basis,
      });
      return [nutrient.key, { value: result.displayValue, reason: result.refusalReason }];
    })),
  }));

  const stats = GROUP_NUTRIENTS.map((nutrient) => {
    const values = comparable
      .map((row) => row.values[nutrient.key].value)
      .filter((value): value is number => value !== null && Number.isFinite(value))
      .sort((a, b) => a - b);
    return {
      ...nutrient,
      n: values.length,
      min: values.length ? values[0] : null,
      median: values.length ? median(values) : null,
      max: values.length ? values[values.length - 1] : null,
    };
  });

  return { basis, basisLabel: useVolume ? "100ml당" : "100g당", comparable, otherDimension, unsupportedBasis, stats };
}

function median(sorted: number[]) {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function formatGroupNumber(value: number | null, unit: string) {
  if (value === null || !Number.isFinite(value)) return "계산 불가";
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} ${unit}`;
}

// Per group, the number of records in its dominant comparable dimension —
// the same rule analyzeGroup uses to build the table.
export function comparableCountsByGroup(rows: { name: string; servingUnit: string }[]) {
  const tally = new Map<string, { mass: number; volume: number }>();
  for (const row of rows) {
    const dimension = parseServingBasis(row.servingUnit).dimension;
    if (dimension === "unsupported") continue;
    const entry = tally.get(row.name) ?? { mass: 0, volume: 0 };
    entry[dimension] += 1;
    tally.set(row.name, entry);
  }
  return new Map([...tally].map(([name, { mass, volume }]) => [name, volume > mass ? volume : mass]));
}
