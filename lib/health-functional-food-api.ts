export const HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT = "https://openapi.foodsafetykorea.go.kr/api";
export const HEALTH_FUNCTIONAL_FOOD_SERVICE_ID = "C003";
export const HEALTH_FUNCTIONAL_FOOD_SOURCE = "건강기능식품 품목제조신고(원재료)";

export type HealthFunctionalFoodItem = {
  reportNo: string;
  name: string;
  maker: string;
  shape: string;
  approvedAt: string;
  updatedAt: string;
  licenseNo: string;
  functionality: string;
  intakeCaution: string;
  standards: string;
  disposition: string;
};

type RawHealthFunctionalFoodItem = Record<string, string | number | null | undefined>;

type FetchHealthFunctionalFoodItemsOptions = {
  query?: string;
  startIdx?: number;
  endIdx?: number;
};

const MAX_END_IDX = 100;
const REQUEST_TIMEOUT_MS = 9000;

export function getFoodSafetyKoreaApiKey() {
  return (
    process.env.FOODSAFETYKOREA_API_KEY ||
    process.env.FOOD_SAFETY_KOREA_API_KEY ||
    process.env.FOODSAFETY_API_KEY ||
    ""
  ).trim();
}

export function normalizeHealthFunctionalFoodItem(
  item: RawHealthFunctionalFoodItem
): HealthFunctionalFoodItem {
  return {
    reportNo: toText(item.PRDLST_REPORT_NO),
    name: toText(item.PRDLST_NM),
    maker: toText(item.BSSH_NM),
    shape: toText(item.PRDT_SHAP_CD_NM),
    approvedAt: formatDate(toText(item.PRMS_DT)),
    updatedAt: formatDate(toText(item.LAST_UPDT_DTM) || toText(item.CRET_DTM)),
    licenseNo: toText(item.LCNS_NO),
    functionality: cleanText(toText(item.PRIMARY_FNCLTY)),
    intakeCaution: cleanText(toText(item.IFTKN_ATNT_MATR_CN)),
    standards: cleanText(toText(item.STDR_STND)),
    disposition: cleanText(toText(item.DISPOS))
  };
}

export async function fetchHealthFunctionalFoodItems({
  query,
  startIdx = 1,
  endIdx = 24
}: FetchHealthFunctionalFoodItemsOptions = {}) {
  const serviceKey = getFoodSafetyKoreaApiKey();

  if (!serviceKey) {
    return {
      ok: false,
      status: 503,
      totalCount: 0,
      foods: [] as HealthFunctionalFoodItem[],
      message:
        "FoodSafetyKorea API 키가 서버 환경변수에 없습니다. FOODSAFETYKOREA_API_KEY를 설정하면 건강기능식품 품목제조신고 데이터를 표시합니다."
    };
  }

  const safeStart = Math.max(1, Math.floor(startIdx));
  const safeEnd = Math.min(MAX_END_IDX, Math.max(safeStart, Math.floor(endIdx)));
  const url = `${HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT}/${serviceKey}/${HEALTH_FUNCTIONAL_FOOD_SERVICE_ID}/json/${safeStart}/${safeEnd}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      signal: controller.signal
    });
    const text = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        totalCount: 0,
        foods: [] as HealthFunctionalFoodItem[],
        message: text.slice(0, 500)
      };
    }

    const payload = JSON.parse(text) as unknown;
    const { rows, totalCount, resultCode, resultMessage } = extractHealthFunctionalFoodItems(payload);
    const foods = rows.map(normalizeHealthFunctionalFoodItem);
    const filteredFoods = filterHealthFunctionalFoods(foods, query);

    return {
      ok: resultCode === "INFO-000",
      status: response.status,
      totalCount,
      resultCode,
      foods: filteredFoods,
      message: resultCode === "INFO-000" ? "" : resultMessage || text.slice(0, 500)
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "FoodSafetyKorea API 응답 시간이 초과되었습니다."
        : error instanceof Error
          ? error.message
          : "FoodSafetyKorea API 응답을 처리하지 못했습니다.";

    return {
      ok: false,
      status: 502,
      totalCount: 0,
      foods: [] as HealthFunctionalFoodItem[],
      message
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractHealthFunctionalFoodItems(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {
      rows: [] as RawHealthFunctionalFoodItem[],
      totalCount: 0,
      resultCode: "",
      resultMessage: ""
    };
  }

  const root = (payload as { C003?: unknown }).C003;
  if (!root || typeof root !== "object") {
    return {
      rows: [] as RawHealthFunctionalFoodItem[],
      totalCount: 0,
      resultCode: "",
      resultMessage: ""
    };
  }

  const record = root as {
    row?: unknown;
    total_count?: string | number;
    RESULT?: { CODE?: string; MSG?: string };
  };
  const rows = Array.isArray(record.row)
    ? (record.row as RawHealthFunctionalFoodItem[])
    : record.row && typeof record.row === "object"
      ? [record.row as RawHealthFunctionalFoodItem]
      : [];

  return {
    rows,
    totalCount: Number(record.total_count || rows.length),
    resultCode: record.RESULT?.CODE || "",
    resultMessage: record.RESULT?.MSG || ""
  };
}

function filterHealthFunctionalFoods(foods: HealthFunctionalFoodItem[], query?: string) {
  const keyword = query?.trim().toLowerCase();
  if (!keyword) {
    return foods;
  }

  return foods.filter((food) =>
    [food.name, food.maker, food.functionality, food.intakeCaution]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  );
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatDate(value: string) {
  if (!/^\d{8}$/.test(value)) {
    return value;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function toText(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}
