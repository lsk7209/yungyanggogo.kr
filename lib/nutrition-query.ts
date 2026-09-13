export function normalizeNutritionSearchQuery(value: string | null | undefined) {
  return (value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 100);
}

export function parseBoundedPositiveInteger(
  value: string | null | undefined,
  fallback: number,
  maximum: number,
) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}
