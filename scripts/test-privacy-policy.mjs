import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/privacy/page.tsx", "utf8");
for (const [label, needle] of [
  ["Google 광고 설정(맞춤 광고 해제)", "https://www.google.com/settings/ads"],
  ["aboutads 해제 경로", "aboutads.info/choices"],
  ["Google 데이터 사용 안내", "policies.google.com/technologies/partner-sites"],
  ["제3자 쿠키 사용 고지", "제3자 광고 제공업체는 쿠키"],
  ["분석·광고 도구 구분", "Google Analytics"],
  ["개정일 표기", "2026년 10월 16일"],
  ["문의 이메일 링크", "mailto:${siteConfig.contactEmail}"]
]) {
  assert.ok(page.includes(needle), `privacy policy must include: ${label}`);
}
console.log("privacy policy: ad cookie, opt-out, data-use and revision disclosures present");
