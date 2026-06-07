export type NationalNutritionDatasetSlug = "all" | "food" | "process" | "material" | "health";

export type NationalNutritionDataset = {
  slug: NationalNutritionDatasetSlug;
  name: string;
  shortName: string;
  description: string;
  endpoint: string;
  dailyTraffic: number;
};

export type NationalNutritionItem = {
  foodCode: string;
  name: string;
  typeName: string;
  originName: string;
  largeCategory: string;
  representativeFood: string;
  middleCategory: string;
  servingUnit: string;
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
  vitaminA: string;
  vitaminC: string;
  vitaminD: string;
  saturatedFat: string;
  transFat: string;
  maker: string;
  importer: string;
  distributor: string;
  restaurant: string;
  originCountry: string;
  sourceName: string;
  createdAt: string;
  updatedAt: string;
};

type RawNationalNutritionItem = Record<string, string | number | null | undefined>;

type FetchNationalNutritionOptions = {
  dataset?: NationalNutritionDatasetSlug;
  query?: string;
  pageNo?: number;
  numOfRows?: number;
};

export type NationalNutritionResult = {
  ok: boolean;
  status: number;
  dataset: NationalNutritionDataset;
  totalCount: number;
  count: number;
  foods: NationalNutritionItem[];
  fallback?: boolean;
  resultCode?: string;
  message: string;
};

const MAX_NUM_OF_ROWS = 50;
const REQUEST_TIMEOUT_MS = 9000;
const REQUEST_HEADERS = {
  accept: "application/json,text/plain,*/*",
  "user-agent": "yungyanggogo.kr national-nutrition/1.0"
};

export const NATIONAL_NUTRITION_DATASETS: NationalNutritionDataset[] = [
  {
    slug: "all",
    name: "전국통합식품영양성분정보표준데이터",
    shortName: "전국통합",
    description: "음식, 가공식품, 원재료성 식품, 건강기능식품을 포괄하는 통합 영양성분 표준데이터입니다.",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_info_api",
    dailyTraffic: 1000
  },
  {
    slug: "food",
    name: "전국통합식품영양성분정보(음식)표준데이터",
    shortName: "음식",
    description: "외식, 프랜차이즈 등 음식 단위의 열량, 단백질, 당류, 나트륨 정보를 확인합니다.",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_food_info_api",
    dailyTraffic: 1000
  },
  {
    slug: "process",
    name: "전국통합식품영양성분정보(가공식품)표준데이터",
    shortName: "가공식품",
    description: "제품 신고번호, 제조사, 수입 여부와 함께 가공식품 영양성분을 표시합니다.",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_process_info_api",
    dailyTraffic: 1000
  },
  {
    slug: "material",
    name: "전국통합식품영양성분정보(원재료성식품)표준데이터",
    shortName: "원재료성",
    description: "농축수산물 등 원재료성 식품의 미량영양소와 원산지 정보를 함께 봅니다.",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_nutri_material_info_api",
    dailyTraffic: 1000
  },
  {
    slug: "health",
    name: "전국건강기능식품영양성분정보표준데이터",
    shortName: "건강기능식품",
    description: "건강기능식품 제품의 제공 단위량, 1회 섭취량, 품목제조신고번호를 확인합니다.",
    endpoint: "https://api.data.go.kr/openapi/tn_pubr_public_health_functional_food_nutrition_info_api",
    dailyTraffic: 1000
  }
];

export const NATIONAL_NUTRITION_SOURCE = "공공데이터포털 전국통합식품영양성분정보 표준데이터";

const NATIONAL_NUTRITION_SNAPSHOT: Record<NationalNutritionDatasetSlug, NationalNutritionItem[]> = {
  all: [],
  food: [
    normalizeNationalNutritionItem({
      foodCd: "D212-549000000-0040",
      foodNm: "닭튀김_마늘스태미나 치킨",
      typeNm: "음식",
      foodOriginNm: "외식(프랜차이즈 등 업체 제공 영양정보)",
      foodLv3Nm: "튀김류",
      foodLv4Nm: "닭튀김",
      foodLv5Nm: "해당없음",
      nutConSrtrQua: "100g",
      enerc: "260",
      prot: "19.04",
      sugar: "2.79",
      nat: "335",
      fasat: "2.47",
      restNm: "치킨플러스",
      srcNm: "식품의약품안전처",
      crtYmd: "2023-10-12",
      crtrYmd: "2026-04-29"
    })
  ],
  process: [
    normalizeNationalNutritionItem({
      foodCd: "P119-401040100-0187",
      foodNm: "에이스라이트",
      typeNm: "가공식품",
      foodOriginNm: "가공식품",
      foodLv3Nm: "유가공품류",
      foodLv4Nm: "발효유",
      foodLv5Nm: "발효유류(축산물가공품)",
      nutConSrtrQua: "100ml",
      enerc: "45",
      prot: "1.50",
      fatce: "0.00",
      chocdf: "9.00",
      sugar: "6.00",
      nat: "30",
      chole: "0.00",
      fasat: "0.00",
      fatrn: "0.00",
      servSize: "80ml(g)",
      foodSize: "280ml",
      itemMnftrRptNo: "198102620039",
      mfrNm: "(주)한국야쿠르트/(주)에치와이",
      imptYn: "N",
      cooNm: "해당없음",
      srcNm: "식품의약품안전처",
      crtYmd: "2020-06-30",
      crtrYmd: "2026-06-04"
    })
  ],
  material: [
    normalizeNationalNutritionItem({
      foodCd: "R105-032000002-0000",
      foodNm: "피스타치오넛_말린것",
      typeNm: "원재료성 식품",
      foodOriginNm: "식물성",
      foodLv3Nm: "견과 및 종실류",
      foodLv4Nm: "피스타치오넛",
      foodLv5Nm: "해당없음",
      nutConSrtrQua: "100g",
      enerc: "560",
      water: "4.4",
      prot: "20.16",
      fatce: "45.32",
      chocdf: "27.17",
      sugar: "7.66",
      fibtg: "10.6",
      ca: "105",
      fe: "3.92",
      k: "1025",
      nat: "1",
      vitaRae: "25",
      vitc: "5.60",
      vitd: "0.00",
      fasat: "5.91",
      fatrn: "0.00",
      imptYn: "N",
      cooNm: "해당없음",
      srcNm: "농촌진흥청(국가표준식품성분표)",
      crtYmd: "2018-12-31",
      crtrYmd: "2025-12-23"
    })
  ],
  health: [
    normalizeNationalNutritionItem({
      foodCd: "F102-054540000-0037",
      foodNm: "힐리 엠에스엠 770",
      typeNm: "건강기능식품",
      foodOriginNm: "건강기능식품",
      foodLv3Nm: "기능성 원료",
      foodLv4Nm: "엠에스엠",
      foodLv5Nm: "엠에스엠",
      ntrtIgrdPvsnUnitAmnt: "800mg",
      enerc: "3",
      prot: "0.00",
      fatce: "0.00",
      chocdf: "0.50",
      nat: "0",
      onetmQnt: "1정",
      onetmQntWghtVolm: "800mg",
      onetmIntkNmtm: "2회",
      itemMnftrRptNo: "22US32581G6",
      mfrNm: "PIONITY HEALTH&BIO EXPERT GROUP",
      imptNm: "소울드림 주식회사",
      imptYn: "Y",
      cooNm: "미국",
      srcNm: "식품의약품안전처",
      crtYmd: "2022-09-01",
      dataCrtrYmd: "2025-12-30"
    })
  ]
};

export function getNationalNutritionApiKey() {
  return (
    process.env.DATA_GO_KR_NUTRITION_KEY ||
    process.env.DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY ||
    process.env.PUBLIC_DATA_SERVICE_KEY ||
    process.env.DATA_GO_KR_SERVICE_KEY ||
    ""
  ).trim();
}

export async function fetchNationalNutritionDatasets({
  query,
  numOfRows = 6
}: Pick<FetchNationalNutritionOptions, "query" | "numOfRows"> = {}) {
  return Promise.all(
    NATIONAL_NUTRITION_DATASETS.map((dataset) =>
      fetchNationalNutritionItems({ dataset: dataset.slug, query, pageNo: 1, numOfRows })
    )
  );
}

export async function fetchNationalNutritionItems({
  dataset = "all",
  query,
  pageNo = 1,
  numOfRows = 12
}: FetchNationalNutritionOptions = {}): Promise<NationalNutritionResult> {
  const selectedDataset = getNationalNutritionDataset(dataset);
  const serviceKey = getNationalNutritionApiKey();

  if (!serviceKey) {
    return {
      ok: false,
      status: 503,
      dataset: selectedDataset,
      totalCount: 0,
      count: 0,
      foods: [],
      message:
        "공공데이터포털 전국통합식품영양성분정보 서비스키가 서버 환경변수에 없습니다. DATA_GO_KR_NUTRITION_KEY 또는 DATA_GO_KR_SERVICE_KEY를 설정하면 실제 데이터를 표시합니다."
    };
  }

  const url = buildNationalNutritionUrl({
    endpoint: selectedDataset.endpoint,
    serviceKey,
    query,
    pageNo,
    numOfRows
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchNationalNutritionResponse(url, controller.signal);
    const text = await response.text();

    if (!response.ok) {
      return fallbackNationalNutritionResult(selectedDataset, response.status, text.slice(0, 300));
    }

    const payload = JSON.parse(text) as unknown;
    const { rows, totalCount, resultCode, resultMessage } = extractNationalNutritionItems(payload);
    const foods = rows.map(normalizeNationalNutritionItem);

    if (resultCode !== "00") {
      return fallbackNationalNutritionResult(selectedDataset, response.status, resultMessage || text.slice(0, 300));
    }

    return {
      ok: true,
      status: response.status,
      dataset: selectedDataset,
      totalCount,
      count: foods.length,
      foods,
      resultCode,
      message: ""
    };
  } catch (error) {
    return fallbackNationalNutritionResult(
      selectedDataset,
      200,
      error instanceof Error ? error.message : "전국통합식품영양성분정보 API 응답을 처리하지 못했습니다."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeNationalNutritionItem(item: RawNationalNutritionItem): NationalNutritionItem {
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

export function extractNationalNutritionItems(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return emptyExtract();
  }

  const response = (payload as { response?: unknown }).response;
  if (!response || typeof response !== "object") {
    return emptyExtract();
  }

  const header = (response as { header?: { resultCode?: string; resultMsg?: string } }).header;
  const body = (response as { body?: unknown }).body;
  const bodyRecord = body && typeof body === "object" ? (body as { items?: unknown; totalCount?: number | string }) : null;
  const items = bodyRecord?.items;
  const rows = Array.isArray(items)
    ? (items as RawNationalNutritionItem[])
    : items && typeof items === "object"
      ? [items as RawNationalNutritionItem]
      : [];

  return {
    rows,
    totalCount: Number(bodyRecord?.totalCount || rows.length),
    resultCode: header?.resultCode || "",
    resultMessage: header?.resultMsg || ""
  };
}

export function getNationalNutritionDataset(slug: NationalNutritionDatasetSlug = "all") {
  return NATIONAL_NUTRITION_DATASETS.find((dataset) => dataset.slug === slug) || NATIONAL_NUTRITION_DATASETS[0];
}

function buildNationalNutritionUrl({
  endpoint,
  serviceKey,
  query,
  pageNo,
  numOfRows
}: {
  endpoint: string;
  serviceKey: string;
  query?: string;
  pageNo: number;
  numOfRows: number;
}) {
  const params = new URLSearchParams();
  params.set("pageNo", String(Math.max(1, Math.floor(pageNo))));
  params.set("numOfRows", String(Math.min(MAX_NUM_OF_ROWS, Math.max(1, Math.floor(numOfRows)))));
  params.set("type", "json");

  if (query?.trim()) {
    params.set("foodNm", query.trim());
  }

  return `${endpoint}?serviceKey=${serializeServiceKey(serviceKey)}&${params.toString()}`;
}

async function fetchNationalNutritionResponse(url: string, signal: AbortSignal) {
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

function fallbackNationalNutritionResult(
  dataset: NationalNutritionDataset,
  status: number,
  message: string
): NationalNutritionResult {
  const foods = NATIONAL_NUTRITION_SNAPSHOT[dataset.slug];

  return {
    ok: foods.length > 0,
    status,
    dataset,
    totalCount: foods.length,
    count: foods.length,
    foods,
    fallback: foods.length > 0,
    resultCode: foods.length > 0 ? "SNAPSHOT" : undefined,
    message: foods.length > 0 ? `Live API fetch failed; using verified API sample. ${message}` : message
  };
}

function serializeServiceKey(serviceKey: string) {
  return /%[0-9a-f]{2}/i.test(serviceKey) ? serviceKey : encodeURIComponent(serviceKey);
}

function emptyExtract() {
  return {
    rows: [] as RawNationalNutritionItem[],
    totalCount: 0,
    resultCode: "",
    resultMessage: ""
  };
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && /^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return value;
}

function toText(value: string | number | null | undefined) {
  return value == null ? "" : String(value).trim();
}
