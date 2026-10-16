import type { NutritionDataProvenance } from "./national-nutrition-db";

export const PROVENANCE_MISSING = "정보 없음";
export const PROVENANCE_NOT_STORED = "저장하지 않고 원천에서 직접 조회한 자료";

const SOURCE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// 원자료 기준일은 날짜만 있는 값이라 시간대를 붙이지 않는다. 달력에 없는 날짜는 없는 값으로 본다.
export function formatSourceDate(value: string | null | undefined) {
  const match = SOURCE_DATE.exec((value ?? "").trim());
  if (!match) return PROVENANCE_MISSING;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? match[0] : PROVENANCE_MISSING;
}

// 영양고고가 DB에 저장한 시각(ISO). 원자료 기준일·페이지 조회 시각과 별개의 값이다.
export function formatStoredAt(iso: string | null | undefined) {
  const timestamp = Date.parse(iso ?? "");
  if (!Number.isFinite(timestamp)) return PROVENANCE_MISSING;
  return `${new Date(timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" })} (KST)`;
}

export function describeProvenance(provenance: NutritionDataProvenance) {
  return {
    sourceDate: formatSourceDate(provenance.sourceUpdatedAt),
    storedAt: provenance.source === "stored" ? formatStoredAt(provenance.storedAt) : PROVENANCE_NOT_STORED,
  };
}
