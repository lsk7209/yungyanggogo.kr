import { unstable_cache } from "next/cache";
import { getDb, isTursoConfigured } from "./db";
import { parseNutritionTotalCount } from "./nutrition-count";
import {
  createNationalNutritionFailureResult,
  fetchNationalNutritionItems,
  getNationalNutritionApiKey,
  getNationalNutritionDataset,
  isSyntheticFoodCode,
  type NationalNutritionDatasetSlug,
  type NationalNutritionItem,
  type NationalNutritionResult,
} from "./national-nutrition-api";

const DEFAULT_QUERY_KEY = "__default__";

// DDL을 매 요청마다 실행하지 않도록 초기화 완료 여부 추적 (프로세스 수명 동안 1회만 실행)
let schemaReady = false;

export type NutritionSearchSource = "stored" | "upstream";

type FetchCachedNationalNutritionOptions = {
  dataset?: NationalNutritionDatasetSlug;
  query?: string;
  pageNo?: number;
  numOfRows?: number;
  // Explicit user choice. The default keeps one navigation session inside the
  // stored scope; it never silently changes source at an empty page or page end.
  source?: NutritionSearchSource;
};

export type CachedNationalNutritionResult = NationalNutritionResult & {
  cacheSource: "db" | "api" | "api_no_db";
  // The range this result (and its count/pagination) belongs to.
  searchScope: NutritionSearchSource;
  // Why an upstream scope was used without an explicit request.
  scopeReason?: "no_db" | "stored_dataset_empty" | "stored_unavailable" | "stored_no_match";
};

// Single representative-row rule shared by list, detail, related and sitemap:
// latest successful storage first, then a deterministic query_key tie-break.
export const REPRESENTATIVE_ROW_ORDER = "synced_at DESC, query_key ASC";

export { isSyntheticFoodCode };

export function hasSourceFoodCode(food: Pick<NationalNutritionItem, "foodCode">) {
  return Boolean(food.foodCode?.trim());
}

type NationalNutritionRow = {
  food_code: string;
  food_name: string;
  type_name: string;
  origin_name: string;
  large_category: string;
  representative_food: string;
  middle_category: string;
  serving_unit: string;
  energy: string;
  water: string;
  protein: string;
  fat: string;
  carbs: string;
  sugars: string;
  fiber: string;
  calcium: string;
  iron: string;
  potassium: string;
  sodium: string;
  vitamin_a: string;
  vitamin_c: string;
  vitamin_d: string;
  saturated_fat: string;
  trans_fat: string;
  maker: string;
  importer: string;
  distributor: string;
  restaurant: string;
  origin_country: string;
  source_name: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
};

export async function fetchNationalNutritionItemsWithDbCache({
  dataset = "all",
  query,
  pageNo = 1,
  numOfRows = 12,
  source = "stored",
}: FetchCachedNationalNutritionOptions = {}): Promise<CachedNationalNutritionResult> {
  const selectedDataset = getNationalNutritionDataset(dataset);

  if (!isTursoConfigured) {
    const result = await fetchNationalNutritionItems({
      dataset,
      query,
      pageNo,
      numOfRows,
    });
    return { ...result, cacheSource: "api_no_db", searchScope: "upstream", scopeReason: "no_db" };
  }

  if (source === "upstream") {
    return fetchUpstreamScope({ dataset, query, pageNo, numOfRows });
  }

  let cached: Awaited<ReturnType<typeof readNationalNutritionItemsFromDb>>;
  let datasetHasStoredRows = true;
  try {
    await ensureNationalNutritionSchema();
    cached = await readNationalNutritionItemsFromDb({
      dataset,
      query,
      pageNo,
      numOfRows,
    });
    if (cached.foods.length === 0) {
      datasetHasStoredRows = await hasStoredNationalNutritionRows(dataset);
    }
  } catch {
    // A DB failure is not a valid zero. Only a fresh page-one search may use
    // the source instead, and the result says so explicitly.
    if (pageNo === 1 && getNationalNutritionApiKey()) {
      return fetchUpstreamScope({ dataset, query, pageNo, numOfRows }, "stored_unavailable");
    }
    return {
      ...createNationalNutritionFailureResult(selectedDataset, 503, "stored_unavailable"),
      cacheSource: "db",
      searchScope: "stored",
    };
  }

  if (!datasetHasStoredRows && getNationalNutritionApiKey()) {
    // Nothing has been stored for this dataset yet (bootstrap). This is a
    // dataset-level decision, never a page-end or search-zero fallback.
    return fetchUpstreamScope({ dataset, query, pageNo, numOfRows }, "stored_dataset_empty");
  }

  if (query?.trim() && pageNo === 1 && cached.totalCount === 0 && getNationalNutritionApiKey()) {
    // A fresh search with no stored match starts a separate, labelled source
    // scope from page 1. Callers pin it with `source=upstream` for paging, so
    // one session never mixes stored and source rows or denominators.
    const sourceResult = await fetchUpstreamScope({ dataset, query, pageNo, numOfRows }, "stored_no_match");
    // If the source cannot answer, the valid stored-scope zero remains the answer.
    if (sourceResult.ok) return sourceResult;
  }

  return {
    ok: true,
    status: 200,
    dataset: selectedDataset,
    totalCount: cached.totalCount,
    countScope: "stored",
    countCheckedAt: cached.countCheckedAt,
    latestStoredAt: cached.latestStoredAt,
    count: cached.foods.length,
    foods: cached.foods,
    cacheSource: "db",
    searchScope: "stored",
    message: "",
  };
}

async function fetchUpstreamScope(
  { dataset = "all", query, pageNo = 1, numOfRows = 12 }: FetchCachedNationalNutritionOptions,
  scopeReason?: CachedNationalNutritionResult["scopeReason"],
): Promise<CachedNationalNutritionResult> {
  const result = await fetchNationalNutritionItems({
    dataset,
    query,
    pageNo,
    numOfRows,
  });
  if (!query && result.ok && !result.fallback && result.foods.length > 0 && scopeReason === "stored_dataset_empty") {
    try {
      await saveNationalNutritionItemsToDb({
        dataset,
        query,
        totalCount: result.totalCount,
        foods: result.foods,
      });
    } catch {
      // A failed cache write must not turn a successful source answer into an error.
    }
  }

  return { ...result, cacheSource: "api", searchScope: "upstream", ...(scopeReason ? { scopeReason } : {}) };
}

async function hasStoredNationalNutritionRows(dataset: NationalNutritionDatasetSlug) {
  const result = await getDb().execute({
    sql: "SELECT 1 AS present FROM national_nutrition_items WHERE dataset_slug = ? LIMIT 1",
    args: [dataset],
  });
  return result.rows.length > 0;
}

export async function ensureNationalNutritionSchema() {
  // 이미 초기화된 경우 DDL 재실행 방지 — 매 요청마다 DDL을 Turso에 보내던 것을 프로세스 수명 1회로 제한
  if (schemaReady) return;

  const db = getDb();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS national_nutrition_syncs (
      dataset_slug TEXT NOT NULL,
      query_key TEXT NOT NULL,
      total_count INTEGER NOT NULL DEFAULT 0,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (dataset_slug, query_key)
    )`,
    `CREATE TABLE IF NOT EXISTS national_nutrition_items (
      dataset_slug TEXT NOT NULL,
      query_key TEXT NOT NULL,
      food_code TEXT NOT NULL,
      food_name TEXT NOT NULL,
      type_name TEXT NOT NULL DEFAULT '',
      origin_name TEXT NOT NULL DEFAULT '',
      large_category TEXT NOT NULL DEFAULT '',
      representative_food TEXT NOT NULL DEFAULT '',
      middle_category TEXT NOT NULL DEFAULT '',
      serving_unit TEXT NOT NULL DEFAULT '',
      energy TEXT NOT NULL DEFAULT '',
      water TEXT NOT NULL DEFAULT '',
      protein TEXT NOT NULL DEFAULT '',
      fat TEXT NOT NULL DEFAULT '',
      carbs TEXT NOT NULL DEFAULT '',
      sugars TEXT NOT NULL DEFAULT '',
      fiber TEXT NOT NULL DEFAULT '',
      calcium TEXT NOT NULL DEFAULT '',
      iron TEXT NOT NULL DEFAULT '',
      potassium TEXT NOT NULL DEFAULT '',
      sodium TEXT NOT NULL DEFAULT '',
      vitamin_a TEXT NOT NULL DEFAULT '',
      vitamin_c TEXT NOT NULL DEFAULT '',
      vitamin_d TEXT NOT NULL DEFAULT '',
      saturated_fat TEXT NOT NULL DEFAULT '',
      trans_fat TEXT NOT NULL DEFAULT '',
      maker TEXT NOT NULL DEFAULT '',
      importer TEXT NOT NULL DEFAULT '',
      distributor TEXT NOT NULL DEFAULT '',
      restaurant TEXT NOT NULL DEFAULT '',
      origin_country TEXT NOT NULL DEFAULT '',
      source_name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (dataset_slug, query_key, food_code)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_national_nutrition_items_dataset_query ON national_nutrition_items(dataset_slug, query_key, synced_at)",
    "CREATE INDEX IF NOT EXISTS idx_national_nutrition_items_name ON national_nutrition_items(food_name)",
    // 상세 페이지 조회: WHERE dataset_slug=? AND food_code=? — PK가 (dataset_slug, query_key, food_code)라서
    // query_key 없이 food_code만으로 찾으면 풀스캔 발생 → 전용 인덱스로 해결
    "CREATE INDEX IF NOT EXISTS idx_national_nutrition_items_food_code ON national_nutrition_items(dataset_slug, food_code)",
  ]);

  schemaReady = true;
}

export async function readNationalNutritionItemsFromDb({
  dataset = "all",
  query,
  pageNo = 1,
  numOfRows = 12,
}: FetchCachedNationalNutritionOptions = {}) {
  const db = getDb();
  const limit = Math.max(1, Math.floor(numOfRows));
  const offset = (Math.max(1, Math.floor(pageNo)) - 1) * limit;

  if (query?.trim()) {
    const pattern = `%${escapeSqlLike(query.trim())}%`;
    // Rank the whole dataset first so a search shows the same representative
    // row as the detail page, then filter by name.
    const [countResult, rowsResult] = await Promise.all([
      db.execute({
        sql: `WITH ranked AS (
            SELECT food_code, food_name, synced_at, ROW_NUMBER() OVER (
              PARTITION BY food_code ORDER BY ${REPRESENTATIVE_ROW_ORDER}
            ) AS row_rank
            FROM national_nutrition_items
            WHERE dataset_slug = ?
          )
          SELECT COUNT(DISTINCT food_code) AS total_count, MAX(synced_at) AS latest_stored_at
          FROM ranked
          WHERE row_rank = 1 AND food_name LIKE ? ESCAPE '\\'`,
        args: [dataset, pattern],
      }),
      db.execute({
        sql: `WITH ranked AS (
            SELECT *, ROW_NUMBER() OVER (
              PARTITION BY food_code ORDER BY ${REPRESENTATIVE_ROW_ORDER}
            ) AS row_rank
            FROM national_nutrition_items
            WHERE dataset_slug = ?
          )
          SELECT * FROM ranked
          WHERE row_rank = 1 AND food_name LIKE ? ESCAPE '\\'
          ORDER BY food_name ASC, food_code ASC
          LIMIT ? OFFSET ?`,
        args: [dataset, pattern, limit, offset],
      }),
    ]);
    return {
      totalCount: parseNutritionTotalCount(countResult.rows[0]?.total_count),
      countCheckedAt: new Date().toISOString(),
      latestStoredAt: normalizeStoredTimestamp(countResult.rows[0]?.latest_stored_at),
      foods: rowsResult.rows.map((row) => mapNationalNutritionRow(row as unknown as NationalNutritionRow)),
    };
  }

  const [countResult, rowsResult] = await Promise.all([
    db.execute({
      sql: "SELECT COUNT(DISTINCT food_code) AS total_count, MAX(synced_at) AS latest_stored_at FROM national_nutrition_items WHERE dataset_slug = ?",
      args: [dataset],
    }),
    db.execute({
      sql: `WITH ranked AS (
          SELECT *, ROW_NUMBER() OVER (
            PARTITION BY food_code ORDER BY ${REPRESENTATIVE_ROW_ORDER}
          ) AS row_rank
          FROM national_nutrition_items
          WHERE dataset_slug = ?
        )
        SELECT * FROM ranked
        WHERE row_rank = 1
        ORDER BY food_name ASC, food_code ASC
        LIMIT ? OFFSET ?`,
      args: [dataset, limit, offset],
    }),
  ]);

  const totalCount = parseNutritionTotalCount(
    countResult.rows[0]?.total_count,
  );
  const foods = rowsResult.rows.map((row) =>
    mapNationalNutritionRow(row as unknown as NationalNutritionRow),
  );

  return {
    totalCount,
    countCheckedAt: new Date().toISOString(),
    latestStoredAt: normalizeStoredTimestamp(countResult.rows[0]?.latest_stored_at),
    foods,
  };
}

export async function readNationalNutritionItemByCodeFromDb({
  dataset,
  foodCode,
}: {
  dataset: NationalNutritionDatasetSlug;
  foodCode: string;
}) {
  if (!isTursoConfigured) {
    return null;
  }

  await ensureNationalNutritionSchema();

  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM national_nutrition_items
      WHERE dataset_slug = ? AND food_code = ?
      ORDER BY ${REPRESENTATIVE_ROW_ORDER}
      LIMIT 1`,
    args: [dataset, foodCode],
  });

  const row = result.rows[0];
  return row
    ? mapNationalNutritionRow(row as unknown as NationalNutritionRow)
    : null;
}

export type RelatedNutritionRelation = "representative_food" | "middle_category" | "large_category";
export type RelatedNationalNutritionItem = NationalNutritionItem & { relation: RelatedNutritionRelation };

export const RELATED_RELATION_LABELS: Record<RelatedNutritionRelation, string> = {
  representative_food: "같은 대표식품",
  middle_category: "같은 중분류",
  large_category: "같은 대분류",
};

export async function readRelatedNationalNutritionItemsFromDb({
  dataset,
  item,
  limit = 6,
}: {
  dataset: NationalNutritionDatasetSlug;
  item: Pick<NationalNutritionItem, "foodCode" | "representativeFood" | "middleCategory" | "largeCategory">;
  limit?: number;
}): Promise<RelatedNationalNutritionItem[]> {
  if (!isTursoConfigured) {
    return [];
  }
  const representative = item.representativeFood.trim();
  const middle = item.middleCategory.trim();
  const large = item.largeCategory.trim();
  // Without a verifiable shared category there is no "related" claim to make.
  if (!representative && !middle && !large) return [];

  await ensureNationalNutritionSchema();

  const db = getDb();
  const result = await db.execute({
    sql: `WITH ranked AS (
        SELECT *, ROW_NUMBER() OVER (
          PARTITION BY food_code ORDER BY ${REPRESENTATIVE_ROW_ORDER}
        ) AS row_rank
        FROM national_nutrition_items
        WHERE dataset_slug = ?
      ), scored AS (
        SELECT *, CASE
          WHEN ? <> '' AND representative_food = ? THEN 3
          WHEN ? <> '' AND middle_category = ? THEN 2
          WHEN ? <> '' AND large_category = ? THEN 1
          ELSE 0 END AS relation_rank
        FROM ranked
        WHERE row_rank = 1 AND food_code <> ?
      )
      SELECT * FROM scored
      WHERE relation_rank > 0
      ORDER BY relation_rank DESC, food_name ASC, food_code ASC
      LIMIT ?`,
    args: [dataset, representative, representative, middle, middle, large, large, item.foodCode, Math.max(1, Math.floor(limit))],
  });

  return result.rows.map((row) => {
    const rank = Number((row as unknown as { relation_rank: number }).relation_rank);
    return {
      ...mapNationalNutritionRow(row as unknown as NationalNutritionRow),
      relation: rank === 3 ? "representative_food" : rank === 2 ? "middle_category" : "large_category",
    };
  });
}

export type NutritionDataProvenance = {
  source: "stored" | "upstream";
  sourceUpdatedAt: string | null; // 원자료 기준일 (source record date)
  storedAt: string | null; // when this row was stored by the site
  checkedAt: string | null; // when this server observed the source response
};

export type NationalNutritionDetailResult =
  | { kind: "found"; item: NationalNutritionItem; cacheSource: "db" | "api" | "api_no_db"; provenance: NutritionDataProvenance }
  // Stored rows were searched without error, but the source could not be asked.
  | { kind: "not_in_stored_scope"; checkedAt: string }
  // The source answered successfully and the code did not match.
  | { kind: "not_found"; source: "upstream"; checkedAt: string }
  | { kind: "temporarily_unavailable"; reasonCode: string; status: number; retryable: boolean };

export async function fetchNationalNutritionItemDetail({
  dataset,
  foodCode,
}: {
  dataset: NationalNutritionDatasetSlug;
  foodCode: string;
}): Promise<NationalNutritionDetailResult> {
  let storedError = false;
  try {
    const cached = await readNationalNutritionItemByCodeFromDb({
      dataset,
      foodCode,
    });
    if (cached) {
      return {
        kind: "found",
        item: cached,
        cacheSource: "db",
        provenance: {
          source: "stored",
          sourceUpdatedAt: cached.updatedAt || null,
          storedAt: cached.storedAt || null,
          checkedAt: null,
        },
      };
    }
  } catch {
    storedError = true;
  }

  if (!getNationalNutritionApiKey()) {
    if (storedError || !isTursoConfigured) {
      return { kind: "temporarily_unavailable", reasonCode: storedError ? "stored_unavailable" : "no_provider", status: 503, retryable: storedError };
    }
    return { kind: "not_in_stored_scope", checkedAt: new Date().toISOString() };
  }

  const result = await fetchNationalNutritionItems({
    dataset,
    foodCode,
    numOfRows: 1,
  });
  if (!result.ok) {
    return {
      kind: "temporarily_unavailable",
      reasonCode: result.resultCode ? `upstream_${result.resultCode}` : `upstream_http_${result.status}`,
      status: result.status,
      retryable: true,
    };
  }
  const item = result.foods.find((food) => food.foodCode === foodCode);
  if (!item) {
    return { kind: "not_found", source: "upstream", checkedAt: result.countCheckedAt || new Date().toISOString() };
  }

  return {
    kind: "found",
    item,
    cacheSource: isTursoConfigured ? "api" : "api_no_db",
    provenance: {
      source: "upstream",
      sourceUpdatedAt: item.updatedAt || null,
      storedAt: null,
      checkedAt: result.countCheckedAt,
    },
  };
}

// Excludes legacy rows whose identifier was synthesized from the name.
const SOURCE_CODE_ONLY = "food_code <> dataset_slug || '-' || food_name";

export async function countNationalNutritionSitemapItems(
  dataset: NationalNutritionDatasetSlug,
) {
  const result = await getDb().execute({
    sql: `SELECT COUNT(DISTINCT food_code) AS total_count FROM national_nutrition_items WHERE dataset_slug = ? AND ${SOURCE_CODE_ONLY}`,
    args: [dataset],
  });
  const count = parseNutritionTotalCount(result.rows[0]?.total_count);
  if (count === null) throw new Error("Stored nutrition count is unavailable");
  return count;
}

export async function readNationalNutritionSitemapItems({
  dataset,
  page,
  pageSize,
}: {
  dataset: NationalNutritionDatasetSlug;
  page: number;
  pageSize: number;
}) {
  const safePage = Math.max(0, Math.floor(page));
  const safePageSize = Math.min(10_000, Math.max(1, Math.floor(pageSize)));
  // lastmod comes from the same representative row the detail page renders.
  const result = await getDb().execute({
    sql: `WITH ranked AS (
        SELECT food_code, updated_at, ROW_NUMBER() OVER (
          PARTITION BY food_code ORDER BY ${REPRESENTATIVE_ROW_ORDER}
        ) AS row_rank
        FROM national_nutrition_items
        WHERE dataset_slug = ? AND ${SOURCE_CODE_ONLY}
      )
      SELECT food_code, NULLIF(updated_at, '') AS updated_at
      FROM ranked
      WHERE row_rank = 1
      ORDER BY food_code ASC
      LIMIT ? OFFSET ?`,
    args: [dataset, safePageSize, safePage * safePageSize],
  });
  return result.rows.map((row) => ({
    foodCode: String(row.food_code || ""),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  })).filter((row) => row.foodCode);
}

export async function saveNationalNutritionItemsToDb({
  dataset,
  query,
  totalCount,
  foods: inputFoods,
}: {
  dataset: NationalNutritionDatasetSlug;
  query?: string;
  totalCount: number | null;
  foods: NationalNutritionItem[];
}) {
  const db = getDb();
  const queryKey = normalizeQueryKey(query);
  // Rows without a source food code are not stored under an invented identifier.
  const foods = inputFoods.filter(hasSourceFoodCode);

  await db.batch([
    ...(totalCount === null ? [] : [{
      sql: `INSERT INTO national_nutrition_syncs (dataset_slug, query_key, total_count, fetched_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(dataset_slug, query_key)
        DO UPDATE SET total_count = excluded.total_count, fetched_at = CURRENT_TIMESTAMP`,
      args: [dataset, queryKey, totalCount],
    }]),
    ...foods.map((food) => ({
      sql: `INSERT INTO national_nutrition_items (
          dataset_slug, query_key, food_code, food_name, type_name, origin_name, large_category,
          representative_food, middle_category, serving_unit, energy, water, protein, fat, carbs,
          sugars, fiber, calcium, iron, potassium, sodium, vitamin_a, vitamin_c, vitamin_d,
          saturated_fat, trans_fat, maker, importer, distributor, restaurant, origin_country,
          source_name, created_at, updated_at, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(dataset_slug, query_key, food_code)
        DO UPDATE SET
          food_name = excluded.food_name,
          type_name = excluded.type_name,
          origin_name = excluded.origin_name,
          large_category = excluded.large_category,
          representative_food = excluded.representative_food,
          middle_category = excluded.middle_category,
          serving_unit = excluded.serving_unit,
          energy = excluded.energy,
          water = excluded.water,
          protein = excluded.protein,
          fat = excluded.fat,
          carbs = excluded.carbs,
          sugars = excluded.sugars,
          fiber = excluded.fiber,
          calcium = excluded.calcium,
          iron = excluded.iron,
          potassium = excluded.potassium,
          sodium = excluded.sodium,
          vitamin_a = excluded.vitamin_a,
          vitamin_c = excluded.vitamin_c,
          vitamin_d = excluded.vitamin_d,
          saturated_fat = excluded.saturated_fat,
          trans_fat = excluded.trans_fat,
          maker = excluded.maker,
          importer = excluded.importer,
          distributor = excluded.distributor,
          restaurant = excluded.restaurant,
          origin_country = excluded.origin_country,
          source_name = excluded.source_name,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          synced_at = CURRENT_TIMESTAMP`,
      args: [
        dataset,
        queryKey,
        food.foodCode,
        food.name,
        food.typeName,
        food.originName,
        food.largeCategory,
        food.representativeFood,
        food.middleCategory,
        food.servingUnit,
        food.energy,
        food.water,
        food.protein,
        food.fat,
        food.carbs,
        food.sugars,
        food.fiber,
        food.calcium,
        food.iron,
        food.potassium,
        food.sodium,
        food.vitaminA,
        food.vitaminC,
        food.vitaminD,
        food.saturatedFat,
        food.transFat,
        food.maker,
        food.importer,
        food.distributor,
        food.restaurant,
        food.originCountry,
        food.sourceName,
        food.createdAt,
        food.updatedAt,
      ],
    })),
  ]);
}

function mapNationalNutritionRow(
  row: NationalNutritionRow,
): NationalNutritionItem {
  return {
    foodCode: row.food_code,
    name: row.food_name,
    typeName: row.type_name,
    originName: row.origin_name,
    largeCategory: row.large_category,
    representativeFood: row.representative_food,
    middleCategory: row.middle_category,
    servingUnit: row.serving_unit,
    energy: row.energy,
    water: row.water,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    sugars: row.sugars,
    fiber: row.fiber,
    calcium: row.calcium,
    iron: row.iron,
    potassium: row.potassium,
    sodium: row.sodium,
    vitaminA: row.vitamin_a,
    vitaminC: row.vitamin_c,
    vitaminD: row.vitamin_d,
    saturatedFat: row.saturated_fat,
    transFat: row.trans_fat,
    maker: row.maker,
    importer: row.importer,
    distributor: row.distributor,
    restaurant: row.restaurant,
    originCountry: row.origin_country,
    sourceName: row.source_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    storedAt: normalizeStoredTimestamp(row.synced_at) ?? undefined,
  };
}

function normalizeQueryKey(query?: string) {
  return query?.trim() || DEFAULT_QUERY_KEY;
}

function normalizeStoredTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  // SQLite CURRENT_TIMESTAMP is UTC, unlike a source record's update date.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}Z` : value;
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function escapeSqlLike(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// force-dynamic 페이지(searchParams 사용)에서도 동일 쿼리는 Next.js 데이터 캐시로 서빙
// 봇이 같은 URL을 반복 방문해도 1시간 내 DB 재조회 없음.
// 실패 결과는 캐시하지 않는다: 캐시 안에서 throw하면 unstable_cache가 저장하지 않으므로
// 일시 장애가 1시간 동안 고정되지 않는다.
class UncachedNutritionFailure extends Error {
  readonly result: CachedNationalNutritionResult;
  constructor(result: CachedNationalNutritionResult) {
    super("uncached nutrition failure");
    this.result = result;
  }
}

const cachedSuccessfulNationalNutritionItems = unstable_cache(
  async (options: FetchCachedNationalNutritionOptions) => {
    const result = await fetchNationalNutritionItemsWithDbCache(options);
    if (!result.ok) throw new UncachedNutritionFailure(result);
    return result;
  },
  ["national-nutrition-db-v4-search-scope"],
  { revalidate: 3600, tags: ["national-nutrition"] },
);

export async function fetchNationalNutritionItemsWithDbCacheCached(
  options: FetchCachedNationalNutritionOptions,
): Promise<CachedNationalNutritionResult> {
  try {
    return await cachedSuccessfulNationalNutritionItems(options);
  } catch (error) {
    if (error instanceof UncachedNutritionFailure) return error.result;
    // Isolate any unexpected failure to this dataset instead of the whole page.
    return {
      ...createNationalNutritionFailureResult(getNationalNutritionDataset(options.dataset), 503, "lookup_failed"),
      cacheSource: isTursoConfigured ? "db" : "api_no_db",
      searchScope: options.source === "upstream" || !isTursoConfigured ? "upstream" : "stored",
    };
  }
}
