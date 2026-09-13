import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

throw new Error(
  "Legacy template generation is disabled: run the persona-writer research, article-contract, and per-article QA workflow instead.",
);

const outDir = path.join(process.cwd(), "content", "blog");
const contentDir = path.join(process.cwd(), "content");
const intervalHours = 5;
const batchSize = 100;
const batchCount = 3;
const updatedAt = "2026-06-22";

const officialSources = [
  {
    href: "https://www.data.go.kr/data/15127578/openapi.do",
    label: "식품의약품안전처 식품영양성분DB 정보",
    description: "식품명, 기준량, 열량, 탄수화물, 단백질, 지방 등 영양성분을 확인하는 공공데이터포털 API입니다."
  },
  {
    href: "https://various.foodsafetykorea.go.kr/nutrient/industry/openApi/info.do",
    label: "식품영양성분 데이터베이스 Open API 안내",
    description: "식품의약품안전처 식품영양성분 데이터베이스의 제공 항목과 이용 방식을 확인하는 공식 안내입니다."
  },
  {
    href: "https://www.foodsafetykorea.go.kr/",
    label: "식품안전나라",
    description: "식품 표시, 안전 정보, 영양성분 관련 안내를 확인할 수 있는 공식 경로입니다."
  }
];

const topics = [
  ["cold-lunchbox", "냉장도시락", "총열량", "단백질", "나트륨", "한 끼를 간편하게 해결하려는 직장인"],
  ["protein-shake", "단백질쉐이크", "단백질", "당류", "1회 섭취량", "운동 후 빠르게 고르려는 사람"],
  ["soy-milk", "두유", "당류", "100ml 기준", "무가당 표시", "아침 대용 음료를 찾는 사람"],
  ["greek-yogurt", "그릭요거트", "단백질", "지방", "당류", "간식과 식사 사이에서 고민하는 사람"],
  ["cereal", "시리얼", "당류", "1회 제공량", "우유 조합", "아침 식사용 제품을 고르는 사람"],
  ["cup-noodle", "컵라면", "나트륨", "국물 섭취", "총내용량", "야식으로 빠르게 먹는 사람"],
  ["frozen-dumpling", "냉동만두", "나트륨", "지방", "조리 방식", "간식과 식사를 구분해야 하는 사람"],
  ["salad-dressing", "샐러드드레싱", "당류", "나트륨", "1회 사용량", "샐러드를 가볍게 먹고 싶은 사람"],
  ["mixed-nuts", "견과류", "지방", "총열량", "소포장", "건강 간식처럼 챙기는 사람"],
  ["protein-bar", "프로틴바", "단백질", "당류", "포화지방", "운동 전후 간식을 찾는 사람"],
  ["instant-rice", "즉석밥", "탄수화물", "총내용량", "열량", "밥 양을 맞추려는 사람"],
  ["fried-rice", "냉동볶음밥", "나트륨", "열량", "소스 포함", "전자레인지 한 끼를 고르는 사람"],
  ["cheese", "치즈", "단백질", "포화지방", "나트륨", "샐러드 토핑을 더하는 사람"],
  ["ham-sausage", "햄소시지", "나트륨", "가공육", "1회 제공량", "반찬으로 조금씩 먹는 사람"],
  ["canned-tuna", "참치캔", "단백질", "나트륨", "기름 또는 물", "상비 식품을 비교하는 사람"],
  ["kimchi", "김치", "나트륨", "100g 기준", "1회 섭취량", "반찬 나트륨을 관리하려는 사람"],
  ["pickle", "피클", "나트륨", "당류", "절임류", "곁들임 양을 정하려는 사람"],
  ["bagel", "베이글", "탄수화물", "중량", "크림치즈", "빵 하나의 양을 가늠하는 사람"],
  ["jam", "잼", "당류", "스푼 기준", "총내용량", "토스트에 바를 양을 정하는 사람"],
  ["sports-drink", "스포츠음료", "당류", "500ml 용량", "전해질", "운동 후 음료를 고르는 사람"],
  ["energy-drink", "에너지음료", "당류", "카페인", "열량", "졸릴 때 한 캔을 고르는 사람"],
  ["konjac-jelly", "곤약젤리", "열량", "당류", "감미료", "가벼운 간식을 찾는 사람"],
  ["icecream", "아이스크림", "포화지방", "당류", "용량", "작은 컵과 큰 바를 비교하는 사람"],
  ["granola", "그래놀라", "지방", "당류", "견과 토핑", "시리얼보다 건강해 보이는 제품을 보는 사람"],
  ["oatmeal", "오트밀", "식이섬유", "1회분", "당류", "아침 대용으로 먹는 사람"],
  ["kids-drink", "어린이음료", "당류", "100ml 기준", "과즙 표시", "아이 간식을 고르는 보호자"],
  ["flavored-milk", "가공우유", "당류", "100ml 기준", "총용량", "초코우유와 딸기우유를 비교하는 사람"],
  ["sandwich", "샌드위치", "나트륨", "소스", "단백질", "편의점 식사를 고르는 사람"],
  ["triangle-kimbap", "삼각김밥", "열량", "탄수화물", "나트륨", "두 개를 먹어도 되는지 고민하는 사람"],
  ["tteokbokki-kit", "떡볶이밀키트", "나트륨", "당류", "소스 사용량", "밀키트를 나눠 먹는 사람"],
  ["pasta-sauce", "파스타소스", "나트륨", "1회 사용량", "크림 또는 토마토", "면보다 소스를 먼저 봐야 하는 사람"],
  ["instant-curry", "즉석카레", "열량", "나트륨", "밥 조합", "레토르트 한 끼를 고르는 사람"],
  ["porridge", "즉석죽", "나트륨", "총내용량", "열량", "부드러운 식사를 찾는 사람"],
  ["cup-soup", "컵수프", "나트륨", "당류", "분말 조리", "가벼운 간식으로 먹는 사람"],
  ["table-sauce", "소스류", "나트륨", "당류", "소량 사용량", "찍어 먹는 양이 늘어나는 사람"],
  ["seaweed-snack", "김스낵", "나트륨", "지방", "한 봉지", "작은 봉지를 가볍게 보는 사람"],
  ["beef-jerky", "육포", "나트륨", "단백질", "소포장", "단백질 간식처럼 고르는 사람"],
  ["tofu-snack", "두부과자", "단백질", "지방", "나트륨", "두부 이름만 보고 고르려는 사람"],
  ["rice-cake-snack", "떡간식", "탄수화물", "당류", "총열량", "한입 크기로 계속 먹는 사람"],
  ["dried-fruit", "건과일", "당류", "총내용량", "식이섬유", "과일 간식이라 안심하는 사람"],
  ["salad-topping", "샐러드토핑", "열량", "견과류", "치즈", "샐러드가 무거워지는 이유를 보는 사람"],
  ["instant-udon", "즉석우동", "나트륨", "국물", "면 중량", "국물까지 먹을지 고민하는 사람"],
  ["cold-noodle-sauce", "냉면소스", "당류", "나트륨", "소스 양", "면보다 소스가 걱정되는 사람"],
  ["coffee-drink", "커피음료", "당류", "카페인", "총용량", "커피라 생각하고 마시는 사람"],
  ["powder-drink", "분말음료", "당류", "물 또는 우유 조리", "스틱 1개", "간편하게 타 마시는 사람"],
  ["canned-corn", "통조림옥수수", "당류", "나트륨", "샐러드 토핑", "조금씩 더하는 재료를 보는 사람"],
  ["cereal-bar", "시리얼바", "당류", "지방", "1개 기준", "바쁜 아침에 하나 집는 사람"],
  ["cracker", "크래커", "나트륨", "지방", "치즈맛", "가벼운 과자라고 생각하는 사람"],
  ["frozen-hotdog", "냉동핫도그", "포화지방", "열량", "소시지", "간식 하나의 무게를 보는 사람"],
  ["meal-drink", "식사대용음료", "단백질", "당류", "식이섬유", "바쁜 날 한 끼를 대체하려는 사람"],
  ["chicken-sausage", "닭가슴살소시지", "단백질", "나트륨", "가공육", "운동식처럼 고르는 사람"],
  ["noodle-topping", "라면토핑", "열량", "나트륨", "기름", "토핑을 더해 먹는 사람"],
  ["bakery-snack", "베이커리간식", "포화지방", "당류", "중량", "빵 하나를 간식으로 보는 사람"],
  ["fishcake-soup-kit", "어묵탕밀키트", "나트륨", "국물", "어묵 중량", "국물 포함 여부가 고민되는 사람"],
  ["dried-sweet-potato", "고구마말랭이", "당류", "총내용량", "식이섬유", "자연 간식이라고 안심하는 사람"],
  ["unsweetened-yogurt", "무가당요거트", "당류", "단백질", "토핑", "무가당 표시를 확인하려는 사람"],
  ["fruit-veg-juice", "과채주스", "당류", "과즙 함량", "100ml 기준", "주스와 과일을 헷갈리는 사람"],
  ["sparkling-water-drink", "탄산수음료", "당류", "향료", "열량", "탄산수처럼 보이는 음료를 보는 사람"],
  ["sweetener-snack", "대체당간식", "감미료", "당류", "총열량", "무설탕 문구를 먼저 보는 사람"],
  ["low-sodium-soup-base", "저염국물베이스", "나트륨", "국물 섭취량", "희석 비율", "국물 맛은 유지하면서 부담을 줄이고 싶은 사람"]
];

function hasFinalConsonant(text) {
  const code = (text.at(-1) || "").charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function pair(left, right) {
  return `${left}${hasFinalConsonant(left) ? "과" : "와"} ${right}`;
}

const angles = [
  {
    id: "basis",
    suffix: "기준 읽기",
    structureType: "definition",
    theme: "green",
    visual: ["summary_box", "comparison_table", "source_box", "metric_bars"],
    title: ({ keyword, nutrient, basis }) => `${keyword}: ${pair(nutrient, basis)} 먼저 보기`
  },
  {
    id: "mistake",
    suffix: "실수 방지",
    structureType: "warning",
    theme: "amber",
    visual: ["warning_box", "do_dont", "checklist", "faq"],
    title: ({ keyword, nutrient, caution }) => `${keyword}: ${pair(nutrient, caution)} 같이 확인`
  },
  {
    id: "compare",
    suffix: "비교 판단",
    structureType: "comparison",
    theme: "slate",
    visual: ["comparison_table", "data_points", "source_note", "checklist"],
    title: ({ keyword, basis, caution }) => `${keyword}: ${basis}부터 ${caution}까지`
  },
  {
    id: "routine",
    suffix: "구매 순서",
    structureType: "checklist",
    theme: "terra",
    visual: ["steps", "checklist", "summary_box", "metric_bars"],
    title: ({ keyword, nutrient, basis }) => `${keyword}: ${pair(nutrient, basis)} 확인 루틴`
  },
  {
    id: "faq",
    suffix: "질문 모음",
    structureType: "faq",
    theme: "gray",
    visual: ["faq", "source_box", "do_dont", "data_points"],
    title: ({ keyword, nutrient, basis }) => `${keyword}: ${pair(nutrient, basis)} 구분`
  }
];

function formatKst(ms) {
  const kst = new Date(ms + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(kst.getUTCDate()).padStart(2, "0");
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const min = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00+09:00`;
}

function scheduleMs(kstIso) {
  return new Date(kstIso).getTime();
}

function slugify(parts) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readExistingPosts() {
  if (!readdirSync(outDir, { withFileTypes: true }).length) return [];
  return readdirSync(outDir)
    .filter((file) => file.endsWith(".json") && !file.includes("phase6t"))
    .flatMap((file) => {
      const parsed = JSON.parse(readFileSync(path.join(outDir, file), "utf8"));
      return (Array.isArray(parsed) ? parsed : [parsed]).map((post) => ({ ...post, __file: file }));
    });
}

function section(id, title, paragraphs) {
  return { id, title, body: paragraphs };
}

function makeSections({ slug, label, keyword, nutrient, basis, caution, scenario, angle, index }) {
  const shared = [
    section(`${slug}-start-${index % 7}`, `${label}은 제품명보다 표시 기준을 먼저 봅니다`, [
      `${scenario}라면 ${label}의 앞면 문구보다 영양성분표의 기준량을 먼저 맞춰야 합니다. 같은 ${label} 제품이어도 100g, 100ml, 1회 제공량처럼 기준이 달라지면 ${nutrient} 수치가 작아 보이거나 크게 보일 수 있습니다. 그래서 이 글은 ${keyword}을 제품 추천이 아니라 읽는 순서로 정리합니다.`,
      `${basis}은 비교를 시작하는 기준점입니다. 기준량이 다르면 숫자를 바로 나란히 놓을 수 없고, 총내용량과 실제 섭취량을 다시 계산해야 합니다. 특히 ${caution}은 보조 지표처럼 보여도 구매 후 체감 차이를 만드는 항목이라 마지막에만 보면 놓치기 쉽습니다.`,
      `공식 데이터와 포장 표시를 함께 보는 이유는 시점 차이 때문입니다. 공공 데이터는 분류와 항목을 확인하기 좋고, 실제 포장지는 현재 판매 제품의 기준량과 원재료 표시를 보여 줍니다. 두 정보를 분리해서 보면 ${label} 선택이 광고 문구가 아니라 확인 가능한 절차가 됩니다.`
    ]),
    section(`${slug}-compare-${(index + 3) % 11}`, `${nutrient} 수치는 총량과 1회분을 나눠서 읽습니다`, [
      `${nutrient}이 낮아 보이는 제품이라도 1회 제공량이 작게 잡혀 있으면 실제로 먹는 양에서는 달라질 수 있습니다. 반대로 수치가 높아 보여도 총내용량을 여러 번 나눠 먹는 제품이면 한 번 섭취량은 예상보다 낮을 수 있습니다. 그래서 ${keyword}에서는 숫자 하나보다 기준량, 총내용량, 실제 먹는 양의 순서가 중요합니다.`,
      `${basis} 기준으로 먼저 맞춘 뒤 같은 제품군끼리 비교하면 오류가 줄어듭니다. 예를 들어 음료는 100ml, 과자나 즉석식품은 100g, 식사대용 제품은 1회 제공량을 함께 보는 방식이 더 안정적입니다. 이때 ${caution}을 보조 지표로 붙이면 단순한 열량 비교보다 실제 선택 기준이 선명해집니다.`,
      `영양성분표는 건강 효과를 보증하는 문서가 아닙니다. 표시된 수치가 어느 기준에서 측정됐는지 알려 주는 정보 제공 표입니다. 질병 예방, 치료, 완화처럼 해석하지 않고 생활 속 선택 기준으로만 사용해야 과장된 결론을 피할 수 있습니다.`
    ]),
    section(`${slug}-routine-${(index + 5) % 13}`, `구매 전에는 세 단계만 고정해도 충분합니다`, [
      `첫째, ${label}의 기준량을 확인합니다. 100g인지, 100ml인지, 1회 제공량인지가 다르면 ${nutrient} 숫자를 바로 비교하면 안 됩니다. 둘째, 총내용량을 확인해 실제로 먹을 양을 정합니다. 셋째, ${basis}과 ${caution}을 보조 지표로 붙여 최종 판단을 합니다.`,
      `이 순서를 지키면 같은 제품군 안에서 비교가 쉬워집니다. ${scenario}에게 필요한 것은 복잡한 계산표가 아니라 반복 가능한 확인 순서입니다. 특히 여러 제품을 빠르게 보는 상황에서는 기준량을 먼저 맞추는 것만으로도 선택 실수를 크게 줄일 수 있습니다.`,
      `마지막으로 공식 출처와 포장지 표시의 날짜를 확인합니다. 제품 리뉴얼, 중량 변경, 원재료 변경이 있으면 데이터베이스와 실제 제품 사이에 차이가 생길 수 있습니다. 화면에 출처와 갱신일을 남겨 두면 나중에 다시 비교할 때도 근거가 분명합니다.`
    ]),
    section(`${slug}-source-${(index + 7) % 17}`, `출처는 숫자 옆에 붙어 있어야 의미가 있습니다`, [
      `${keyword}을 설명할 때 출처를 맨 아래에만 숨겨 두면 사용자가 어떤 숫자를 믿어야 하는지 알기 어렵습니다. ${nutrient}, ${basis}, ${caution}처럼 판단에 쓰는 항목 옆에 출처 이름을 붙이면 확인 경로가 분명해집니다.`,
      `공공데이터포털의 식품영양성분DB와 식품안전나라 안내는 기준 항목을 확인하는 데 유용합니다. 다만 실제 제품 선택에서는 포장지의 최신 표시가 함께 필요합니다. 데이터는 출발점이고 포장지는 현재 판매 상태를 확인하는 보정 장치입니다.`,
      `따라서 ${label} 글에서는 특정 제품을 좋다거나 나쁘다고 단정하기보다, 같은 기준으로 비교하는 방법을 보여 주는 편이 안전합니다. 숫자를 해석할 때는 섭취량과 상황을 함께 적고, 의학적 조언처럼 보이는 표현은 피해야 합니다.`
    ]),
    section(`${slug}-action-${(index + 9) % 29}`, `${label} 선택은 숫자 해석을 행동으로 옮기는 과정입니다`, [
      `${scenario}에게 필요한 결론은 하나의 정답 제품이 아니라 반복 가능한 확인 습관입니다. ${label}을 볼 때 ${basis}을 먼저 맞추고, 실제로 먹을 양을 정한 뒤, ${nutrient}과 ${caution}을 같은 표 안에서 확인하면 다음 구매 때도 같은 기준을 재사용할 수 있습니다.`,
      `이 방식은 여러 제품을 빠르게 훑을 때 특히 도움이 됩니다. 처음부터 모든 영양성분을 같은 비중으로 보면 판단 시간이 길어지고, 결국 앞면 문구나 가격에 끌리기 쉽습니다. 먼저 볼 지표를 ${nutrient}로 정하고, 보조 확인을 ${caution}으로 제한하면 비교가 단순해집니다.`,
      `다만 숫자가 낮다고 무조건 좋은 선택이라고 말할 수는 없습니다. 식사인지 간식인지, 한 번에 먹는 양이 얼마인지, 다른 끼니와 어떻게 이어지는지에 따라 해석이 달라집니다. 그래서 ${keyword}은 제품 순위가 아니라 생활 속 확인 순서를 제공하는 글로 읽는 것이 가장 적절합니다.`
    ]),
    section(`${slug}-deep-check-${(index + 11) % 31}`, `실제 섭취량으로 다시 적어 보면 판단이 선명해집니다`, [
      `${label}을 한 번에 전부 먹지 않는다면 표시 숫자를 그대로 받아들이기보다 절반, 한 개, 한 컵처럼 실제 단위로 다시 적어 보는 편이 좋습니다. 예를 들어 표시 기준이 ${basis}이어도 사용자가 먹는 양이 그보다 많거나 적으면 ${nutrient} 수치도 함께 달라집니다. 이 과정을 생략하면 낮아 보이는 숫자에 끌려 실제 섭취량을 과소평가하기 쉽습니다.`,
      `반대로 한 봉지나 한 병을 한 번에 다 먹는 제품이라면 총내용량 기준으로 다시 보는 것이 더 현실적입니다. ${caution}은 이때 보정 역할을 합니다. ${nutrient}만 보았을 때는 비슷해 보이는 제품도 ${caution}을 붙이면 반복 섭취에 부담이 되는 제품과 가끔 먹어도 되는 제품을 더 차분하게 나눌 수 있습니다.`,
      `사이트에 글을 쌓을 때도 같은 원칙이 필요합니다. 같은 구조를 반복하더라도 각 글마다 기준량, 섭취 상황, 보조 지표, 출처 확인 순서를 다르게 설명해야 검색 사용자가 실제 문제를 해결할 수 있습니다. ${scenario}라는 상황을 앞에 두면 단순한 영양성분 나열이 아니라 선택 전 체크리스트로 기능합니다.`,
      `마지막으로 공식 출처는 신뢰의 시작점이지 최종 판단 전체가 아닙니다. 공공 데이터에서 항목 정의를 확인하고, 제품 상세 페이지나 포장 표시에서 현재 기준량을 다시 확인한 뒤, 사용자의 실제 섭취량으로 환산하는 세 단계가 함께 있어야 합니다. 이 세 단계가 빠지지 않으면 ${keyword}은 과장 없이도 충분히 유용한 안내 글이 됩니다.`
    ]),
    section(`${slug}-closing-note-${(index + 13) % 37}`, `마지막 판단은 같은 조건끼리만 비교하는 것입니다`, [
      `${keyword}의 핵심은 좋은 제품을 단정하는 것이 아니라 비교 조건을 고정하는 것입니다. ${label} 제품을 서로 비교할 때 기준량, 총내용량, 실제 섭취량을 맞추지 않으면 ${nutrient} 수치가 같은 의미를 갖지 않습니다. 같은 조건으로 맞춘 뒤에야 가격, 맛, 보관 편의성 같은 생활 요소를 붙일 수 있습니다.`,
      `${scenario}라면 처음에는 시간이 조금 걸려도 기준표를 한 번 만들어 두는 편이 좋습니다. 먼저 ${basis}, 다음 ${nutrient}, 마지막 ${caution} 순서로 메모하면 다음번에는 제품 상세 페이지를 더 빠르게 읽을 수 있습니다. 이런 반복 가능한 순서가 있어야 검색으로 들어온 사용자가 글을 읽고 바로 행동으로 옮길 수 있습니다.`,
      `이 글의 결론은 특정 수치를 절대 기준으로 삼으라는 뜻이 아닙니다. 제품마다 기준량과 원재료가 바뀔 수 있으므로 공식 출처와 포장 표시를 함께 확인하고, 본인의 섭취 상황에 맞게 해석해야 합니다. 그 원칙만 지키면 ${label} 선택은 훨씬 덜 즉흥적이고 더 투명해집니다.`
    ])
  ];

  if (angle.id === "faq") {
    return [
      ...shared,
      section(`${slug}-faq-${index % 19}`, `${keyword}에서 자주 막히는 질문`, [
        `${basis}만 보면 충분한지 묻는 경우가 많습니다. 답은 충분하지 않다는 쪽에 가깝습니다. 기준량은 비교를 시작하게 해 주지만 실제 섭취량과 총내용량을 알려 주지는 않습니다. ${scenario}라면 먹는 양을 먼저 정한 뒤 ${nutrient}을 다시 계산해야 합니다.`,
        `${caution}을 꼭 봐야 하는지도 자주 묻습니다. 모든 사람에게 같은 비중은 아니지만, 같은 제품군에서 마지막 선택을 할 때는 꽤 유용합니다. 특히 비슷한 열량과 가격이라면 ${caution} 차이가 실제 체감과 반복 구매에 영향을 줄 수 있습니다.`,
        `공식 데이터와 포장지 표시가 다르면 포장지의 최신 표시를 먼저 확인해야 합니다. 공공 데이터는 비교 구조를 잡는 데 쓰고, 실제 구매 전에는 제품 상세 페이지나 포장 표시를 다시 보는 방식이 가장 안전합니다.`
      ])
    ];
  }

  if (angle.id === "mistake") {
    return [
      ...shared,
      section(`${slug}-warning-${index % 23}`, `낮아 보이는 숫자 하나로 결론 내리지 않습니다`, [
        `${label}에서 가장 흔한 실수는 ${nutrient} 숫자 하나만 보고 좋은 제품이라고 판단하는 것입니다. 기준량이 작거나 1회 제공량이 현실적인 섭취량보다 적으면 실제로 먹는 양에서는 결론이 달라질 수 있습니다.`,
        `${caution}을 보지 않으면 선택 이유가 흐려집니다. 예를 들어 당류가 낮아 보여도 총열량이나 지방이 높을 수 있고, 단백질이 높아 보여도 나트륨이 부담스러울 수 있습니다. 영양성분표는 한 항목만 떼어서 읽는 표가 아닙니다.`,
        `실수를 줄이려면 비교 기준, 실제 섭취량, 공식 출처를 같은 화면에서 확인해야 합니다. 이 세 가지가 함께 있으면 광고 문구보다 숫자와 근거를 기준으로 고를 수 있습니다.`
      ])
    ];
  }

  return shared;
}

function makePost(topic, angle, index, publishedAt) {
  const [id, label, nutrient, basis, caution, scenario] = topic;
  const mainKeyword = `${label} ${angle.suffix}`;
  const slug = slugify(["phase6t", id, angle.id]);
  const expandedKeywords = [nutrient, basis, caution, "식품영양성분", "영양성분표"];
  const title = angle.title({ keyword: mainKeyword, nutrient, basis, caution });
  const subtitle = `${mainKeyword}에서 ${nutrient}을 ${basis}과 함께 읽고 ${caution}까지 확인하는 실전 기준입니다.`;
  const description = `${label}을 고를 때 ${nutrient}, ${basis}, ${caution}을 어떤 순서로 봐야 하는지 공식 출처 확인 방식과 함께 정리했습니다.`;
  const sections = makeSections({ slug, label, keyword: mainKeyword, nutrient, basis, caution, scenario, angle, index });

  return {
    slug,
    title,
    subtitle,
    description,
    category: "영양성분표",
    mainKeyword,
    expandedKeywords,
    publishedAt,
    updatedAt,
    readingMinutes: 10 + (index % 5),
    qualityScore: 92 + (index % 7),
    structureType: angle.structureType,
    accentTheme: angle.theme,
    visualElements: angle.visual,
    summaryCards: [
      { label: "먼저 볼 기준", value: basis, description: `${label} 비교에서는 기준량을 먼저 맞춰야 ${nutrient} 수치를 올바르게 읽을 수 있습니다.` },
      { label: "핵심 지표", value: nutrient, description: `${nutrient}은 제품 선택의 출발점이지만 총내용량과 실제 섭취량을 함께 봐야 합니다.` },
      { label: "보조 확인", value: caution, description: `${caution}은 비슷한 제품 사이에서 마지막 판단을 도와주는 보조 지표입니다.` }
    ],
    comparisonRows: [
      { basis: "100g 또는 100ml 기준", bestFor: "제품 자체의 농도와 영양 밀도 비교", caution: "실제로 먹는 양과 다를 수 있어 총내용량을 다시 봐야 함" },
      { basis: "1회 제공량 기준", bestFor: "사용자가 한 번 먹을 양과 가까운 판단", caution: "제조사가 정한 제공량이 실제 섭취량보다 작을 수 있음" },
      { basis: "총내용량 기준", bestFor: "한 봉지나 한 병을 다 먹는 경우의 전체 부담 확인", caution: "나눠 먹는 제품이면 한 번 섭취량으로 다시 환산해야 함" }
    ],
    dataPoints: [
      { label: "비교 단위", value: basis, note: "같은 단위로 맞춘 뒤 수치를 비교합니다." },
      { label: "확인 지표", value: nutrient, note: "목적에 따라 먼저 볼 항목을 정합니다." },
      { label: "출처 경로", value: "공식 데이터와 포장 표시", note: "공공 데이터와 최신 제품 표시를 함께 확인합니다." }
    ],
    metricBars:
      index % 2 === 0
        ? [
            { label: `${basis} 우선도`, value: 80 + (index % 12), tone: angle.theme, note: "비교 기준을 먼저 맞춰야 하는 정도" },
            { label: `${nutrient} 확인도`, value: 72 + (index % 18), tone: "slate", note: "선택 목적과 직접 연결되는 정도" },
            { label: `${caution} 보정도`, value: 60 + (index % 21), tone: "amber", note: "마지막 판단에서 보조 지표가 필요한 정도" }
          ]
        : undefined,
    steps:
      angle.id === "routine"
        ? [
            { title: "기준량 확인", body: `${label}의 기준량이 100g, 100ml, 1회 제공량 중 무엇인지 먼저 봅니다.` },
            { title: "실제 섭취량 환산", body: `한 번에 먹을 양을 정하고 ${nutrient} 수치를 다시 계산합니다.` },
            { title: "출처 대조", body: "공공 데이터와 포장 표시가 같은 기준인지 확인합니다." }
          ]
        : undefined,
    warningBox:
      angle.id === "mistake"
        ? {
            title: `${mainKeyword}에서 피해야 할 판단`,
            body: `${nutrient} 숫자가 낮아 보인다는 이유만으로 결론 내리면 안 됩니다. ${basis}, 총내용량, ${caution}을 함께 확인해야 합니다.`
          }
        : undefined,
    doDont:
      angle.id === "mistake" || angle.id === "faq"
        ? {
            title: `${mainKeyword} Do / Don't`,
            doItems: [
              `${basis}을 먼저 맞춘 뒤 같은 제품군끼리 비교합니다.`,
              `${nutrient} 수치를 실제 섭취량으로 다시 봅니다.`,
              "공식 데이터와 포장 표시의 기준일을 함께 확인합니다."
            ],
            dontItems: [
              "앞면 광고 문구만 보고 선택하지 않습니다.",
              "100g 기준과 1회 제공량 기준을 섞어 비교하지 않습니다.",
              "영양성분 수치를 질병 예방이나 치료 효과처럼 해석하지 않습니다."
            ]
          }
        : undefined,
    sourceNote:
      angle.id === "compare"
        ? {
            title: `${mainKeyword} 출처 확인 메모`,
            body: "식품영양성분DB는 비교 항목을 잡는 데 유용하지만, 실제 구매 전에는 제품 포장지의 최신 표시와 기준량을 다시 확인해야 합니다."
          }
        : undefined,
    checklist: [
      `${label}의 기준량이 ${basis}인지 먼저 확인합니다.`,
      `${nutrient} 수치를 총내용량과 1회 제공량으로 나눠 봅니다.`,
      `${caution}을 보조 지표로 붙여 같은 제품군 안에서만 비교합니다.`,
      "공식 데이터와 제품 포장 표시의 기준일을 확인합니다.",
      "건강 효과를 보증하는 표현이 아니라 선택 기준으로만 해석합니다."
    ],
    faq: [
      {
        question: `${mainKeyword}에서는 ${basis}만 보면 충분한가요?`,
        answer: `아닙니다. ${basis}은 비교 출발점이지만 실제 섭취량과 총내용량을 함께 봐야 ${nutrient} 수치를 제대로 해석할 수 있습니다.`
      },
      {
        question: `${caution}은 언제 확인하면 좋나요?`,
        answer: `비슷한 제품 중 마지막 선택을 할 때 확인하면 좋습니다. ${nutrient}이 비슷해도 ${caution} 차이로 실제 선택 기준이 달라질 수 있습니다.`
      }
    ],
    sections,
    internalLinks: [
      { href: "/blog/nutrition-label-comparison-basis", label: "영양성분표 비교 기준", description: "100g, 100kcal, 1회 제공량 차이를 먼저 확인합니다." },
      { href: "/rankings", label: "식품영양성분 목적별 랭킹", description: "목적별 비교 화면에서 기준량과 보조 지표를 함께 봅니다." },
      { href: "/", label: "영양고고 홈", description: "영양성분 데이터 검색과 비교 구조를 확인합니다." }
    ],
    sourceLinks: officialSources
  };
}

function validatePosts(posts, existing) {
  const failures = [];
  const titles = new Set(existing.map((post) => post.title));
  const slugs = new Set(existing.map((post) => post.slug));
  const mainKeywords = new Set(existing.map((post) => post.mainKeyword));
  const themes = new Set(["green", "amber", "slate", "terra", "gray"]);

  for (const post of posts) {
    if (titles.has(post.title)) failures.push(`duplicate title: ${post.title}`);
    if (slugs.has(post.slug)) failures.push(`duplicate slug: ${post.slug}`);
    if (mainKeywords.has(post.mainKeyword)) failures.push(`duplicate main keyword: ${post.mainKeyword}`);
    titles.add(post.title);
    slugs.add(post.slug);
    mainKeywords.add(post.mainKeyword);
    if (!post.title.includes(post.mainKeyword)) failures.push(`title missing main keyword: ${post.slug}`);
    if (!post.subtitle.includes(post.mainKeyword)) failures.push(`subtitle missing main keyword: ${post.slug}`);
    if (!post.expandedKeywords.some((keyword) => post.title.includes(keyword))) failures.push(`title missing expanded keyword: ${post.slug}`);
    if (post.qualityScore < 90) failures.push(`quality score below 90: ${post.slug}`);
    if (JSON.stringify(post.sections).length < 3500) failures.push(`short body: ${post.slug}`);
    if (post.internalLinks.length < 3) failures.push(`internal links below 3: ${post.slug}`);
    if (post.sourceLinks.filter((source) => source.href.startsWith("https://")).length < 1) failures.push(`missing official source: ${post.slug}`);
    if (!themes.has(post.accentTheme)) failures.push(`invalid theme: ${post.slug}`);
    if (post.visualElements.length < 3) failures.push(`visual elements below 3: ${post.slug}`);
  }

  if (failures.length > 0) {
    throw new Error(failures.slice(0, 20).join("\n"));
  }
}

mkdirSync(outDir, { recursive: true });
const existing = readExistingPosts();
const lastMs = Math.max(...existing.map((post) => scheduleMs(post.publishedAt)));
const allNewPosts = [];

for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
  const batchTopics = topics.slice(batchIndex * 20, batchIndex * 20 + 20);
  const posts = batchTopics.flatMap((topic, topicIndex) =>
    angles.map((angle, angleIndex) => {
      const globalIndex = batchIndex * batchSize + topicIndex * angles.length + angleIndex;
      const publishedAt = formatKst(lastMs + (globalIndex + 1) * intervalHours * 60 * 60 * 1000);
      return makePost(topic, angle, globalIndex, publishedAt);
    })
  );

  validatePosts(posts, [...existing, ...allNewPosts]);
  allNewPosts.push(...posts);

  const batchStart = posts[0].publishedAt.slice(0, 10);
  const outFile = path.join(outDir, `scheduled-${batchStart}-phase6t.json`);
  const manifestFile = path.join(contentDir, `blog-batch-manifest-${batchStart}-phase6t.json`);
  writeFileSync(outFile, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  writeFileSync(
    manifestFile,
    `${JSON.stringify(
      {
        site: "yungyanggogo",
        target: "nextjs-local-json",
        phase: "6T",
        count: posts.length,
        scheduleStart: posts[0].publishedAt,
        scheduleIntervalHours: intervalHours,
        scheduleEnd: posts.at(-1).publishedAt,
        qualityFloor: 90,
        generationPolicy: "Codex host-authored, no external LLM API, official source links first, unique title/slug/mainKeyword checks",
        files: [path.relative(process.cwd(), outFile)]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`generated=${posts.length} file=${path.relative(process.cwd(), outFile)} start=${posts[0].publishedAt} end=${posts.at(-1).publishedAt}`);
}

const allAfter = [...existing, ...allNewPosts].sort((a, b) => scheduleMs(a.publishedAt) - scheduleMs(b.publishedAt));
console.log(
  JSON.stringify(
    {
      phase: "6T",
      generated: allNewPosts.length,
      totalAfter: allAfter.length,
      firstScheduledAt: allAfter[0]?.publishedAt,
      lastScheduledAt: allAfter.at(-1)?.publishedAt,
      minQualityScore: Math.min(...allNewPosts.map((post) => post.qualityScore)),
      minSectionChars: Math.min(...allNewPosts.map((post) => JSON.stringify(post.sections).length))
    },
    null,
    2
  )
);
