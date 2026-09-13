export function createEmptyNutritionFailure<TDataset, TItem>(
  dataset: TDataset,
  status: number,
  message: string,
) {
  return {
    ok: false as const,
    status,
    dataset,
    totalCount: 0,
    count: 0,
    foods: [] as TItem[],
    message,
  };
}
