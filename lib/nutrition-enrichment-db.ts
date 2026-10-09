import { getDb, isTursoConfigured } from "./db";

export type FoodEnrichmentStatus = "enriched" | "skipped" | "pending";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FoodEnrichmentRecord = {
  datasetSlug: string;
  foodCode: string;
  foodName: string;
  status: FoodEnrichmentStatus;
  matchedQuery: string | null;
  reviewCount: number;
  reviewScore: number;
  avgPrice: number;
  minPrice: number;
  pricePer100g: number;
  priceLevel: string;
  sentimentPositiveRate: number;
  tasteKeywords: string[];
  textureKeywords: string[];
  usageTips: string[];
  storageGuide: string;
  pairingRecommendation: string;
  targetAudience: string;
  summaryPoints: [string, string, string];
  faqItems: FaqItem[];
  benchmarkPriceDiff: number;
  benchmarkNutrientSummary: string;
  sourcePlatform: string;
  skippedReason?: string | null;
  skippedAt?: string | null;
  enrichedAt?: string | null;
};

export type CategoryEnrichmentStat = {
  category: string;
  total: number;
  enriched: number;
  skipped: number;
  pending: number;
  completionRate: number;
};

let enrichmentSchemaReady = false;

/**
 * DB 콜드스타트 및 일시적 연결 장애 방어를 위한 지수 백오프 재시도 래퍼
 */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 400,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      const backoff = delayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}

export async function ensureFoodEnrichmentSchema() {
  if (enrichmentSchemaReady || !isTursoConfigured) return;

  const db = getDb();
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

  enrichmentSchemaReady = true;
}

export async function readFoodEnrichmentByCode(
  datasetSlug: string,
  foodCode: string,
): Promise<FoodEnrichmentRecord | null> {
  if (!isTursoConfigured) return null;

  await ensureFoodEnrichmentSchema();
  const db = getDb();

  const result = await withDbRetry(async () =>
    db.execute({
      sql: `SELECT * FROM food_enrichments WHERE dataset_slug = ? AND food_code = ? LIMIT 1`,
      args: [datasetSlug, foodCode],
    }),
  );

  const row = result.rows[0];
  if (!row) return null;

  return mapFoodEnrichmentRow(row as Record<string, unknown>);
}

export async function saveFoodEnrichment(
  record: FoodEnrichmentRecord,
): Promise<void> {
  if (!isTursoConfigured) return;

  await ensureFoodEnrichmentSchema();
  const db = getDb();

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

export async function markFoodEnrichmentSkipped(
  datasetSlug: string,
  foodCode: string,
  foodName: string,
  reason: string,
): Promise<void> {
  if (!isTursoConfigured) return;

  await ensureFoodEnrichmentSchema();
  const db = getDb();
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

export async function getFoodEnrichmentStats(): Promise<CategoryEnrichmentStat[]> {
  if (!isTursoConfigured) return [];

  await ensureFoodEnrichmentSchema();
  const db = getDb();

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

  return result.rows.map((row) => {
    const total = Number(row.total_count ?? 0);
    const enriched = Number(row.enriched_count ?? 0);
    const skipped = Number(row.skipped_count ?? 0);
    const pending = Math.max(0, total - enriched - skipped);
    const completionRate = total > 0 ? Math.round((enriched / total) * 100) : 0;

    return {
      category: String(row.category_name || "기타"),
      total,
      enriched,
      skipped,
      pending,
      completionRate,
    };
  });
}

function mapFoodEnrichmentRow(row: Record<string, unknown>): FoodEnrichmentRecord {
  const parseJsonArray = (val: unknown): string[] => {
    if (typeof val !== "string" || !val.trim()) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseFaq = (val: unknown): FaqItem[] => {
    if (typeof val !== "string" || !val.trim()) return [];
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const summaries = parseJsonArray(row.summary_points);
  const summaryPoints: [string, string, string] = [
    summaries[0] || "",
    summaries[1] || "",
    summaries[2] || "",
  ];

  return {
    datasetSlug: String(row.dataset_slug ?? ""),
    foodCode: String(row.food_code ?? ""),
    foodName: String(row.food_name ?? ""),
    status: (row.status as FoodEnrichmentStatus) ?? "pending",
    matchedQuery: row.matched_query ? String(row.matched_query) : null,
    reviewCount: Number(row.review_count ?? 0),
    reviewScore: Number(row.review_score ?? 0),
    avgPrice: Number(row.avg_price ?? 0),
    minPrice: Number(row.min_price ?? 0),
    pricePer100g: Number(row.price_per_100g ?? 0),
    priceLevel: String(row.price_level ?? "표준 가격대"),
    sentimentPositiveRate: Number(row.sentiment_positive_rate ?? 0),
    tasteKeywords: parseJsonArray(row.taste_keywords),
    textureKeywords: parseJsonArray(row.texture_keywords),
    usageTips: parseJsonArray(row.usage_tips),
    storageGuide: String(row.storage_guide ?? ""),
    pairingRecommendation: String(row.pairing_recommendation ?? ""),
    targetAudience: String(row.target_audience ?? ""),
    summaryPoints,
    faqItems: parseFaq(row.faq_items),
    benchmarkPriceDiff: Number(row.benchmark_price_diff ?? 0),
    benchmarkNutrientSummary: String(row.benchmark_nutrient_summary ?? ""),
    sourcePlatform: String(row.source_platform ?? "portal_aggregate"),
    skippedReason: row.skipped_reason ? String(row.skipped_reason) : null,
    skippedAt: row.skipped_at ? String(row.skipped_at) : null,
    enrichedAt: row.enriched_at ? String(row.enriched_at) : null,
  };
}
