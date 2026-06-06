import { absoluteUrl } from "./site";

export type FoodMetric = {
  label: string;
  value: string;
  unit: string;
  note: string;
};

export type FoodProduct = {
  slug: string;
  name: string;
  maker: string;
  category: string;
  serving: string;
  updatedAt: string;
  reviewer: string;
  description: string;
  metrics: FoodMetric[];
  claims: {
    label: string;
    met: boolean;
    basis: string;
  }[];
  percentile: {
    label: string;
    value: number;
  };
};

export const foods: FoodProduct[] = [
  {
    slug: "protein-ready-meal-sample",
    name: "단백질 간편식 샘플",
    maker: "영양고고 데이터 예시",
    category: "단백질식품",
    serving: "1팩 180g",
    updatedAt: "2026-06",
    reviewer: "영양고고 편집팀",
    description:
      "목적형 랭킹과 제품 상세 화면의 구조를 보여주기 위한 예시 데이터입니다. 실제 제품 DB 연동 전까지 기준량과 판정 UI를 검증합니다.",
    metrics: [
      { label: "열량", value: "198", unit: "kcal", note: "1회 제공량" },
      { label: "단백질", value: "18.4", unit: "g", note: "100kcal당 9.3g" },
      { label: "당류", value: "3.2", unit: "g", note: "동일군 하위 22%" },
      { label: "나트륨", value: "410", unit: "mg", note: "동일군 중간" }
    ],
    claims: [
      { label: "고단백", met: true, basis: "식품등의 표시기준상 단백질 강조표시 기준과 비교" },
      { label: "저당", met: true, basis: "100g당 당류 수치 기준 검토" },
      { label: "저나트륨", met: false, basis: "나트륨 강조표시 기준에는 미달" }
    ],
    percentile: {
      label: "동일 카테고리 단백질 백분위",
      value: 78
    }
  }
];

export const rankingGroups = [
  {
    slug: "high-protein",
    title: "단백질 높은 간편식",
    metric: "100kcal당 단백질",
    description: "같은 열량 안에서 단백질 밀도가 높은 제품을 먼저 비교합니다.",
    productSlug: "protein-ready-meal-sample"
  },
  {
    slug: "low-calorie",
    title: "칼로리 낮은 간식",
    metric: "1회 제공량 열량",
    description: "제품별 1회 제공량을 분리해 열량 기준으로 정렬합니다.",
    productSlug: "protein-ready-meal-sample"
  },
  {
    slug: "low-sugar",
    title: "당류 낮은 음료",
    metric: "100ml당 당류",
    description: "용량 차이를 줄이기 위해 100ml 기준 당류를 우선 확인합니다.",
    productSlug: "protein-ready-meal-sample"
  },
  {
    slug: "low-sodium",
    title: "나트륨 낮은 라면",
    metric: "1회 제공량 나트륨",
    description: "나트륨 수치와 열량, 포화지방을 같이 보는 랭킹입니다.",
    productSlug: "protein-ready-meal-sample"
  }
];

export function getFoodBySlug(slug: string) {
  return foods.find((food) => food.slug === slug);
}

export function getFoodUrl(food: FoodProduct) {
  return absoluteUrl(`/foods/${food.slug}`);
}
