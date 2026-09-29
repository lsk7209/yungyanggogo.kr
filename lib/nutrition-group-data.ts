import { cache } from "react";
import {
  countNationalNutritionGroupItems,
  listNationalNutritionGroups,
  readNationalNutritionGroupBases,
  readNationalNutritionGroupItems,
} from "./national-nutrition-db";
import { analyzeGroup, comparableCountsByGroup, groupSlug, MIN_GROUP_SIZE, type GroupDataset } from "./nutrition-group";
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
    const count = await countNationalNutritionGroupItems(dataset as GroupDataset, representativeFood);
    return count >= MIN_GROUP_SIZE ? { href: `/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(representativeFood))}`, count } : null;
  } catch {
    return null;
  }
}

export type GroupContextRow = { key: string; label: string; unit: string; value: number | null; min: number | null; median: number | null; max: number | null; n: number };
export type GroupContext = { href: string; name: string; count: number; basisLabel: string; rows: GroupContextRow[] };

// Where one record sits within its publishable food group, on the group's
// comparable basis. Descriptive context only (median and range), not a rank.
export async function groupContextFor(dataset: GroupDataset, item: NationalNutritionItem): Promise<GroupContext | null> {
  const name = item.representativeFood.trim();
  if (!name) return null;
  try {
    const items = await loadGroupItems(dataset, name);
    const analysis = analyzeGroup(items);
    if (analysis.comparable.length < MIN_GROUP_SIZE) return null;
    const own = analysis.comparable.find((row) => row.item.foodCode === item.foodCode);
    if (!own) return null;
    return {
      href: `/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(name))}`,
      name,
      count: items.length,
      basisLabel: analysis.basisLabel,
      rows: analysis.stats.map((stat) => ({ ...stat, value: own.values[stat.key].value })),
    };
  } catch {
    return null;
  }
}
