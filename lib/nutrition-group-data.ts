import { cache } from "react";
import {
  countNationalNutritionGroupItems,
  listNationalNutritionGroups,
  readNationalNutritionGroupItems,
} from "./national-nutrition-db";
import { groupSlug, MIN_GROUP_SIZE, type GroupDataset } from "./nutrition-group";

// One aggregate query per render resolves slug -> group name and enforces the
// minimum-size gate (smaller groups have no page).
export const loadGroups = cache((dataset: GroupDataset) => listNationalNutritionGroups(dataset, MIN_GROUP_SIZE));

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
