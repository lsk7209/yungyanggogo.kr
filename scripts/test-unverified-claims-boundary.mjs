// 근거 없는 리뷰·가격·평가·건강 단정이 코드 경로에 다시 생기지 않는지 확인한다.
// 1) 생성·저장·예약 실행 경로가 존재하지 않음  2) 공개 소스에 단정 문구가 없음
// 3) 결측·단위 공통 파서가 실제 0/결측/미량/단위를 구분함
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "output"].includes(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}
const rel = (file) => path.relative(root, file).replaceAll("\\", "/");
const sourceFiles = ["app", "lib", "components", "public", ".github", "scripts"]
  .flatMap((dir) => (existsSync(path.join(root, dir)) ? walk(path.join(root, dir)) : []))
  .filter((file) => /\.(ts|tsx|mjs|js|json|txt|md|ya?ml|css)$/.test(file))
  .filter((file) => !rel(file).startsWith("scripts/test-")); // 이 검사 자신과 다른 테스트는 제외

// A/B/H: 근거 없는 보충정보 생성·저장·조회·예약 경로가 없다.
const BANNED_PATHS = [
  /nutrition-enrichment/, /FoodEnrichment/, /synthesizeEnrichment/, /readFoodEnrichment/,
  /food_enrichments/, /portal_aggregate/, /enrich:nutrition/, /enrich-nutrition/,
];
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  for (const pattern of BANNED_PATHS) ok(!pattern.test(rel(file)) && !pattern.test(text), `${rel(file)} must not reference ${pattern}`);
}
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
ok(!Object.keys(pkg.scripts).some((name) => /enrich/i.test(name)), "no enrichment npm script");

// 상세페이지는 리뷰·가격·평점·긍정률을 직렬화하지 않는다.
const detail = readFileSync(path.join(root, "app/nutrition-data/[dataset]/[foodCode]/page.tsx"), "utf8");
for (const token of ["reviewScore", "reviewCount", "pricePer100g", "sentimentPositiveRate", "avgPrice", "★"]) {
  ok(!detail.includes(token), `detail page must not contain ${token}`);
}

// G: 근거 없는 건강·식단·보관·가격 단정 문구가 공개 소스에 없다.
const BANNED_CLAIMS = [
  "소비자 체감", "소비자 누적 평점", "실구매자", "긍정적 평가 비율", "평균 유통 가격", "추가 비용 절감",
  "균형 잡힌 한 끼 식단", "혈당 부담 없이", "나트륨 배출", "영양 흡수율", "포만감을 오래",
  "동종 평균 대비", "동일 카테고리 평균 대비", "안심하고 즐기실 수", "실제 유통·소비자 데이터",
];
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  for (const phrase of BANNED_CLAIMS) ok(!text.includes(phrase), `${rel(file)} contains unverified claim "${phrase}"`);
}

// E/F: 결측·미검출·미량·음수와 단위 환산은 공통 파서 기준을 지킨다.
const { parseNutrientValue, parseServingBasis, normalizeNutrientForComparison } = await import("../lib/nutrition-comparison.ts");
const state = (raw, unit = "g") => parseNutrientValue(raw, unit);
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks += 1; };

eq([state("").state, state("").numericValue], ["missing", null], "빈칸은 결측");
eq([state("0").state, state("0").numericValue], ["reported_zero", 0], "실제 0은 0");
eq([state("미검출").state, state("미검출").numericValue], ["not_detected", null], "미검출은 0이 아님");
eq([state("미량").state, state("미량").numericValue], ["trace_or_below_limit", null], "미량은 숫자가 아님");
eq([state("<0.1").state, state("<0.1").numericValue], ["trace_or_below_limit", null], "<0.1은 0.1이 아님");
eq([state("-").state, state("-").numericValue], ["invalid", null], "'-'는 0이 아님");
eq([state("-5").state, state("-5").numericValue], ["invalid", null], "음수는 사용 불가");
eq(state("1306mg", "mg").numericValue, 1306, "단위 접미사는 값에서 제거");

eq(parseServingBasis("1306mg"), { dimension: "mass", amount: 1.306, canonicalUnit: "g" }, "1306mg = 1.306g");
eq(parseServingBasis("12.5g"), { dimension: "mass", amount: 12.5, canonicalUnit: "g" }, "소수 보존");
eq(parseServingBasis("200ml").dimension, "volume", "ml는 부피");
eq(parseServingBasis("").dimension, "unsupported", "기준량 없음은 100g으로 가정하지 않음");
eq(parseServingBasis("1회 제공량").dimension, "unsupported", "숫자 없는 기준량 불가");

const normalize = (basis, extra = {}) => normalizeNutrientForComparison({ rawValue: "10", unit: "g", servingUnit: "200ml", energy: "100", basis, ...extra });
ok(normalize("per100g").displayValue === null, "ml 기준량을 g 환산하지 않음(밀도 근거 없음)");
ok(normalize("per100ml").displayValue === 5, "ml 기준량은 100ml 환산 가능");
ok(normalize("per100g", { servingUnit: "" }).displayValue === null, "기준량 없으면 100g 환산 불가");
ok(normalize("per100kcal", { energy: "0" }).displayValue === null, "0kcal에서 100kcal 환산 안 함");
ok(normalize("per100kcal", { energy: "" }).displayValue === null, "열량 결측에서 100kcal 환산 안 함");
ok(normalize("per100g", { servingUnit: "0g" }).displayValue === null, "기준량 0은 Infinity 대신 환산 불가");
ok(normalize("per100g", { rawValue: "미검출", servingUnit: "100g" }).displayValue === null, "미검출은 환산해도 0이 아님");
for (const basis of ["reported", "per100g", "per100ml", "per100kcal", "perIntake"]) {
  for (const rawValue of ["", "-", "미검출", "<0.1", "-3", "abc"]) {
    const value = normalizeNutrientForComparison({ rawValue, unit: "g", servingUnit: "100g", energy: "0", basis, targetServingUnit: "0g" }).displayValue;
    ok(value === null, `${basis}/${rawValue}: 비정상 입력이 숫자로 표시되지 않음`);
  }
}

console.log(`unverified claims boundary: ${checks} checks passed`);
