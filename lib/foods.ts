import { absoluteUrl } from "./site";

export type FoodMetric = {
  label: string;
  value: string;
  unit: string;
  note: string;
};

export type FoodProduct = {
  isExample: boolean;
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

export type RankingGroup = {
  slug: string;
  title: string;
  metric: string;
  description: string;
  formula: string;
  keyInsight: string;
  guideLink: string;
  guideLabel: string;
};

export const foods: FoodProduct[] = [
  {
    slug: "protein-ready-meal-sample",
    isExample: true,
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

export const rankingGroups: RankingGroup[] = [
  {
    slug: "high-protein",
    title: "단백질 높은 간편식",
    metric: "100kcal당 단백질",
    description: "같은 열량 안에서 단백질 밀도를 비교할 때 사용할 기준입니다.",
    formula: "단백질(g) ÷ 총열량(kcal) × 100",
    keyInsight: "단순 단백질 총량만 보면 열량이 높은 제품이 우세해 보이지만, 100kcal당으로 환산하면 불필요한 지방이나 탄수화물 대비 단백질 효율을 투명하게 비교할 수 있습니다. 나트륨과 포화지방도 함께 확인하세요.",
    guideLink: "/blog/fried-chicken-nutrition-100g-compare",
    guideLabel: "치킨·단백질 메뉴 100g 비교 가이드"
  },
  {
    slug: "low-calorie",
    title: "칼로리 낮은 간식",
    metric: "1회 제공량 열량",
    description: "제품별 1회 제공량을 구분해 열량을 비교할 때 사용할 기준입니다.",
    formula: "표시 열량(kcal) × 섭취량(g) ÷ 기준량(g)",
    keyInsight: "포장 단위와 1회 제공량이 다르면 '한 봉지 칼로리' 착시가 발생합니다. 총내용량과 1회 제공량을 분리하고 100g 단위 밀도와 실제 섭취량을 대조해야 합니다.",
    guideLink: "/tools/label-converter",
    guideLabel: "영양성분표 100g 환산 계산기"
  },
  {
    slug: "low-sugar",
    title: "당류 낮은 음료",
    metric: "100ml당 당류",
    description: "용량 차이를 줄이기 위해 100ml 기준 당류를 확인합니다.",
    formula: "당류(g) ÷ 총용량(ml) × 100",
    keyInsight: "음료는 캔·페트병 용량이 제각각이어서 한 캔 기준 당류가 작아 보여도 대용량 제품일수록 과다 섭취 위험이 있습니다. 100ml당 2.5g 미만(법적 저당 기준) 충족 여부를 확인하세요.",
    guideLink: "/blog/snack-nutrition-100g-compare",
    guideLabel: "과자·스낵 당류 100g 비교 가이드"
  },
  {
    slug: "low-sodium",
    title: "나트륨 낮은 라면",
    metric: "1회 제공량 나트륨",
    description: "나트륨 수치와 열량, 포화지방을 함께 확인하는 비교 기준입니다.",
    formula: "표시 나트륨(mg) (국물 섭취 비율에 따라 조절)",
    keyInsight: "라면류의 나트륨은 상당 부분이 면이 아닌 분말스프(국물)에 집중되어 있습니다. 면만 섭취할 때와 국물까지 완식할 때의 실제 나트륨 격차를 인지하고 면류/건면 기준을 비교하세요.",
    guideLink: "/blog/sauce-sodium-100g-compare",
    guideLabel: "소스·양념류 나트륨 비교 가이드"
  }
];

export function getFoodBySlug(slug: string) {
  return foods.find((food) => food.slug === slug);
}

export function getFoodUrl(food: FoodProduct) {
  return absoluteUrl(`/foods/${food.slug}`);
}
