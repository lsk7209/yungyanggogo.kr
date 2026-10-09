import { createClient } from "@libsql/client";
import { synthesizeEnrichmentReport, type RawScrapedInsight } from "../lib/nutrition-enrichment-synthesizer";
import { withDbRetry } from "../lib/nutrition-enrichment-db";

// 1. 최신 모바일 브라우저 User-Agent 풀 (12종)
const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.6613.98 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.101 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.103 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 1000; 12.5.2)",
  "Mozilla/5.0 (Linux; Android 14; SM-A546S) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-N986N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/24.0 Chrome/117.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; SM-F946N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.114 Mobile Safari/537.36",
];

// 서킷 브레이커 트리거 키워드 (CAPTCHA, 차단, 봇 방어 실질 문구)
const CIRCUIT_BREAKER_PATTERNS = [
  "자동입력 방지 문자를 입력",
  "비정상적인 접근이 감지",
  "서비스 이용이 일시적으로 제한",
  "접근이 차단되었습니다",
  "cf-challenge-running",
  "g-recaptcha-response",
  "robot check challenge",
  "ip blocked by security policy",
];

// CLI 인수 파싱
const args = process.argv.slice(2);
const isStatsOnly = args.includes("--stats");
const isDryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const batchLimit = limitIndex !== -1 && args[limitIndex + 1] ? Math.max(1, parseInt(args[limitIndex + 1], 10)) : 20;

// DB 연결 초기화
const databaseUrl = process.env.TURSO_DATABASE_URL?.trim() || "file:output/playwright/http-contract/fixture.db";
const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || "local-fixture";

const db = createClient({
  url: databaseUrl,
  authToken,
});

async function main() {
  console.log("=============================================================");
  console.log(" 🚀 영양고고 실사용 데이터 결합 및 자체 인텔리전스 수집 파이프라인");
  console.log(` 📦 연결 DB: ${databaseUrl.startsWith("file:") ? databaseUrl : "Turso Cloud DB"}`);
  console.log("=============================================================\n");

  await ensureSchema();

  if (isStatsOnly) {
    await printStatsTable();
    await db.close();
    return;
  }

  // 1. 카테고리별 균등 샘플링 후보 조회
  console.log(`🔍 [1단계] 후보 항목 균등 샘플링 큐 구성 (목표: 최대 ${batchLimit}건)...`);
  const candidates = await fetchBalancedCandidates(batchLimit);

  if (candidates.length === 0) {
    console.log("✨ 수집 대기 중인 항목이 없습니다. 모든 데이터가 보완되었거나 제외 처리되었습니다.");
    await printStatsTable();
    await db.close();
    return;
  }

  console.log(`📋 총 ${candidates.length}건의 후보가 균등하게 선별되었습니다.`);

  let enrichedCount = 0;
  let skippedCount = 0;
  let circuitBreakerTripped = false;

  // 2. 수집 루프 실행 (Anti-Ban, Jitter Delay, Circuit Breaker)
  for (let i = 0; i < candidates.length; i += 1) {
    const item = candidates[i];
    const indexStr = `[${i + 1}/${candidates.length}]`;
    const searchTarget = `${item.maker ? `${item.maker} ` : ""}${item.food_name}`.trim();

    console.log(`\n${indexStr} 처리 중: "${searchTarget}" (카테고리: ${item.category || "기타"})`);

    // 인간형 지터 딜레이 (1.5초 ~ 3.2초)
    const jitterMs = Math.floor(1500 + Math.random() * 1700);
    console.log(`⏳ 인간형 지터 딜레이: ${jitterMs}ms 대기...`);
    await sleep(jitterMs);

    try {
      const insight = await fetchExternalInsightWithAntiBan(item, searchTarget);

      if (!insight) {
        console.log(`⚠️ 일치하는 실사용 상품 정보를 찾을 수 없어 SkippedAt 처리합니다.`);
        if (!isDryRun) {
          await markSkipped(String(item.dataset_slug), String(item.food_code), String(item.food_name), "NO_SEARCH_MATCH");
        }
        skippedCount += 1;
        continue;
      }

      // 자체 인텔리전스 리포트 합성
      const report = synthesizeEnrichmentReport(insight);

      console.log(`💡 자체 인텔리전스 리포트 합성 완료:`);
      console.log(`   - 3줄 브리핑: ${report.summaryPoints[0].slice(0, 45)}...`);
      console.log(`   - 가격 지표: 100g당 약 ${report.pricePer100g.toLocaleString()}원 (${report.priceLevel})`);
      console.log(`   - 체감 키워드: ${report.tasteKeywords.join(", ")} / ${report.textureKeywords.join(", ")}`);
      console.log(`   - FAQ: ${report.faqItems.length}문항 생성 (한국어 조사 자동 보정 완료)`);

      if (!isDryRun) {
        await saveEnrichmentRecord(report);
        console.log(`💾 DB 저장 완료 (${item.food_code})`);
      } else {
        console.log(`🔎 [Dry-run] DB 저장을 건너뜁니다.`);
      }

      enrichedCount += 1;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("CIRCUIT_BREAKER:")) {
        console.error(`🚨 [서킷 브레이커 발동] ${error.message}`);
        console.error("⛔ 추가 차단 방지를 위해 현재 배치를 즉시 중단합니다.");
        circuitBreakerTripped = true;
        break;
      }
      console.error(`❌ 수집 중 오류 발생:`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\n=============================================================");
  console.log(" 🎉 배치 실행 결과 요약");
  console.log(`   - 보완 완료 (Enriched): ${enrichedCount}건`);
  console.log(`   - 미매칭 제외 (Skipped): ${skippedCount}건`);
  if (circuitBreakerTripped) {
    console.log(`   - ⚠️ 서킷 브레이커로 조기 종료됨`);
  }
  console.log("=============================================================\n");

  await printStatsTable();
  await db.close();
}

/**
 * 카테고리별 균등 샘플링 후보 조회
 */
async function fetchBalancedCandidates(limit: number) {
  const query = `
    SELECT
      n.dataset_slug,
      n.food_code,
      n.food_name,
      COALESCE(NULLIF(n.large_category, ''), NULLIF(n.representative_food, ''), '기타') AS category,
      n.representative_food,
      n.large_category,
      n.serving_unit,
      n.energy,
      n.protein,
      n.fat,
      n.carbs,
      n.sugars,
      n.sodium,
      n.maker,
      n.restaurant
    FROM national_nutrition_items n
    LEFT JOIN food_enrichments e
      ON n.dataset_slug = e.dataset_slug AND n.food_code = e.food_code
    WHERE e.status IS NULL OR (e.status <> 'enriched' AND e.skipped_at IS NULL)
    ORDER BY n.food_name ASC
  `;

  const result = await withDbRetry(async () => db.execute(query));
  const rows = result.rows as unknown as Array<Record<string, unknown>>;

  // 카테고리별 버킷으로 분류
  const buckets = new Map<string, Array<Record<string, unknown>>>();
  for (const row of rows) {
    const cat = String(row.category || "기타");
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(row);
  }

  // Round-Robin 방식으로 카테고리 순회하며 균등 선별
  const balanced: Array<Record<string, unknown>> = [];
  const categoryKeys = Array.from(buckets.keys());
  let added = true;

  while (balanced.length < limit && added) {
    added = false;
    for (const cat of categoryKeys) {
      if (balanced.length >= limit) break;
      const list = buckets.get(cat);
      if (list && list.length > 0) {
        balanced.push(list.shift()!);
        added = true;
      }
    }
  }

  return balanced;
}

/**
 * Anti-Ban 및 서킷 브레이커가 적용된 외부 실사용 데이터 수집 함수
 */
async function fetchExternalInsightWithAntiBan(
  item: Record<string, unknown>,
  targetQuery: string,
): Promise<RawScrapedInsight | null> {
  // 비정상/테스트용 텍스트 필터링
  if (/[<>'"/\\{}()]/.test(targetQuery) || targetQuery.trim().length < 2) {
    return null;
  }

  const randomUA = MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)];
  const encodedQuery = encodeURIComponent(targetQuery);
  const searchUrl = `https://m.search.naver.com/search.naver?query=${encodedQuery}`;

  const headers = {
    "User-Agent": randomUA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    Referer: "https://m.naver.com/",
  };

  let html = "";
  let lastError: unknown;

  // 최대 2회 네트워크 재시도 (15초 타임아웃)
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(searchUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // 서킷 브레이커 체크: 403, 429, 418
      if (response.status === 403 || response.status === 429 || response.status === 418) {
        throw new Error(`CIRCUIT_BREAKER: HTTP ${response.status} 감지 (보안 차단 또는 속도 제한)`);
      }

      if (!response.ok) {
        throw new Error(`HTTP 오류: ${response.status}`);
      }

      html = await response.text();

      // 타이틀 차단 감지
      const pageTitle = html.match(/<title>(.*?)<\/title>/i)?.[1]?.toLowerCase() || "";
      if (pageTitle.includes("비정상") || pageTitle.includes("접근 차단") || pageTitle.includes("robot check")) {
        throw new Error(`CIRCUIT_BREAKER: 보안 차단 페이지 타이틀("${pageTitle}") 감지`);
      }

      // 응답 본문 내 보안 확인 / 캡차 감지
      for (const pattern of CIRCUIT_BREAKER_PATTERNS) {
        if (html.toLowerCase().includes(pattern.toLowerCase())) {
          throw new Error(`CIRCUIT_BREAKER: 보안 검증 문구("${pattern}") 감지`);
        }
      }

      break;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (err instanceof Error && err.message.startsWith("CIRCUIT_BREAKER:")) {
        throw err;
      }
      if (attempt === 2) {
        console.warn(`네트워크 요청 실패 (2회 재시도 소진):`, err instanceof Error ? err.message : err);
      } else {
        await sleep(1000);
      }
    }
  }

  // HTML에서 상품 가격, 리뷰 수, 평점 정보 추출 (이미지 URL은 철저히 배제)
  const prices: number[] = [];
  let reviewCount = 0;
  let reviewScore = 0;

  if (html) {
    // 가격 추출 정규식
    const priceMatches = html.matchAll(/([0-9]{1,3}(,[0-9]{3})+)\s*원/g);
    for (const match of priceMatches) {
      const p = parseInt(match[1].replace(/,/g, ""), 10);
      if (p >= 800 && p <= 500000) {
        prices.push(p);
      }
      if (prices.length >= 8) break;
    }

    // 리뷰수 추출
    const reviewMatch = html.match(/리뷰\s*([0-9,]+)/);
    if (reviewMatch) {
      reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""), 10);
    }

    // 평점 추출
    const scoreMatch = html.match(/평점\s*([0-5]\.[0-9])/);
    if (scoreMatch) {
      reviewScore = parseFloat(scoreMatch[1]);
    }
  }

  // 만약 검색 결과 매칭이 유효하지 않고 가격도 전혀 없으면 fallback 검토
  if (prices.length === 0 && (!html || html.includes("검색결과가 없습니다"))) {
    return null;
  }

  return {
    foodCode: String(item.food_code),
    datasetSlug: String(item.dataset_slug),
    foodName: String(item.food_name),
    maker: item.maker ? String(item.maker) : undefined,
    largeCategory: item.large_category ? String(item.large_category) : undefined,
    representativeFood: item.representative_food ? String(item.representative_food) : undefined,
    servingUnit: item.serving_unit ? String(item.serving_unit) : undefined,
    energy: item.energy ? String(item.energy) : undefined,
    protein: item.protein ? String(item.protein) : undefined,
    fat: item.fat ? String(item.fat) : undefined,
    carbs: item.carbs ? String(item.carbs) : undefined,
    sugars: item.sugars ? String(item.sugars) : undefined,
    sodium: item.sodium ? String(item.sodium) : undefined,
    matchedQuery: targetQuery,
    rawPrices: prices,
    reviewCount: reviewCount || undefined,
    reviewScore: reviewScore || undefined,
  };
}

async function saveEnrichmentRecord(record: ReturnType<typeof synthesizeEnrichmentReport>) {
  const tasteJson = JSON.stringify(record.tasteKeywords || []);
  const textureJson = JSON.stringify(record.textureKeywords || []);
  const tipsJson = JSON.stringify(record.usageTips || []);
  const summaryJson = JSON.stringify(record.summaryPoints || []);
  const faqJson = JSON.stringify(record.faqItems || []);

  await withDbRetry(async () =>
    db.execute({
      sql: `INSERT INTO food_enrichments (
        dataset_slug, food_code, food_name, status, matched_query,
        review_count, review_score, avg_price, min_price, price_per_100g,
        price_level, sentiment_positive_rate, taste_keywords, texture_keywords,
        usage_tips, storage_guide, pairing_recommendation, target_audience,
        summary_points, faq_items, benchmark_price_diff, benchmark_nutrient_summary,
        source_platform, skipped_reason, skipped_at, enriched_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(dataset_slug, food_code) DO UPDATE SET
        food_name = excluded.food_name,
        status = excluded.status,
        matched_query = excluded.matched_query,
        review_count = excluded.review_count,
        review_score = excluded.review_score,
        avg_price = excluded.avg_price,
        min_price = excluded.min_price,
        price_per_100g = excluded.price_per_100g,
        price_level = excluded.price_level,
        sentiment_positive_rate = excluded.sentiment_positive_rate,
        taste_keywords = excluded.taste_keywords,
        texture_keywords = excluded.texture_keywords,
        usage_tips = excluded.usage_tips,
        storage_guide = excluded.storage_guide,
        pairing_recommendation = excluded.pairing_recommendation,
        target_audience = excluded.target_audience,
        summary_points = excluded.summary_points,
        faq_items = excluded.faq_items,
        benchmark_price_diff = excluded.benchmark_price_diff,
        benchmark_nutrient_summary = excluded.benchmark_nutrient_summary,
        source_platform = excluded.source_platform,
        skipped_reason = excluded.skipped_reason,
        skipped_at = excluded.skipped_at,
        enriched_at = excluded.enriched_at,
        updated_at = CURRENT_TIMESTAMP`,
      args: [
        record.datasetSlug,
        record.foodCode,
        record.foodName,
        record.status,
        record.matchedQuery ?? null,
        record.reviewCount,
        record.reviewScore,
        record.avgPrice,
        record.minPrice,
        record.pricePer100g,
        record.priceLevel,
        record.sentimentPositiveRate,
        tasteJson,
        textureJson,
        tipsJson,
        record.storageGuide,
        record.pairingRecommendation,
        record.targetAudience,
        summaryJson,
        faqJson,
        record.benchmarkPriceDiff,
        record.benchmarkNutrientSummary,
        record.sourcePlatform,
        record.skippedReason ?? null,
        record.skippedAt ?? null,
        record.enrichedAt ?? null,
      ],
    }),
  );
}

async function markSkipped(datasetSlug: string, foodCode: string, foodName: string, reason: string) {
  const now = new Date().toISOString();
  await withDbRetry(async () =>
    db.execute({
      sql: `INSERT INTO food_enrichments (
        dataset_slug, food_code, food_name, status, skipped_reason, skipped_at, updated_at
      ) VALUES (?, ?, ?, 'skipped', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(dataset_slug, food_code) DO UPDATE SET
        status = 'skipped',
        skipped_reason = excluded.skipped_reason,
        skipped_at = excluded.skipped_at,
        updated_at = CURRENT_TIMESTAMP`,
      args: [datasetSlug, foodCode, foodName, reason, now],
    }),
  );
}

async function ensureSchema() {
  await withDbRetry(async () => {
    await db.batch([
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
      "CREATE INDEX IF NOT EXISTS idx_food_enrichments_status ON food_enrichments(status)",
      "CREATE INDEX IF NOT EXISTS idx_food_enrichments_skipped_at ON food_enrichments(skipped_at)",
      "CREATE INDEX IF NOT EXISTS idx_food_enrichments_enriched_at ON food_enrichments(enriched_at)",
    ]);
  });
}

/**
 * 카테고리별 통계 테이블 콘솔 출력 (--stats)
 */
async function printStatsTable() {
  const query = `
    SELECT
      COALESCE(NULLIF(n.large_category, ''), NULLIF(n.representative_food, ''), n.dataset_slug) AS category_name,
      COUNT(DISTINCT n.food_code) AS total_count,
      COUNT(DISTINCT CASE WHEN e.status = 'enriched' THEN n.food_code END) AS enriched_count,
      COUNT(DISTINCT CASE WHEN e.status = 'skipped' AND e.skipped_at IS NOT NULL THEN n.food_code END) AS skipped_count
    FROM national_nutrition_items n
    LEFT JOIN food_enrichments e
      ON n.dataset_slug = e.dataset_slug AND n.food_code = e.food_code
    GROUP BY category_name
    ORDER BY total_count DESC, category_name ASC
  `;

  const result = await withDbRetry(async () => db.execute(query));
  const statsRows = result.rows.map((row) => {
    const total = Number(row.total_count ?? 0);
    const enriched = Number(row.enriched_count ?? 0);
    const skipped = Number(row.skipped_count ?? 0);
    const pending = Math.max(0, total - enriched - skipped);
    const rate = total > 0 ? `${Math.round((enriched / total) * 100)}%` : "0%";

    return {
      "카테고리": String(row.category_name || "기타"),
      "전체(Total)": total,
      "보완완료(Enriched)": enriched,
      "제외(Skipped)": skipped,
      "잔여대기(Pending)": pending,
      "보완율": rate,
    };
  });

  console.log("\n📊 [카테고리별 실사용 데이터 보완 파이프라인 통계 현황]");
  console.table(statsRows);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("치명적 오류 발생:", err);
  process.exit(1);
});
