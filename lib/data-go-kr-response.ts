type RawItem = Record<string, string | number | null | undefined>;

export function extractStandardDataGoKrItems<T extends RawItem>(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return emptyStandardDataGoKrExtract<T>();
  }

  // Accept both `{ response: { header, body } }` and the unwrapped `{ header, body }`
  // shape that the provider currently returns.
  const wrapped = (payload as { response?: unknown }).response;
  const response = wrapped && typeof wrapped === "object"
    ? wrapped
    : "header" in (payload as object) || "body" in (payload as object) ? payload : null;
  if (!response || typeof response !== "object") {
    return emptyStandardDataGoKrExtract<T>();
  }

  const header = (response as { header?: { resultCode?: string; resultMsg?: string } }).header;
  const body = (response as { body?: unknown }).body;
  const bodyRecord =
    body && typeof body === "object"
      ? (body as { items?: unknown; totalCount?: number | string })
      : null;
  const items = bodyRecord?.items;
  const item =
    items && typeof items === "object" && !Array.isArray(items) && "item" in items
      ? (items as { item?: unknown }).item
      : items;
  const rows = Array.isArray(item)
    ? (item as T[])
    : item && typeof item === "object"
      ? [item as T]
      : [];

  return {
    rows,
    // Keep the reported value separate from the legacy page-length fallback.
    reportedTotalCount: bodyRecord?.totalCount ?? null,
    totalCount: toNonNegativeCount(bodyRecord?.totalCount, rows.length),
    resultCode: header?.resultCode || "",
    resultMessage: header?.resultMsg || ""
  };
}

function emptyStandardDataGoKrExtract<T extends RawItem>() {
  return {
    rows: [] as T[],
    reportedTotalCount: null,
    totalCount: 0,
    resultCode: "",
    resultMessage: ""
  };
}

function toNonNegativeCount(value: unknown, fallback: number) {
  if (value === "" || value == null) return fallback;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : fallback;
}
