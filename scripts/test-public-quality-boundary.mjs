import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicFiles = [
  "app/page.tsx",
  "app/rankings/page.tsx",
  "app/nutrition-data/page.tsx",
  "app/nutrition-data/[dataset]/page.tsx",
  "app/health-functional-foods/page.tsx",
  "app/health-functional-food-nutrition/page.tsx",
  "app/api/foods/route.ts",
  "app/api/nutrition-data/route.ts",
  "app/api/health-functional-foods/route.ts",
  "app/api/health-functional-food-nutrition/route.ts"
];

const source = publicFiles.map((file) => readFileSync(file, "utf8")).join("\n");
for (const forbidden of [
  "API 키 설정 필요",
  "서버 환경변수",
  "개발계정 | 활용신청",
  "Encoding/Decoding 인증키",
  "100g당 20g",
  "100kcal당 10g",
  "동일군 하위 22%",
  "동일 카테고리 단백질 백분위"
]) {
  assert.ok(!source.includes(forbidden), `public source must not include operator/unverified copy: ${forbidden}`);
}

const home = readFileSync("app/page.tsx", "utf8");
assert.ok(home.includes("빈값을 영양성분 0으로 해석하지 않습니다"));
assert.ok(home.includes("확인되지 않은 법정 기준 충족 배지를 표시하지 않습니다"));
assert.ok(home.includes("2~3개 식품을 비교 목록에 담으세요"));
assert.ok(!home.includes("제품 간 자동 정렬·나란히 비교 기능은 제공하지 않습니다"));

console.log("public quality boundary: 12 assertions passed");
