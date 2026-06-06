export const FOOD_NUTRITION_API_ENDPOINT =
  "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02";
export const PUBLIC_FOOD_API_SOURCE = "식품의약품안전처_식품영양성분DB정보";

export type PublicFoodApiItem = {
  foodCode: string;
  name: string;
  maker: string;
  category: string;
  servingSize: string;
  kcal: string;
  protein: string;
  fat: string;
  carbs: string;
  sugars: string;
  sodium: string;
  saturatedFat: string;
  source: string;
  updatedAt: string;
};

type RawFoodApiItem = Record<string, string | number | null | undefined>;

type FetchPublicFoodItemsOptions = {
  query?: string;
  pageNo?: string;
  numOfRows?: string;
};

export function getPublicDataServiceKey() {
  return (
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    process.env.DATA_GO_KR_SERVICE_KEY ||
    process.env.FOOD_NUTRITION_API_KEY ||
    process.env.MFDS_FOOD_API_KEY ||
    ""
  );
}

export function normalizeFoodApiItem(item: RawFoodApiItem): PublicFoodApiItem {
  return {
    foodCode: toText(item.FOOD_CD),
    name: toText(item.FOOD_NM_KR),
    maker: toText(item.MAKER_NM) || toText(item.SELLER_MANUFAC_NM) || "제조사 미상",
    category: toText(item.FOOD_CAT2_NM) || toText(item.FOOD_CAT1_NM) || "분류 미상",
    servingSize: toText(item.SERVING_SIZE),
    kcal: toText(item.AMT_NUM1),
    protein: toText(item.AMT_NUM3),
    fat: toText(item.AMT_NUM4),
    carbs: toText(item.AMT_NUM6),
    sugars: toText(item.AMT_NUM7),
    sodium: toText(item.AMT_NUM13),
    saturatedFat: toText(item.AMT_NUM24),
    source: toText(item.SUB_REF_NAME) || "식품의약품안전처 식품영양성분DB",
    updatedAt: toText(item.UPDATE_DATE) || toText(item.RESEARCH_YMD)
  };
}

export async function fetchPublicFoodItems({ query, pageNo = "1", numOfRows = "20" }: FetchPublicFoodItemsOptions) {
  const serviceKey = getPublicDataServiceKey();

  if (!serviceKey) {
    return {
      ok: false,
      status: 503,
      foods: [] as PublicFoodApiItem[],
      message:
        "공공데이터포털 서비스키가 서버 환경변수에 없습니다. PUBLIC_DATA_SERVICE_KEY 또는 DATA_GO_KR_SERVICE_KEY를 설정하면 실제 API 데이터를 표시합니다."
    };
  }

  const url = new URL(FOOD_NUTRITION_API_ENDPOINT);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", pageNo);
  url.searchParams.set("numOfRows", numOfRows);
  url.searchParams.set("type", "json");

  if (query) {
    url.searchParams.set("FOOD_NM_KR", query);
  }

  const response = await fetch(url, {
    next: { revalidate: 86400 }
  });
  const text = await response.text();

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      foods: [] as PublicFoodApiItem[],
      message: text.slice(0, 500)
    };
  }

  try {
    const payload = JSON.parse(text) as unknown;
    const foods = extractFoodApiItems(payload).map(normalizeFoodApiItem);

    return {
      ok: true,
      status: response.status,
      foods,
      message: ""
    };
  } catch {
    return {
      ok: false,
      status: 502,
      foods: [] as PublicFoodApiItem[],
      message: text.slice(0, 500)
    };
  }
}

export function extractFoodApiItems(payload: unknown): RawFoodApiItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = (payload as { response?: unknown }).response;
  const body =
    response && typeof response === "object"
      ? (response as { body?: unknown }).body
      : (payload as { body?: unknown }).body;
  if (!body || typeof body !== "object") {
    return [];
  }

  const items = (body as { items?: unknown }).items;
  const item = items && typeof items === "object" ? (items as { item?: unknown }).item : undefined;

  if (Array.isArray(item)) {
    return item as RawFoodApiItem[];
  }

  if (item && typeof item === "object") {
    return [item as RawFoodApiItem];
  }

  return [];
}

function toText(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}
