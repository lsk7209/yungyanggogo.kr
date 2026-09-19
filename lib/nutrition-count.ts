export type NutritionCountInfo = {
  totalCount: number | null;
  countScope: "stored" | "source" | "unknown";
  // Observation by this server, including cached responses; not source freshness.
  countCheckedAt: string | null;
  latestStoredAt: string | null;
};

export function parseNutritionTotalCount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+$/.test(value.trim())) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

// Compatibility for the separate product-registration adapter, outside F-006.
export function resolveNationalNutritionDbTotalCount(value: unknown, visibleRowCount: number) {
  if (value === null || value === undefined || value === "") return visibleRowCount;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : visibleRowCount;
}

export function describeNutritionCount(
  result: (Pick<NutritionCountInfo, "totalCount" | "countScope"> & { ok: boolean }) | null,
  filtered = false,
) {
  const unknown = filtered ? "검색 일치 건수 미확인" : "전체 건수 미확인";
  if (!result) return unknown;
  if (!result.ok) return `조회 실패 · ${unknown}`;
  if (result.totalCount === null || result.countScope === "unknown") return unknown;
  const scope = result.countScope === "stored"
    ? (filtered ? "저장 자료 중 검색 일치" : "저장 자료 전체")
    : (filtered ? "원천 응답 기준 검색 일치" : "원천 응답 기준 전체");
  return `${scope} ${result.totalCount.toLocaleString("ko-KR")}건`;
}

export function getNutritionPagination(
  result: { ok: boolean; totalCount: number | null; count: number } | null,
  page: number,
  pageSize: number,
) {
  if (!result?.ok) return { hasNext: false, outOfRange: false };
  return {
    hasNext: result.totalCount === null ? result.count >= pageSize : page * pageSize < result.totalCount,
    outOfRange: result.totalCount !== null && page > 1 && (page - 1) * pageSize >= result.totalCount,
  };
}
