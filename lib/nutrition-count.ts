export function resolveNationalNutritionDbTotalCount(
  storedCount: unknown,
  visibleRowCount: number,
) {
  if (storedCount === null || storedCount === undefined || storedCount === "") {
    return visibleRowCount;
  }
  const parsed = Number(storedCount);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : visibleRowCount;
}
