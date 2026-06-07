import { healthFunctionalFoodNutritionSnapshot } from "./health-functional-food-nutrition-snapshot";

export const HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT =
  "https://api.data.go.kr/openapi/tn_pubr_public_health_functional_food_nutrition_info_api";
export const HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE = "전국건강기능식품영양성분정보표준데이터";

export type HealthFunctionalFoodNutritionItem = {
  foodCode: string;
  name: string;
  typeName: string;
  originName: string;
  largeCategory: string;
  representativeFood: string;
  middleCategory: string;
  kind: string;
  servingUnit: string;
  energy: string;
  protein: string;
  fat: string;
  carbs: string;
  sugars: string;
  fiber: string;
  calcium: string;
  iron: string;
  potassium: string;
  sodium: string;
  vitaminA: string;
  vitaminC: string;
  vitaminD: string;
  saturatedFat: string;
  transFat: string;
  oneServing: string;
  oneServingWeight: string;
  dailyIntakeCount: string;
  intakeTarget: string;
  reportNo: string;
  maker: string;
  importer: string;
  distributor: string;
  imported: string;
  originCountry: string;
  sourceName: string;
  createdAt: string;
  updatedAt: string;
};

type RawHealthFunctionalFoodNutritionItem = Record<string, string | number | null | undefined>;

type FetchHealthFunctionalFoodNutritionItemsOptions = {
  query?: string;
  pageNo?: number;
  numOfRows?: number;
};

const MAX_NUM_OF_ROWS = 100;
const REQUEST_TIMEOUT_MS = 9000;
const REQUEST_HEADERS = {
  accept: "application/json,text/plain,*/*",
  "user-agent": "yungyanggogo.kr nutrition-db/1.0"
};

export function getHealthFunctionalFoodNutritionApiKey() {
  return (
    process.env.DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY ||
    process.env.HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    process.env.DATA_GO_KR_SERVICE_KEY ||
    ""
  ).trim();
}

export function normalizeHealthFunctionalFoodNutritionItem(
  item: RawHealthFunctionalFoodNutritionItem
): HealthFunctionalFoodNutritionItem {
  return {
    foodCode: toText(item.foodCd),
    name: toText(item.foodNm),
    typeName: toText(item.typeNm),
    originName: toText(item.foodOriginNm),
    largeCategory: toText(item.foodLv3Nm),
    representativeFood: toText(item.foodLv4Nm),
    middleCategory: toText(item.foodLv5Nm),
    kind: toText(item.kind),
    servingUnit: toText(item.ntrtIgrdPvsnUnitAmnt),
    energy: toText(item.enerc),
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
    oneServing: toText(item.onetmQnt),
    oneServingWeight: toText(item.onetmQntWghtVolm),
    dailyIntakeCount: toText(item.onetmIntkNmtm),
    intakeTarget: toText(item.intkTrgt),
    reportNo: toText(item.itemMnftrRptNo),
    maker: toText(item.mfrNm),
    importer: toText(item.imptNm),
    distributor: toText(item.distNm),
    imported: toText(item.imptYn),
    originCountry: toText(item.cooNm),
    sourceName: toText(item.srcNm),
    createdAt: formatDate(toText(item.crtYmd)),
    updatedAt: formatDate(toText(item.dataCrtrYmd))
  };
}

export async function fetchHealthFunctionalFoodNutritionItems({
  query,
  pageNo = 1,
  numOfRows = 12
}: FetchHealthFunctionalFoodNutritionItemsOptions = {}) {
  const serviceKey = getHealthFunctionalFoodNutritionApiKey();

  if (!serviceKey) {
    return {
      ok: false,
      status: 503,
      totalCount: 0,
      foods: [] as HealthFunctionalFoodNutritionItem[],
      message:
        "공공데이터포털 건강기능식품 영양DB 서비스키가 서버 환경변수에 없습니다. DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY를 설정하면 실제 영양DB 데이터를 표시합니다."
    };
  }

  const url = buildHealthFunctionalFoodNutritionUrl({ serviceKey, query, pageNo, numOfRows });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchHealthFunctionalFoodNutritionResponse(url, controller.signal);
    const text = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        totalCount: 0,
        foods: [] as HealthFunctionalFoodNutritionItem[],
        message: text.slice(0, 500)
      };
    }

    const payload = JSON.parse(text) as unknown;
    const { rows, totalCount, resultCode, resultMessage } =
      extractHealthFunctionalFoodNutritionItems(payload);
    const foods = rows.map(normalizeHealthFunctionalFoodNutritionItem);

    return {
      ok: resultCode === "00",
      status: response.status,
      totalCount,
      resultCode,
      foods,
      message: resultCode === "00" ? "" : resultMessage || text.slice(0, 500)
    };
  } catch (error) {
    return {
      ok: true,
      status: 200,
      totalCount: healthFunctionalFoodNutritionSnapshot.totalCount,
      resultCode: "SNAPSHOT",
      foods: healthFunctionalFoodNutritionSnapshot.foods,
      fallback: true,
      message:
        error instanceof Error
          ? `Live API fetch failed; using verified snapshot from ${healthFunctionalFoodNutritionSnapshot.fetchedAt}. ${error.message}`
          : `Live API fetch failed; using verified snapshot from ${healthFunctionalFoodNutritionSnapshot.fetchedAt}.`
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractHealthFunctionalFoodNutritionItems(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return emptyExtract();
  }

  const response = (payload as { response?: unknown }).response;
  if (!response || typeof response !== "object") {
    return emptyExtract();
  }

  const header = (response as { header?: { resultCode?: string; resultMsg?: string } }).header;
  const body = (response as { body?: unknown }).body;
  const bodyRecord = body && typeof body === "object" ? (body as { items?: unknown; totalCount?: number }) : null;
  const items = bodyRecord?.items;
  const rows = Array.isArray(items)
    ? (items as RawHealthFunctionalFoodNutritionItem[])
    : items && typeof items === "object"
      ? [items as RawHealthFunctionalFoodNutritionItem]
      : [];

  return {
    rows,
    totalCount: Number(bodyRecord?.totalCount || rows.length),
    resultCode: header?.resultCode || "",
    resultMessage: header?.resultMsg || ""
  };
}

export function buildHealthFunctionalFoodNutritionUrl({
  serviceKey,
  query,
  pageNo = 1,
  numOfRows = 12
}: FetchHealthFunctionalFoodNutritionItemsOptions & { serviceKey: string }) {
  const params = new URLSearchParams();
  params.set("pageNo", String(Math.max(1, Math.floor(pageNo))));
  params.set("numOfRows", String(Math.min(MAX_NUM_OF_ROWS, Math.max(1, Math.floor(numOfRows)))));
  params.set("type", "json");

  if (query?.trim()) {
    params.set("foodNm", query.trim());
  }

  return `${HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT}?serviceKey=${serviceKey}&${params.toString()}`;
}

async function fetchHealthFunctionalFoodNutritionResponse(url: string, signal: AbortSignal) {
  try {
    return await fetch(url, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 86400 },
      signal
    });
  } catch (error) {
    const httpUrl = url.replace("https://api.data.go.kr/", "http://api.data.go.kr/");
    if (httpUrl === url) {
      throw error;
    }

    return fetch(httpUrl, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 86400 },
      signal
    });
  }
}

function emptyExtract() {
  return {
    rows: [] as RawHealthFunctionalFoodNutritionItem[],
    totalCount: 0,
    resultCode: "",
    resultMessage: ""
  };
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
