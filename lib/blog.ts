import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { absoluteUrl } from "./site";

export type BlogSection = {
  id: string;
  title: string;
  body: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  mainKeyword: string;
  expandedKeywords: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  noindex?: boolean;
  summaryCards: {
    label: string;
    value: string;
    description: string;
  }[];
  comparisonRows: {
    basis: string;
    bestFor: string;
    caution: string;
  }[];
  checklist: string[];
  dataPoints?: {
    label: string;
    value: string;
    note: string;
  }[];
  steps?: {
    title: string;
    body: string;
  }[];
  warningBox?: {
    title: string;
    body: string;
  };
  faq?: {
    question: string;
    answer: string;
  }[];
  sections: BlogSection[];
  internalLinks: {
    href: string;
    label: string;
    description: string;
  }[];
  sourceLinks: {
    href: string;
    label: string;
    description: string;
  }[];
};

export const seedBlogPosts: BlogPost[] = [
  {
    slug: "nutrition-label-comparison-basis",
    title: "영양성분표 비교: 100g·100kcal 기준으로 식품영양성분 읽는 법",
    subtitle:
      "식품영양성분 비교에서 1회제공량 착시를 줄이고, 저당·저열량·고단백 표시 기준까지 함께 확인하는 실전 해석 가이드",
    description:
      "영양성분표 비교는 100g, 100ml, 100kcal, 1회제공량을 구분해야 정확합니다. 식품영양성분을 목적별로 읽는 기준과 주의점을 정리합니다.",
    category: "데이터 기준",
    mainKeyword: "영양성분표 비교",
    expandedKeywords: ["식품영양성분", "100g 기준", "100kcal 기준", "1회제공량", "저당 표시 기준"],
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 9,
    summaryCards: [
      {
        label: "먼저 볼 기준",
        value: "100g·100ml",
        description: "같은 무게나 용량으로 비교해야 제품 간 농도 차이가 보입니다."
      },
      {
        label: "보조 기준",
        value: "100kcal",
        description: "같은 열량 안에서 단백질, 당류, 나트륨 밀도를 확인합니다."
      },
      {
        label: "주의할 숫자",
        value: "1회제공량",
        description: "제조사가 정한 양이 달라 비교 착시가 생길 수 있습니다."
      }
    ],
    comparisonRows: [
      {
        basis: "100g 기준",
        bestFor: "과자, 시리얼, 즉석식품처럼 중량 차이가 큰 제품 비교",
        caution: "실제로 한 번에 먹는 양이 100g보다 훨씬 적거나 많을 수 있음"
      },
      {
        basis: "100ml 기준",
        bestFor: "음료, 우유, 액상 단백질 제품의 당류와 열량 비교",
        caution: "캔, 병, 컵 용량이 다르면 총섭취량을 따로 계산해야 함"
      },
      {
        basis: "100kcal 기준",
        bestFor: "단백질 밀도, 나트륨 밀도처럼 같은 열량 안의 효율 비교",
        caution: "저칼로리 제품이 무조건 더 좋은 제품이라는 뜻은 아님"
      },
      {
        basis: "1회제공량",
        bestFor: "실제 한 번 먹을 때 섭취하는 열량, 당류, 나트륨 확인",
        caution: "제품마다 1회제공량 설정이 달라 랭킹 기준으로 쓰기엔 불안정"
      }
    ],
    checklist: [
      "제품명만 보지 말고 기준량이 100g인지, 1회제공량인지 먼저 확인합니다.",
      "단백질이 높은 제품은 나트륨과 포화지방도 같이 확인합니다.",
      "저당, 저열량, 고단백 같은 표현은 수치와 법정 기준을 함께 봅니다.",
      "공식 데이터 기준일자와 제품 포장지의 최신 표시가 다른지 확인합니다.",
      "랭킹은 선택을 돕는 도구일 뿐, 건강 효능을 보증하는 문장으로 읽지 않습니다."
    ],
    sections: [
      {
        id: "why-basis-matters",
        title: "영양성분표 비교는 기준량을 맞추는 일부터 시작합니다",
        body: [
          "영양성분표 비교에서 가장 흔한 실수는 숫자만 보고 제품을 바로 판단하는 것입니다. 어떤 제품은 100g 기준으로 열량과 당류를 표시하고, 어떤 제품은 1회제공량 기준으로 표시합니다. 숫자가 작아 보여도 기준량이 작으면 실제로는 더 진한 제품일 수 있고, 숫자가 커 보여도 기준량이 커서 그렇게 보일 수 있습니다.",
          "예를 들어 한 과자는 30g 기준으로 당류 7g을 표시하고, 다른 과자는 100g 기준으로 당류 18g을 표시할 수 있습니다. 겉보기에는 7g이 낮아 보이지만 100g으로 환산하면 약 23.3g입니다. 영양고고가 100g, 100ml, 100kcal 기준을 분리해서 보여주려는 이유가 여기에 있습니다.",
          "따라서 식품영양성분을 비교할 때는 제품명, 브랜드, 광고 문구보다 기준량을 먼저 확인해야 합니다. 기준량이 맞지 않으면 단백질, 당류, 나트륨, 포화지방의 순위가 쉽게 뒤바뀝니다."
        ]
      },
      {
        id: "normalization",
        title: "100g 기준과 100kcal 기준은 서로 다른 질문에 답합니다",
        body: [
          "100g 기준은 같은 무게로 비교하는 방식입니다. 과자, 시리얼, 즉석식품처럼 제품마다 포장량과 1회제공량이 다른 경우에 유용합니다. 100g당 당류가 낮은지, 나트륨이 높은지, 단백질이 어느 정도인지 보면 제품 자체의 영양 밀도를 비교하기 쉽습니다.",
          "반면 100kcal 기준은 같은 열량 안에서 무엇을 얼마나 얻는지 보는 방식입니다. 단백질 식품을 고를 때 특히 중요합니다. A 제품은 200kcal에 단백질 18g이고, B 제품은 120kcal에 단백질 10g이라면 단순 단백질 총량은 A가 높지만 100kcal당 단백질은 각각 9g, 8.3g입니다. 차이는 있지만 생각보다 작을 수 있습니다.",
          "두 기준은 우열이 아니라 역할이 다릅니다. 100g 기준은 제품의 농도를 보고, 100kcal 기준은 열량 대비 효율을 봅니다. 영양성분표 비교 글이나 랭킹에서 두 기준을 섞어 쓰면 사용자는 왜 어떤 제품이 위에 있는지 이해하기 어렵습니다."
        ]
      },
      {
        id: "serving-size",
        title: "1회제공량은 실생활에 가깝지만 랭킹 기준으로는 조심해야 합니다",
        body: [
          "1회제공량은 실제 섭취량을 떠올리기 쉬운 장점이 있습니다. 음료 한 캔, 컵라면 한 개, 단백질바 한 개처럼 제품 단위가 분명할 때는 1회제공량 기준 열량과 나트륨을 보는 것이 현실적입니다.",
          "문제는 1회제공량이 제품마다 다르게 설정된다는 점입니다. 어떤 스낵은 30g을 1회로 잡고, 어떤 스낵은 60g을 1회로 잡습니다. 이때 1회제공량당 열량만 비교하면 작은 단위로 쪼갠 제품이 더 낮아 보일 수 있습니다.",
          "그래서 영양고고의 방향은 1회제공량을 버리는 것이 아니라 위치를 분리하는 것입니다. 사용자가 실제로 먹을 양을 확인할 때는 1회제공량을 보여주고, 제품 간 랭킹을 만들 때는 100g, 100ml, 100kcal 같은 정규화 기준을 함께 표시합니다."
        ]
      },
      {
        id: "claim-guardrails",
        title: "저당·저열량·고단백 표현은 수치와 기준을 함께 봐야 합니다",
        body: [
          "저당, 저열량, 고단백 같은 표현은 클릭을 유도하기 좋은 말이지만, 영양성분표 비교에서는 더 엄격하게 다뤄야 합니다. 이런 표현은 단순한 느낌표가 아니라 기준과 수치가 같이 있어야 사용자가 오해하지 않습니다.",
          "예를 들어 당류가 낮아 보이는 제품도 기준량이 작으면 100g당 당류는 높을 수 있습니다. 단백질이 높은 제품도 나트륨이 높거나 포화지방이 높은 경우가 있습니다. 고단백이라는 한 단어만 보고 선택하면 다른 지표를 놓치기 쉽습니다.",
          "영양고고에서는 강조표시를 ‘좋다’ 또는 ‘나쁘다’로 단정하지 않고, 충족 여부와 판단 기준을 나란히 보여주는 방식을 택합니다. 충족은 초록색 체크, 미충족은 회색 대시로 표시해 불필요한 공포감을 줄이는 것도 같은 이유입니다."
        ]
      },
      {
        id: "public-data",
        title: "공공데이터 API를 쓸 때도 원천과 갱신일을 같이 보여줘야 합니다",
        body: [
          "식품의약품안전처_식품영양성분DB정보는 식품명, 분류, 식품코드, 영양성분 함량 기준량, 에너지, 탄수화물, 단백질, 지방, 출처, 데이터 기준일자 등을 제공하는 공공데이터입니다. 영양성분표 비교 사이트라면 이 원천 정보를 숨기지 않고 화면에서 확인할 수 있게 해야 합니다.",
          "다만 공공데이터도 제품 포장지의 최신 표시와 항상 동시에 바뀌지는 않습니다. 제품 리뉴얼, 중량 변경, 원재료 변경이 있으면 사용자가 들고 있는 제품과 데이터베이스의 기준일자가 다를 수 있습니다. 그래서 데이터 출처와 갱신일을 같이 보여주는 것이 신뢰의 핵심입니다.",
          "이 글의 목적은 특정 제품을 추천하는 것이 아니라 비교 기준을 설명하는 것입니다. 실제 제품 상세 화면에서는 공식 API 값, 포장 단위, 기준량, 출처명, 데이터 수정일을 함께 표시해야 사용자가 숫자를 과신하지 않고 맥락을 볼 수 있습니다."
        ]
      },
      {
        id: "practical-order",
        title: "실제로는 이 순서대로 보면 실수가 줄어듭니다",
        body: [
          "첫째, 먼저 기준량을 확인합니다. 100g인지, 100ml인지, 1회제공량인지 보지 않고 열량과 당류만 비교하면 거의 항상 착시가 생깁니다. 둘째, 목적 지표를 하나 정합니다. 단백질을 찾는지, 저당 음료를 찾는지, 저나트륨 라면을 찾는지에 따라 봐야 할 첫 번째 숫자가 달라집니다.",
          "셋째, 보조 지표를 반드시 붙입니다. 단백질 랭킹에는 나트륨과 포화지방을 붙이고, 저당 랭킹에는 열량과 대체감미료 여부를 붙이며, 저칼로리 랭킹에는 포만감과 1회제공량을 같이 봅니다. 넷째, 공식 출처와 갱신일을 확인합니다.",
          "이 순서를 지키면 영양성분표 비교가 광고 문구 확인이 아니라 데이터 확인에 가까워집니다. 특히 pSEO 사이트에서는 같은 템플릿을 반복하기보다 검색 의도에 맞춰 어떤 기준을 먼저 보여줄지 달라져야 합니다."
        ]
      }
    ],
    internalLinks: [
      {
        href: "/",
        label: "식품영양성분 비교 홈",
        description: "영양고고의 데이터 원칙과 목적별 탐색 구조를 확인합니다."
      },
      {
        href: "/rankings",
        label: "식품영양성분 목적별 랭킹",
        description: "단백질, 저당, 저나트륨 등 기준별 랭킹 화면으로 이동합니다."
      },
      {
        href: "/foods/protein-ready-meal-sample",
        label: "제품 상세 데이터 화면 예시",
        description: "수치, 기준량, 출처, 강조표시 판정이 어떻게 표시되는지 확인합니다."
      }
    ],
    sourceLinks: [
      {
        href: "https://www.data.go.kr/data/15127578/openapi.do",
        label: "식품의약품안전처_식품영양성분DB정보",
        description: "식품명, 식품분류, 기준량, 에너지, 탄수화물, 단백질, 지방, 출처, 데이터 기준일자 등을 제공하는 공공데이터포털 API입니다."
      },
      {
        href: "https://various.foodsafetykorea.go.kr/nutrient/industry/openApi/info.do",
        label: "식품영양성분 데이터베이스 Open API 안내",
        description: "식품의약품안전처 식품영양성분 데이터베이스의 Open API 이용 안내 페이지입니다."
      }
    ]
  }
];

type GetPostsOptions = {
  includeScheduled?: boolean;
  now?: Date;
};

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function loadGeneratedPosts(): BlogPost[] {
  if (!existsSync(BLOG_CONTENT_DIR)) {
    return [];
  }

  return readdirSync(BLOG_CONTENT_DIR)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
      const raw = readFileSync(path.join(BLOG_CONTENT_DIR, file), "utf8");
      const parsed = JSON.parse(raw) as BlogPost | BlogPost[];
      return Array.isArray(parsed) ? parsed : [parsed];
    });
}

export function isPostPublished(post: BlogPost, now = new Date()) {
  return new Date(post.publishedAt).getTime() <= now.getTime();
}

export const blogPosts: BlogPost[] = [...seedBlogPosts, ...loadGeneratedPosts()];

export function getAllPosts(options: GetPostsOptions = {}) {
  const now = options.now || new Date();
  return [...blogPosts]
    .filter((post) => options.includeScheduled || isPostPublished(post, now))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string, options: GetPostsOptions = {}) {
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post || (!options.includeScheduled && !isPostPublished(post, options.now || new Date()))) {
    return undefined;
  }

  return post;
}

export function getPostUrl(post: BlogPost) {
  return absoluteUrl(`/blog/${post.slug}`);
}
