import { cache } from "react";
import {
  listNationalNutritionGroups,
  readNationalNutritionGroupBases,
  readNationalNutritionGroupItems,
} from "./national-nutrition-db";
import { analyzeGroup, comparableCountsByGroup, groupDuplicateKey, groupSlug, MIN_GROUP_SIZE, type GroupDataset } from "./nutrition-group";
import type { NationalNutritionItem } from "./national-nutrition-api";

// One aggregate query per render resolves slug -> group name and enforces the
// minimum-size gate (smaller groups have no page).
export const loadGroups = cache((dataset: GroupDataset) => listNationalNutritionGroups(dataset, MIN_GROUP_SIZE));

// Groups whose page is indexable: at least MIN_GROUP_SIZE records share one
// comparable basis. Sitemap and the group index list only these.
export const loadPublishableGroups = cache(async (dataset: GroupDataset) => {
  const [groups, bases] = await Promise.all([loadGroups(dataset), readNationalNutritionGroupBases(dataset)]);
  const comparable = comparableCountsByGroup(bases);
  return groups.filter((group) => (comparable.get(group.name) ?? 0) >= MIN_GROUP_SIZE);
});

export const resolveGroup = cache(async (dataset: GroupDataset, slug: string) => {
  const groups = await loadGroups(dataset);
  return groups.find((group) => groupSlug(group.name) === slug) ?? null;
});

export const loadGroupItems = cache((dataset: GroupDataset, name: string) => readNationalNutritionGroupItems(dataset, name));

export async function groupLinkFor(dataset: string, representativeFood: string) {
  if (!representativeFood.trim()) return null;
  try {
    // Same publish rule as the sitemap and the group page, scoped to one group.
    const bases = await readNationalNutritionGroupBases(dataset as GroupDataset, representativeFood);
    const comparable = comparableCountsByGroup(bases).get(representativeFood) ?? 0;
    // Shown count matches the group page header (all stored records of the group).
    return comparable >= MIN_GROUP_SIZE ? { href: `/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(representativeFood))}`, count: bases.length } : null;
  } catch {
    return null;
  }
}

export type GroupContextRow = { key: string; label: string; unit: string; value: number | null; min: number | null; median: number | null; max: number | null; n: number };
// count: 저장된 전체 자료 수, comparableCount: 중복·단위 문제를 뺀 비교 대상 수(성분별 유효 자료 수 n은 rows).
export type GroupContext = { href: string; name: string; count: number; comparableCount: number; basisLabel: string; rows: GroupContextRow[] };

// Where one record sits within its publishable food group, on the group's
// comparable basis. Descriptive context only (median and range), not a rank.
export async function groupContextFor(dataset: GroupDataset, item: NationalNutritionItem): Promise<GroupContext | null> {
  const name = item.representativeFood.trim();
  if (!name) return null;
  try {
    const items = await loadGroupItems(dataset, name);
    const analysis = analyzeGroup(items);
    if (analysis.comparable.length < MIN_GROUP_SIZE) return null;
    // A duplicate record is represented by the identical row kept in the table.
    const own = analysis.comparable.find((row) => row.item.foodCode === item.foodCode)
      ?? analysis.comparable.find((row) => groupDuplicateKey(row.item) === groupDuplicateKey(item));
    if (!own) return null;
    return {
      href: `/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(name))}`,
      name,
      count: items.length,
      comparableCount: analysis.comparable.length,
      basisLabel: analysis.basisLabel,
      rows: analysis.stats.map((stat) => ({ ...stat, value: own.values[stat.key].value })),
    };
  } catch {
    return null;
  }
}
