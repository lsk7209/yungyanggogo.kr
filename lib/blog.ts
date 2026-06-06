import { absoluteUrl } from "./site";

export type BlogSection = {
  id: string;
  title: string;
  body: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  noindex?: boolean;
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

export const blogPosts: BlogPost[] = [
  {
    slug: "nutrition-label-comparison-basis",
    title: "영양성분표 비교는 기준량부터 맞춰야 합니다",
    description:
      "100g, 100ml, 100kcal, 1회제공량이 섞이면 식품 비교가 쉽게 왜곡됩니다. 영양고고가 쓰는 기본 비교 원칙입니다.",
    category: "데이터 기준",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 4,
    sections: [
      {
        id: "why-basis-matters",
        title: "기준량이 다르면 같은 숫자도 다르게 보입니다",
        body: [
          "영양성분표의 숫자는 제품 자체의 좋고 나쁨을 바로 말하지 않습니다. 100g 기준인지, 1회제공량 기준인지, 또는 100ml 기준인지에 따라 같은 열량과 당류도 전혀 다른 비교가 됩니다.",
          "영양고고는 제품 간 비교에서 기준량을 먼저 표시합니다. 기준량을 확인할 수 없거나 혼재가 심한 데이터는 랭킹 계산에 넣지 않는 것을 원칙으로 둡니다."
        ]
      },
      {
        id: "normalization",
        title: "100g과 100kcal를 함께 보는 이유",
        body: [
          "100g 기준은 같은 무게로 비교할 때 유용하고, 100kcal 기준은 같은 열량 안에서 단백질, 당류, 나트륨, 포화지방의 밀도를 확인할 때 유용합니다.",
          "단일 점수로 제품을 단정하지 않고 여러 축을 함께 보여주는 방식이 식품 선택에 더 안전합니다. 특히 단백질만 높게 보는 프레임은 나트륨이나 당류 같은 다른 조건을 놓칠 수 있습니다."
        ]
      },
      {
        id: "claim-guardrails",
        title: "저당, 저열량 같은 표현은 기준과 측정값을 같이 봅니다",
        body: [
          "저당, 저열량, 무당 같은 영양강조표시는 임의의 마케팅 문구가 아니라 법정 기준이 있는 표현입니다. 영양고고는 이런 표현을 배지처럼 강조하지 않고 기준, 측정값, 충족 여부를 같이 제시하는 객관 정보로만 다룹니다.",
          "질병 예방, 치료, 완화처럼 건강 효능을 암시하는 문장은 사용하지 않습니다. 자료의 출처와 검토일을 함께 남겨 사용자가 직접 판단할 수 있게 하는 것이 기본 방향입니다."
        ]
      }
    ],
    internalLinks: [
      {
        href: "/",
        label: "식품영양성분 비교 홈",
        description: "영양고고의 비교 원칙과 향후 랭킹 허브 방향을 확인합니다."
      },
      {
        href: "/blog",
        label: "식품영양성분 블로그",
        description: "기준량, 출처, 영양강조표시 관련 글을 이어서 확인합니다."
      }
    ],
    sourceLinks: [
      {
        href: "https://www.data.go.kr/data/15127578/openapi.do",
        label: "식품의약품안전처 식품영양성분DB정보",
        description: "식품명, 영양성분 함량 기준량, 출처, 데이터 기준일자 등을 제공하는 공공데이터포털 API입니다."
      }
    ]
  }
];

export function getAllPosts() {
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostUrl(post: BlogPost) {
  return absoluteUrl(`/blog/${post.slug}`);
}
