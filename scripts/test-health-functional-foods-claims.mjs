import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 검색 기능이 없는 미리보기 페이지가 검색·서버 필터링을 약속하지 않도록 막는다
const page = readFileSync("app/health-functional-foods/page.tsx", "utf8");
assert.ok(!/<form|<input|서버 필터링|전체 품목 검색은 준비 중/.test(page), "preview page must not promise search or server-side filtering");
assert.ok(/검색 기능이 없고/.test(page), "FAQ must state this is a preview without search");
assert.ok(/foodsafetykorea\.go\.kr/.test(page), "official lookup path must be provided");
assert.ok(/endIdx: 12/.test(page), "preview range stays bounded");
console.log("health functional foods: page claims match preview-only behavior");
