import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(url) + extension)) {
          return nextResolve(url.href + extension, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const { appendJosa, getJosa, hasJongseong } = await import("../lib/korean-postposition.ts");
const { synthesizeEnrichmentReport } = await import("../lib/nutrition-enrichment-synthesizer.ts");
const { createClient } = await import("@libsql/client");

let assertions = 0;
function pass(label) {
  assertions += 1;
}

// 1. 한국어 조사 처리 유틸리티 테스트
assert.equal(hasJongseong("신라면"), true);
assert.equal(hasJongseong("사과"), false);
assert.equal(hasJongseong("닭가슴살"), true);
assert.equal(hasJongseong("우유"), false);
pass("hasJongseong discrimination");

assert.equal(appendJosa("신라면", "은/는"), "신라면은");
assert.equal(appendJosa("사과", "은/는"), "사과는");
assert.equal(appendJosa("닭가슴살", "이/가"), "닭가슴살이");
assert.equal(appendJosa("우유", "이/가"), "우유가");
assert.equal(appendJosa("햇반", "을/를"), "햇반을");
assert.equal(appendJosa("바나나", "을/를"), "바나나를");
assert.equal(appendJosa("비빔밥", "과/와"), "비빔밥과");
assert.equal(appendJosa("토스트", "과/와"), "토스트와");
assert.equal(appendJosa("서울", "으로/로"), "서울로"); // 'ㄹ' 받침 예외 처리
assert.equal(appendJosa("부산", "으로/로"), "부산으로");
assert.equal(appendJosa("신라면", "의"), "신라면의");
pass("appendJosa natural postposition attachments");

// 2. 자체 인텔리전스 리포트 합성 엔진 테스트
const mockInsight = {
  foodCode: "TEST-001",
  datasetSlug: "food",
  foodName: "수제 통밀 샌드위치",
  largeCategory: "빵류",
  representativeFood: "샌드위치",
  servingUnit: "150g",
  energy: "320",
  protein: "15",
  fat: "8",
  carbs: "45",
  sugars: "4",
  sodium: "450",
  matchedQuery: "수제 통밀 샌드위치",
  rawPrices: [4500, 5000, 4800],
  reviewCount: 240,
  reviewScore: 4.8,
};

const report = synthesizeEnrichmentReport(mockInsight);

assert.equal(report.status, "enriched");
assert.equal(report.summaryPoints.length, 3);
assert.ok(report.summaryPoints[0].includes("수제 통밀 샌드위치는"));
assert.ok(report.pricePer100g > 0);
assert.ok(report.faqItems.length === 4);

// 조사 검증: '수제 통밀 샌드위치는', '수제 통밀 샌드위치와'
assert.ok(report.faqItems[0].question.includes("수제 통밀 샌드위치는"));
assert.ok(report.faqItems[3].question.includes("수제 통밀 샌드위치와"));

// 저작권 리스크 방어: 외부 이미지 URL이 전혀 없어야 함
const serialized = JSON.stringify(report);
assert.ok(!serialized.includes("http://") && !serialized.includes(".jpg") && !serialized.includes(".png"));
pass("synthesizeEnrichmentReport integrity and zero-image guard");

// 3. 인메모리 SQLite DB 통합 테스트
const memDb = createClient({ url: "file::memory:" });
await memDb.batch([
  `CREATE TABLE IF NOT EXISTS food_enrichments (
    dataset_slug TEXT NOT NULL,
    food_code TEXT NOT NULL,
    food_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    matched_query TEXT,
    review_count INTEGER NOT NULL DEFAULT 0,
    review_score REAL NOT NULL DEFAULT 0,
    avg_price INTEGER NOT NULL DEFAULT 0,
    min_price INTEGER NOT NULL DEFAULT 0,
    price_per_100g INTEGER NOT NULL DEFAULT 0,
    price_level TEXT NOT NULL DEFAULT '표준 가격대',
    sentiment_positive_rate INTEGER NOT NULL DEFAULT 0,
    taste_keywords TEXT NOT NULL DEFAULT '[]',
    texture_keywords TEXT NOT NULL DEFAULT '[]',
    usage_tips TEXT NOT NULL DEFAULT '[]',
    storage_guide TEXT NOT NULL DEFAULT '',
    pairing_recommendation TEXT NOT NULL DEFAULT '',
    target_audience TEXT NOT NULL DEFAULT '',
    summary_points TEXT NOT NULL DEFAULT '[]',
    faq_items TEXT NOT NULL DEFAULT '[]',
    benchmark_price_diff INTEGER NOT NULL DEFAULT 0,
    benchmark_nutrient_summary TEXT NOT NULL DEFAULT '',
    source_platform TEXT NOT NULL DEFAULT 'portal_aggregate',
    skipped_reason TEXT,
    skipped_at TEXT,
    enriched_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dataset_slug, food_code)
  )`,
  `CREATE TABLE IF NOT EXISTS national_nutrition_items (
    dataset_slug TEXT NOT NULL,
    query_key TEXT NOT NULL,
    food_code TEXT NOT NULL,
    food_name TEXT NOT NULL,
    large_category TEXT NOT NULL DEFAULT '',
    representative_food TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (dataset_slug, query_key, food_code)
  )`,
]);

// 시드 및 저장 검증
await memDb.execute({
  sql: `INSERT INTO national_nutrition_items (dataset_slug, query_key, food_code, food_name, large_category, representative_food)
        VALUES ('food', '__default__', 'TEST-001', '수제 통밀 샌드위치', '빵류', '샌드위치')`,
});

await memDb.execute({
  sql: `INSERT INTO food_enrichments (
    dataset_slug, food_code, food_name, status, summary_points, faq_items, price_per_100g, enriched_at
  ) VALUES ('food', 'TEST-001', '수제 통밀 샌드위치', 'enriched', ?, ?, ?, CURRENT_TIMESTAMP)`,
  args: [JSON.stringify(report.summaryPoints), JSON.stringify(report.faqItems), report.pricePer100g],
});

const selectRes = await memDb.execute({
  sql: "SELECT * FROM food_enrichments WHERE food_code = 'TEST-001'",
});
assert.equal(selectRes.rows.length, 1);
assert.equal(selectRes.rows[0].status, "enriched");
pass("SQLite enrichment insertion and selection");

// SkippedAt 마킹 검증
await memDb.execute({
  sql: `INSERT INTO food_enrichments (dataset_slug, food_code, food_name, status, skipped_reason, skipped_at)
        VALUES ('food', 'TEST-002', '미매칭 식품', 'skipped', 'NO_SEARCH_MATCH', CURRENT_TIMESTAMP)`,
});

const skippedRes = await memDb.execute({
  sql: "SELECT * FROM food_enrichments WHERE food_code = 'TEST-002'",
});
assert.equal(skippedRes.rows[0].status, "skipped");
assert.equal(skippedRes.rows[0].skipped_reason, "NO_SEARCH_MATCH");
assert.ok(skippedRes.rows[0].skipped_at !== null);
pass("SkippedAt marking defense");

await memDb.close();

console.log(`food enrichment pipeline: ${assertions} assertions passed`);
