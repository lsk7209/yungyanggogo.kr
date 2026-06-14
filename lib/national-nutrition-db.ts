import { unstable_cache } from "next/cache";
import { getDb, isTursoConfigured } from "./db";
import {
  fetchNationalNutritionItems,
  getNationalNutritionDataset,
  type NationalNutritionDatasetSlug,
  type NationalNutritionItem,
  type NationalNutritionResult,
} from "./national-nutrition-api";

const DEFAULT_QUERY_KEY = "__default__";

// DDL을 매 요청마다 실행하지 않도록 초기화 완료 여부 추적 (프로세스 수명 동안 1회만 실행)
let schemaReady = false;

type FetchCachedNationalNutritionOptions = {
  dataset?: NationalNutritionDatasetSlug;
  query?: string;
  pageNo?: number;
  numOfRows?: number;
};

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
};

export async function fetchNationalNutritionItemsWithDbCache({
  dataset = "all",
  query,
  pageNo = 1,
  numOfRows = 12,
}: FetchCachedNationalNutritionOptions = {}): Promise<
  NationalNutritionResult & { cacheSource: "db" | "api" | "api_no_db" }
> {
  const selectedDataset = getNationalNutritionDataset(dataset);

  if (!isTursoConfigured) {
    const result = await fetchNationalNutritionItems({
      dataset,
      query,
      pageNo,
      numOfRows,
    });
    return { ...result, cacheSource: "api_no_db" };
  }

  await ensureNationalNutritionSchema();

  const cached = await readNationalNutritionItemsFromDb({
    dataset,
    query,
    pageNo,
    numOfRows,
  });
  if (cached.foods.length > 0) {
    return {
      ok: true,
      status: 200,
      dataset: selectedDataset,
      totalCount: cached.totalCount,
      count: cached.foods.length,
      foods: cached.foods,
      cacheSource: "db",
      message: "",
    };
  }

  const result = await fetchNationalNutritionItems({
    dataset,
    query,
    pageNo,
    numOfRows,
  });
  if (result.foods.length > 0) {
    await saveNationalNutritionItemsToDb({
      dataset,
      query,
      totalCount: result.totalCount,
      foods: result.foods,
    });
  }

  return { ...result, cacheSource: "api" };
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
  const queryKey = normalizeQueryKey(query);
  const limit = Math.max(1, Math.floor(numOfRows));
  const offset = (Math.max(1, Math.floor(pageNo)) - 1) * limit;

  const [syncResult, rowsResult] = await Promise.all([
    db.execute({
      sql: "SELECT total_count FROM national_nutrition_syncs WHERE dataset_slug = ? AND query_key = ?",
      args: [dataset, queryKey],
    }),
    db.execute({
      sql: `SELECT * FROM national_nutrition_items
        WHERE dataset_slug = ? AND query_key = ?
        ORDER BY synced_at DESC, food_name ASC
        LIMIT ? OFFSET ?`,
      args: [dataset, queryKey, limit, offset],
    }),
  ]);

  const totalCount = Number(
    syncResult.rows[0]?.total_count || rowsResult.rows.length,
  );
  const foods = rowsResult.rows.map((row) =>
    mapNationalNutritionRow(row as unknown as NationalNutritionRow),
  );

  return { totalCount, foods };
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
      ORDER BY synced_at DESC
      LIMIT 1`,
    args: [dataset, foodCode],
  });

  const row = result.rows[0];
  return row
    ? mapNationalNutritionRow(row as unknown as NationalNutritionRow)
    : null;
}

export async function readRelatedNationalNutritionItemsFromDb({
  dataset,
  foodCode,
  limit = 6,
}: {
  dataset: NationalNutritionDatasetSlug;
  foodCode: string;
  limit?: number;
}) {
  if (!isTursoConfigured) {
    return [] as NationalNutritionItem[];
  }

  await ensureNationalNutritionSchema();

  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM national_nutrition_items
      WHERE dataset_slug = ? AND food_code <> ?
      ORDER BY synced_at DESC, food_name ASC
      LIMIT ?`,
    args: [dataset, foodCode, Math.max(1, Math.floor(limit))],
  });

  return result.rows.map((row) =>
    mapNationalNutritionRow(row as unknown as NationalNutritionRow),
  );
}

export async function fetchNationalNutritionItemDetail({
  dataset,
  foodCode,
}: {
  dataset: NationalNutritionDatasetSlug;
  foodCode: string;
}) {
  const cached = await readNationalNutritionItemByCodeFromDb({
    dataset,
    foodCode,
  });
  if (cached) {
    return {
      item: cached,
      cacheSource: "db" as const,
    };
  }

  const result = await fetchNationalNutritionItemsWithDbCache({
    dataset,
    numOfRows: 50,
  });
  const item = result.foods.find((food) => food.foodCode === foodCode) || null;

  return {
    item,
    cacheSource: result.cacheSource,
  };
}

export async function saveNationalNutritionItemsToDb({
  dataset,
  query,
  totalCount,
  foods,
}: {
  dataset: NationalNutritionDatasetSlug;
  query?: string;
  totalCount: number;
  foods: NationalNutritionItem[];
}) {
  const db = getDb();
  const queryKey = normalizeQueryKey(query);

  await db.batch([
    {
      sql: `INSERT INTO national_nutrition_syncs (dataset_slug, query_key, total_count, fetched_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(dataset_slug, query_key)
        DO UPDATE SET total_count = excluded.total_count, fetched_at = CURRENT_TIMESTAMP`,
      args: [dataset, queryKey, totalCount],
    },
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
        food.foodCode || `${dataset}-${food.name}`,
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
  };
}

function normalizeQueryKey(query?: string) {
  return query?.trim() || DEFAULT_QUERY_KEY;
}

// force-dynamic 페이지(searchParams 사용)에서도 동일 쿼리는 Next.js 데이터 캐시로 서빙
// 봇이 같은 URL을 반복 방문해도 1시간 내 DB 재조회 없음
export const fetchNationalNutritionItemsWithDbCacheCached = unstable_cache(
  (options: FetchCachedNationalNutritionOptions) =>
    fetchNationalNutritionItemsWithDbCache(options),
  ["national-nutrition-db"],
  { revalidate: 3600, tags: ["national-nutrition"] },
);
