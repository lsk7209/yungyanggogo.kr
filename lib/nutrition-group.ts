import type { NationalNutritionItem } from "./national-nutrition-api";
import { normalizeNutrientForComparison, parseServingBasis, type ComparisonBasis } from "./nutrition-comparison";

// Groups are only published where a same-dimension comparison is meaningful.
export const GROUP_DATASETS = ["food", "process", "material"] as const;
export type GroupDataset = (typeof GROUP_DATASETS)[number];
export const MIN_GROUP_SIZE = 5;
// 검색 색인·사이트맵 기준. 5~9개짜리 소그룹은 페이지·목록은 유지하되 본문이 얇아 noindex,follow로 둔다.
export const MIN_INDEXABLE_GROUP_SIZE = 10;

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
  // Same name, seller, basis and nutrient values as a record already in
  // `comparable` (source rows registered twice under different codes).
  duplicates: NationalNutritionItem[];
  otherDimension: NationalNutritionItem[];
  unsupportedBasis: NationalNutritionItem[];
  stats: GroupStat[];
};

type DuplicateKeySource = Pick<NationalNutritionItem, "name" | "maker" | "restaurant" | "importer" | "servingUnit" | "energy" | "protein" | "fat" | "carbs" | "sugars" | "sodium">;

// Identity of a source record by what a reader sees. Two codes with the same
// key would be counted twice in medians and in the publish gate.
export function groupDuplicateKey(item: DuplicateKeySource) {
  return [item.name, item.maker || item.restaurant || item.importer, item.servingUnit, item.energy, item.protein, item.fat, item.carbs, item.sugars, item.sodium]
    .map((value) => String(value ?? "").trim().replace(/\s+/g, " "))
    .join("\u0001");
}

type Dimension = "mass" | "volume";

// Single publish policy shared by the group page and the publish gate:
// 1) drop repeated records, 2) split by dimension, 3) the dimension with more
// distinct records wins (tie -> mass). Never convert g <-> ml.
export function classifyGroupRows<T extends { servingUnit: string }>(rows: T[], keyOf?: (row: T) => string | undefined) {
  const seen = new Set<string>();
  const kept: Record<Dimension, T[]> = { mass: [], volume: [] };
  const repeated: Record<Dimension, T[]> = { mass: [], volume: [] };
  const unsupported: T[] = [];
  for (const row of rows) {
    const dimension = parseServingBasis(row.servingUnit).dimension;
    if (dimension === "unsupported") {
      unsupported.push(row);
      continue;
    }
    const key = keyOf?.(row);
    if (key !== undefined) {
      if (seen.has(key)) {
        repeated[dimension].push(row);
        continue;
      }
      seen.add(key);
    }
    kept[dimension].push(row);
  }
  const dimension: Dimension = kept.volume.length > kept.mass.length ? "volume" : "mass";
  const other: Dimension = dimension === "volume" ? "mass" : "volume";
  return { dimension, primary: kept[dimension], duplicates: repeated[dimension], otherDimension: [...kept[other], ...repeated[other]], unsupported };
}

export function analyzeGroup(items: NationalNutritionItem[]): GroupAnalysis {
  const classified = classifyGroupRows(items, groupDuplicateKey);
  const useVolume = classified.dimension === "volume";
  const basis: ComparisonBasis & ("per100g" | "per100ml") = useVolume ? "per100ml" : "per100g";
  const { primary, duplicates, otherDimension, unsupported: unsupportedBasis } = classified;

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

  return { basis, basisLabel: useVolume ? "100ml당" : "100g당", comparable, duplicates, otherDimension, unsupportedBasis, stats };
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

// Per group, the number of distinct records in its dominant comparable
// dimension — computed by the same classifier analyzeGroup uses.
// Rows carrying a `duplicateKey` are counted once per key.
export function comparableCountsByGroup(rows: { name: string; servingUnit: string; duplicateKey?: string }[]) {
  const byName = new Map<string, { name: string; servingUnit: string; duplicateKey?: string }[]>();
  for (const row of rows) {
    const group = byName.get(row.name);
    if (group) group.push(row);
    else byName.set(row.name, [row]);
  }
  return new Map([...byName].map(([name, group]) => [name, classifyGroupRows(group, (row) => row.duplicateKey).primary.length]));
}
