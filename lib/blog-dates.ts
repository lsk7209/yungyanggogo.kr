const KST_OFFSET = "+09:00";
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const KST_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const dateOnly = DATE_ONLY.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const valid = check.getUTCFullYear() === Number(year) && check.getUTCMonth() === Number(month) - 1 && check.getUTCDate() === Number(day);
    return valid ? { iso: `${value}T00:00:00${KST_OFFSET}`, date: new Date(`${value}T00:00:00${KST_OFFSET}`) } : undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : { iso: value, date };
}

// 한국 시간 기준 YYYY-MM-DD
function kstDay(date: Date) {
  return KST_DATE_FORMAT.format(date);
}

// 기계 판독용 ISO 값(날짜만 있으면 한국 시간대 자정으로 간주)
export function toIsoDateTime(value: unknown) {
  return parseDate(value)?.iso;
}

// 화면 표기용 한국어 날짜
export function formatKoreanDate(value: unknown) {
  const parsed = parseDate(value);
  if (!parsed) return undefined;
  const [year, month, day] = kstDay(parsed.date).split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}

// 발행일보다 뒤이고 미래가 아닌 실제 수정일만 반환한다. 없으면 만들어내지 않는다
export function getMeaningfulModifiedAt(post: { publishedAt: string; updatedAt?: string }, now = new Date()) {
  const published = parseDate(post.publishedAt);
  const updated = parseDate(post.updatedAt);
  if (!published || !updated) return undefined;
  if (updated.date.getTime() > now.getTime()) return undefined;
  return kstDay(updated.date) > kstDay(published.date) ? updated.iso : undefined;
}
