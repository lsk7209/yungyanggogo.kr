import assert from "node:assert/strict";
import { formatKoreanDate, getMeaningfulModifiedAt, toIsoDateTime } from "../lib/blog-dates.ts";

const NOW = new Date("2026-10-16T00:00:00+09:00");

// 기계 판독용 ISO: 날짜만 있으면 한국 시간대(+09:00) 자정, 시간대가 있으면 그대로 유지
assert.equal(toIsoDateTime("2026-10-01"), "2026-10-01T00:00:00+09:00");
assert.equal(toIsoDateTime("2026-10-01T09:00:00+09:00"), "2026-10-01T09:00:00+09:00");
assert.equal(toIsoDateTime("2026-10-01T00:00:00Z"), "2026-10-01T00:00:00Z");
for (const bad of [undefined, null, "", "not-a-date", "2026-13-40", "2026-02-30"]) {
  assert.equal(toIsoDateTime(bad), undefined, `invalid date ${JSON.stringify(bad)}`);
}

// 화면 표기: 한국어, 한국 시간 기준 날짜
assert.equal(formatKoreanDate("2026-10-01"), "2026년 10월 1일");
assert.equal(formatKoreanDate("2026-10-01T09:00:00+09:00"), "2026년 10월 1일");
assert.equal(formatKoreanDate("2026-09-30T20:00:00Z"), "2026년 10월 1일");
assert.equal(formatKoreanDate("garbage"), undefined);

// 수정일: 발행일보다 뒤의 실제 수정일만 인정. 만들어내거나 덮어쓰지 않는다
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-10-01T09:00:00+09:00", updatedAt: "2026-09-30" }, NOW), undefined, "원고 수정일이 발행보다 빠르면 수정일 없음");
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-06-06", updatedAt: "2026-06-06" }, NOW), undefined, "같은 날은 수정 없음");
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-06-06", updatedAt: "2026-07-01" }, NOW), "2026-07-01T00:00:00+09:00");
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-06-06", updatedAt: "2026-12-01" }, NOW), undefined, "미래 수정일 제외");
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-06-06", updatedAt: "" }, NOW), undefined);
assert.equal(getMeaningfulModifiedAt({ publishedAt: "bad", updatedAt: "2026-07-01" }, NOW), undefined);
assert.equal(getMeaningfulModifiedAt({ publishedAt: "2026-06-06" }, NOW), undefined);

console.log("blog dates: ISO/Korean formatting and meaningful modified date rules");

// 정적 경계: 공개 출력은 원고 updatedAt을 직접 쓰지 않는다
import { readFileSync } from "node:fs";
for (const file of ["app/blog/[slug]/page.tsx", "app/sitemaps/core.xml/route.ts", "components/PostCard.tsx", "app/feed.xml/route.ts"]) {
  assert.ok(!/post\.updatedAt/.test(readFileSync(file, "utf8")), `${file} must not publish raw post.updatedAt`);
}
console.log("blog dates: no public surface publishes raw updatedAt");
