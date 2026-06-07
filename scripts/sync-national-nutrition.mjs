import { createClient } from "@libsql/client";

const datasets = [
  {
    slug: "all",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_info_api"
  },
  {
    slug: "food",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_food_info_api"
  },
  {
    slug: "process",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_process_info_api"
  },
  {
    slug: "material",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_material_info_api"
  },
  {
    slug: "health",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_health_functional_food_nutrition_info_api"
  }
];

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
const serviceKey = (
  process.env.DATA_GO_KR_NUTRITION_KEY ||
  process.env.DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY ||
  process.env.PUBLIC_DATA_SERVICE_KEY ||
  process.env.DATA_GO_KR_SERVICE_KEY ||
  ""
).trim();

const pages = Number(process.env.NUTRITION_SYNC_PAGES || "3");
const rowsPerPage = Number(process.env.NUTRITION_SYNC_ROWS || "50");

if (!databaseUrl || !authToken) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.");
}

if (!serviceKey) {
  throw new Error("DATA_GO_KR_NUTRITION_KEY or DATA_GO_KR_SERVICE_KEY is required.");
}

const db = createClient({
  url: databaseUrl,
  authToken
});

await ensureSchema();

const summary = [];
for (const dataset of datasets) {
  let saved = 0;
  let totalCount = 0;
  let errorMessage = "";

  for (let pageNo = 1; pageNo <= pages; pageNo += 1) {
    let result;
    try {
      result = await fetchDatasetPage(dataset, pageNo, rowsPerPage);
      totalCount = Math.max(totalCount, result.totalCount);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      break;
    }

    if (result.rows.length === 0) {
      break;
    }

    await saveRows(dataset.slug, result.totalCount, result.rows.map(normalizeItem));
    saved += result.rows.length;
  }

  summary.push({ dataset: dataset.slug, saved, totalCount, error: errorMessage || null });
}

console.log(JSON.stringify({ ok: true, pages, rowsPerPage, summary }, null, 2));

async function ensureSchema() {
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
    "CREATE INDEX IF NOT EXISTS idx_national_nutrition_items_name ON national_nutrition_items(food_name)"
  ]);
}

async function fetchDatasetPage(dataset, pageNo, numOfRows) {
  const url = buildUrl(dataset.endpoint, pageNo, numOfRows);
  const response = await fetchWithHttpFallback(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${dataset.slug} HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text);
  const header = payload?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`${dataset.slug} result ${header?.resultCode || "unknown"}: ${header?.resultMsg || text.slice(0, 200)}`);
  }

  const body = payload?.response?.body || {};
  const items = body.items;
  const rows = Array.isArray(items) ? items : items ? [items] : [];

  return {
    totalCount: Number(body.totalCount || rows.length),
    rows
  };
}

function buildUrl(endpoint, pageNo, numOfRows) {
  const params = new URLSearchParams();
  params.set("pageNo", String(pageNo));
  params.set("numOfRows", String(numOfRows));
  params.set("type", "json");

  return `${endpoint}?serviceKey=${serializeServiceKey(serviceKey)}&${params.toString()}`;
}

async function fetchWithHttpFallback(url) {
  const variants = [url, url.replace("https://api.data.go.kr/", "http://api.data.go.kr/")].filter(
    (value, index, values) => values.indexOf(value) === index
  );
  let lastError;

  for (const variant of variants) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await fetch(variant, {
          headers: {
            accept: "application/json,text/plain,*/*",
            "user-agent": "yungyanggogo.kr nutrition-sync/1.0"
          }
        });
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      }
    }
  }

  throw lastError;
}

async function saveRows(datasetSlug, totalCount, foods) {
  await db.batch([
    {
      sql: `INSERT INTO national_nutrition_syncs (dataset_slug, query_key, total_count, fetched_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(dataset_slug, query_key)
        DO UPDATE SET total_count = excluded.total_count, fetched_at = CURRENT_TIMESTAMP`,
      args: [datasetSlug, "__default__", totalCount]
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
        datasetSlug,
        "__default__",
        food.foodCode || `${datasetSlug}-${food.name}`,
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
        food.updatedAt
      ]
    }))
  ]);
}

function normalizeItem(item) {
  return {
    foodCode: toText(item.foodCd),
    name: toText(item.foodNm),
    typeName: toText(item.typeNm),
    originName: toText(item.foodOriginNm),
    largeCategory: toText(item.foodLv3Nm),
    representativeFood: toText(item.foodLv4Nm),
    middleCategory: toText(item.foodLv5Nm),
    servingUnit: toText(item.nutConSrtrQua) || toText(item.ntrtIgrdPvsnUnitAmnt),
    energy: toText(item.enerc),
    water: toText(item.water),
    protein: toText(item.prot),
    fat: toText(item.fatce),
    carbs: toText(item.chocdf),
    sugars: toText(item.sugar),
    fiber: toText(item.fibtg),
    calcium: toText(item.ca),
    iron: toText(item.fe),
    potassium: toText(item.k),
    sodium: toText(item.nat),
    vitaminA: toText(item.vitaRae),
    vitaminC: toText(item.vitc),
    vitaminD: toText(item.vitd),
    saturatedFat: toText(item.fasat),
    transFat: toText(item.fatrn),
    maker: toText(item.mfrNm),
    importer: toText(item.imptNm),
    distributor: toText(item.distNm),
    restaurant: toText(item.restNm),
    originCountry: toText(item.cooNm) || toText(item.foodCooRgnNm),
    sourceName: toText(item.srcNm),
    createdAt: formatDate(toText(item.crtYmd)),
    updatedAt: formatDate(toText(item.crtrYmd) || toText(item.dataCrtrYmd))
  };
}

function serializeServiceKey(value) {
  return /%[0-9a-f]{2}/i.test(value) ? value : encodeURIComponent(value);
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && /^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return value;
}

function toText(value) {
  return value == null ? "" : String(value).trim();
}
