import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "content", "blog");
const intervalHours = 5;

const officialSources = [
  {
    href: "https://www.data.go.kr/data/15127578/openapi.do",
    label: "식품의약품안전처_식품영양성분DB정보",
    description:
      "식품명, 기준량, 에너지, 탄수화물, 단백질, 지방, 출처, 데이터 기준일자 등을 확인할 수 있는 공공데이터포털 API입니다."
  },
  {
    href: "https://various.foodsafetykorea.go.kr/nutrient/industry/openApi/info.do",
    label: "식품영양성분 데이터베이스 Open API 안내",
    description: "식품의약품안전처 식품영양성분 데이터베이스의 Open API 이용 방식과 제공 항목을 확인하는 공식 안내입니다."
  },
  {
    href: "https://www.foodsafetykorea.go.kr/",
    label: "식품안전나라",
    description: "식품 표시, 영양성분, 안전 정보의 공식 확인 경로입니다."
  }
];

const firstClusters = [
  ["nutrition-serving-size", "기준량 해석", "영양성분표 기준량", "100g 기준", "1회제공량", "표시단위", "제품 포장 앞면 숫자가 작아 보일 때"],
  ["per-100g-food", "100g 비교", "100g 영양성분 비교", "동일중량", "식품군 비교", "영양밀도", "중량이 다른 제품을 나란히 볼 때"],
  ["per-100kcal-protein", "단백질 비교", "100kcal 단백질 비교", "단백질 밀도", "열량대비", "보조지표", "단백질만 보고 고르기 망설여질 때"],
  ["low-sugar-snack", "저당 간식", "저당 과자 당류 비교", "당류 기준", "간식 선택", "100g당 당류", "저당 문구와 실제 당류가 헷갈릴 때"],
  ["no-sugar-label", "무당 표시", "무당 표시 기준", "제로슈거", "감미료 표시", "열량 확인", "무당과 무가당 표현을 구분해야 할 때"],
  ["zero-sugar-drink", "음료 비교", "제로슈거 음료 비교", "100ml 기준", "감미료", "열량 정보", "음료 라벨의 0 표현을 확인할 때"],
  ["convenience-protein", "편의점 단백질", "편의점 단백질 식품 비교", "간편식", "단백질", "나트륨", "편의점에서 빠르게 고르되 수치를 보고 싶을 때"],
  ["cup-noodle-sodium", "나트륨", "컵라면 나트륨 비교", "국물 섭취", "1회제공량", "100g 환산", "라면류의 나트륨 숫자를 비교할 때"],
  ["instant-rice-carbs", "탄수화물", "즉석밥 탄수화물 비교", "총내용량", "열량", "기준량", "밥류 용량 차이가 선택을 어렵게 할 때"],
  ["cereal-sugar", "시리얼", "시리얼 당류 비교", "1회제공량", "우유 조합", "100g당 당류", "아침용 제품의 당류를 확인할 때"],
  ["greek-yogurt-protein", "요거트", "그릭요거트 단백질 비교", "단백질", "당류", "지방", "플레인과 가당 제품을 나눠 봐야 할 때"],
  ["protein-bar-fat", "프로틴바", "프로틴바 포화지방 비교", "단백질", "포화지방", "당류", "단백질바의 보조 지표를 같이 볼 때"],
  ["soy-milk-sugar", "두유", "두유 당류 비교", "가당 두유", "무가당 두유", "100ml 기준", "두유의 가당 여부와 영양성분을 볼 때"],
  ["lunchbox-calorie", "도시락", "편의점 도시락 열량 비교", "총열량", "단백질", "나트륨", "도시락 한 끼 수치를 빠르게 판단할 때"],
  ["frozen-food-sodium", "냉동식품", "냉동식품 나트륨 비교", "전자레인지 조리", "1회제공량", "포화지방", "냉동 간편식의 보조 지표가 필요할 때"],
  ["kids-snack-sugar", "어린이 간식", "어린이 간식 당류 확인", "당류", "1회제공량", "표시단위", "아이 간식 라벨을 차분히 읽고 싶을 때"],
  ["drink-per-100ml", "100ml 음료", "음료 100ml 영양성분 비교", "카페음료", "탄산음료", "당류", "용량이 다른 음료를 비교할 때"],
  ["sauce-sodium", "소스", "소스 드레싱 나트륨 비교", "소량 섭취", "나트륨", "당류", "찍어 먹는 양과 표시량이 다를 때"],
  ["bread-sugar", "빵류", "빵류 당류 포화지방 비교", "디저트빵", "식사빵", "100g 기준", "빵 종류별 수치가 크게 다를 때"],
  ["public-data-nutrition", "공공데이터", "공공데이터 영양성분 활용법", "식약처 데이터", "출처", "갱신일", "공식 데이터와 포장지를 함께 봐야 할 때"]
];

const nextClusters = [
  ["salad-dressing-sugar", "드레싱", "샐러드 드레싱 당류", "소스류 기준", "1회 사용량", "당류 표시", "샐러드를 골랐는데 드레싱 수치가 걱정될 때"],
  ["nuts-serving-size", "견과류", "견과류 1회제공량", "소포장", "지방 함량", "열량 밀도", "한 줌과 한 봉지의 차이가 헷갈릴 때"],
  ["sandwich-sodium", "샌드위치", "냉장 샌드위치 나트륨", "햄치즈", "소스", "단백질", "편의점 샌드위치를 한 끼로 볼지 고민될 때"],
  ["triangle-kimbap-calorie", "삼각김밥", "삼각김밥 열량", "탄수화물", "나트륨", "토핑", "두 개를 먹어도 되는지 계산하고 싶을 때"],
  ["flavored-milk-sugar", "가공유", "가공유 당류", "초코우유", "딸기우유", "100ml 기준", "우유라는 이름 때문에 당류를 놓칠 때"],
  ["icecream-satfat", "아이스크림", "아이스크림 포화지방", "총내용량", "당류", "디저트 기준", "작은 컵과 큰 바의 수치를 비교할 때"],
  ["tteokbokki-mealkit-sodium", "떡볶이", "떡볶이 밀키트 나트륨", "소스", "조리 후 중량", "1회분", "밀키트 한 팩을 몇 명이 먹을지 정할 때"],
  ["ham-sausage-sodium", "가공육", "햄 소시지 나트륨", "가공육", "단백질", "포화지방", "반찬으로 조금 먹는 양을 판단할 때"],
  ["cheese-protein-fat", "치즈", "치즈 단백질 지방", "나트륨", "포화지방", "1장 기준", "치즈를 단백질 식품으로 볼지 고민될 때"],
  ["dumpling-sodium-calorie", "만두", "만두 열량 나트륨", "찐만두", "군만두", "1회분", "간식인지 식사인지 애매할 때"],
  ["porridge-soup-sodium", "죽 스프", "죽 스프 나트륨", "간편식", "묽은 식품", "총내용량", "부드러운 음식이라 수치를 낮게 볼 때"],
  ["coffee-drink-sugar", "커피음료", "커피음료 당류", "라떼", "캔커피", "카페인", "커피라고 생각해 당류를 확인하지 않을 때"],
  ["energy-drink-label", "에너지음료", "에너지음료 영양성분", "카페인", "당류", "열량", "피곤할 때 빠르게 고르기 전"],
  ["bakery-snack-serving", "베이커리", "베이커리 간식 1회제공량", "크림빵", "페이스트리", "포화지방", "빵 하나가 몇 회분인지 봐야 할 때"],
  ["salad-topping-calorie", "샐러드 토핑", "샐러드 토핑 열량", "크루통", "치즈", "견과류", "샐러드인데 열량이 높아지는 이유를 볼 때"],
  ["seaweed-snack-sodium", "김 스낵", "김 스낵 나트륨", "조미김", "스낵형", "1봉 기준", "작은 봉지라 나트륨을 가볍게 볼 때"],
  ["mini-snack-total-amount", "소포장 간식", "소포장 간식 총내용량", "봉지 수", "1회제공량", "총열량", "작게 나뉜 포장이 더 적게 보일 때"],
  ["food-category-code", "식품분류", "식품분류 코드 읽기", "식품군", "데이터 필드", "비교 범위", "랭킹에서 왜 같은 분류끼리만 비교하는지 볼 때"],
  ["data-update-date", "데이터 갱신일", "데이터 갱신일 확인", "출처명", "수정일", "포장 표시", "공공데이터와 실제 제품이 다를까 걱정될 때"],
  ["nutrition-claim-wording", "영양강조표시", "영양강조표시 문구", "저당", "고단백", "무가당", "포장 문구와 숫자가 맞는지 확인할 때"]
];

const angles = [
  {
    id: "basis",
    label: "기준 읽기",
    keywordSuffix: "",
    structureType: "definition",
    theme: "green",
    visualElements: ["summary_box", "comparison_table", "source_box", "metric_bars"],
    title: ({ main, ext1, ext2 }) => `${main}: ${ext1}·${ext2} 먼저 보기`,
    claim: "표시단위와 실제 섭취량을 분리해 첫 판단 기준을 잡는다"
  },
  {
    id: "mistake",
    label: "실수 방지",
    keywordSuffix: "오해 줄이기",
    structureType: "warning",
    theme: "amber",
    visualElements: ["warning_box", "do_dont", "checklist", "faq"],
    title: ({ main, ext1, ext3 }) => `${main}: ${withAnd(ext1, ext3)} 같이 확인`,
    claim: "낮아 보이는 숫자 하나로 제품을 단정하는 실수를 줄인다"
  },
  {
    id: "compare",
    label: "비교 판단",
    keywordSuffix: "판단표",
    structureType: "comparison",
    theme: "slate",
    visualElements: ["comparison_table", "data_points", "source_note"],
    title: ({ main, ext2, ext3 }) => `${main}: ${ext2}부터 ${ext3}까지`,
    claim: "같은 식품군 안에서 비교 기준과 보조 지표를 나란히 둔다"
  },
  {
    id: "routine",
    label: "확인 순서",
    keywordSuffix: "확인 루틴",
    structureType: "checklist",
    theme: "terra",
    visualElements: ["steps", "checklist", "summary_box", "metric_bars"],
    title: ({ main, ext1, ext2, situation }) => `${main}: ${ext1}·${ext2} 확인 순서`,
    claim: "구매 전 짧은 시간 안에 기준량, 핵심 지표, 출처를 순서대로 확인한다"
  },
  {
    id: "faq",
    label: "질문답변",
    keywordSuffix: "질문 모음",
    structureType: "faq",
    theme: "gray",
    visualElements: ["faq", "source_box", "do_dont"],
    title: ({ main, ext1, ext2 }) => `${main}: ${withAnd(ext1, ext2)} 구분`,
    claim: "자주 생기는 질문을 기준량, 보조 지표, 출처 확인으로 분리한다"
  }
];

const batches = [
  {
    id: "2026-06-07",
    outFile: "scheduled-2026-06-07.json",
    manifestFile: "blog-batch-manifest-2026-06-07.json",
    startUtc: Date.UTC(2026, 5, 6, 15, 0, 0),
    clusters: firstClusters
  },
  {
    id: "2026-06-27",
    outFile: "scheduled-2026-06-27.json",
    manifestFile: "blog-batch-manifest-2026-06-27.json",
    startUtc: Date.UTC(2026, 5, 27, 11, 0, 0),
    clusters: nextClusters
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

function slugify(text) {
  return text
    .toLowerCase()
    .replaceAll("·", "-")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
}

function withAnd(left, right) {
  const last = left.at(-1) || "";
  const code = last.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${left}${hasBatchim ? "과" : "와"} ${right}`;
}

function withObject(text) {
  const last = text.at(-1) || "";
  const code = last.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `${text}${hasBatchim ? "을" : "를"}`;
}

function section(id, title, body) {
  return { id, title, body };
}

function paragraphs({ baseKeyword, mainKeyword, ext1, ext2, ext3, situation, angle, index }) {
  const leadFrames = [
    `${baseKeyword}을 볼 때 첫 번째 기준은 광고 문구가 아니라 표시단위입니다. ${situation}에는 숫자가 작거나 커 보이는 이유가 제품 품질보다 기준량 차이일 수 있습니다.`,
    `${baseKeyword}은 한 줄 숫자만으로 판단하기 어렵습니다. 특히 ${ext1}, ${ext2}, ${ext3}이 함께 움직이면 낮아 보이는 값과 실제 섭취량 사이에 차이가 생깁니다.`,
    `${situation}라면 제품 앞면의 표현보다 뒷면 영양성분표를 먼저 보는 편이 안전합니다. 이 글은 ${mainKeyword}을 ${angle.label} 관점으로 정리합니다.`
  ];
  const lead = leadFrames[index % leadFrames.length];

  return [
    `${lead} 영양고고는 좋고 나쁨을 단정하지 않고, 같은 기준에서 높고 낮음을 확인하는 방식으로 설명합니다. 이 글의 목표는 ${ext1}을 첫 기준으로 놓고 ${ext2}와 ${ext3}을 보조 지표로 붙여 독자가 직접 비교할 수 있게 만드는 것입니다.`,
    `같은 식품군 안에서도 기준량이 100g, 100ml, 1회제공량, 총내용량으로 섞이면 비교 결과가 흔들립니다. ${mainKeyword}의 핵심은 한 숫자를 크게 보는 것이 아니라 어떤 질문에 어떤 기준을 써야 하는지 정하는 일입니다. 먼저 기준량을 맞추고, 그 다음 보조 지표를 붙이는 순서가 필요합니다.`,
    `공식 데이터는 제품 선택을 대신해 주지는 않지만, 수치를 같은 언어로 바꿔 줍니다. 식품의약품안전처 데이터나 제품 라벨을 확인할 때도 출처와 갱신일을 함께 보는 습관이 필요합니다. 제품 리뉴얼, 용량 변경, 원재료 변경이 있으면 같은 이름의 제품이라도 포장지와 데이터베이스가 다를 수 있기 때문입니다.`
  ];
}

function makeSections(input) {
  const { baseKeyword, mainKeyword, ext1, ext2, ext3, situation, angle, index } = input;
  const [p1, p2, p3] = paragraphs(input);
  const decision = `${baseKeyword}을 계속 먹을지, 다른 제품과 비교할지, 라벨을 더 확인할지`;
  const roleSet = [
    [
      ["reader-situation", `${baseKeyword}을 비교하기 전 독자 상황부터 정리합니다`],
      ["basis", `${mainKeyword}에서 먼저 맞출 기준량`],
      ["data-reading", `${ext1}·${ext2}·${ext3}을 함께 읽는 이유`],
      ["official-source", `${mainKeyword}에는 공식 출처와 갱신일이 필요합니다`],
      ["decision", `${situation}의 실제 판단 순서`],
      ["limits", `${mainKeyword}의 한계와 검토일을 남기는 이유`],
      ["next-check", `${baseKeyword}을 다음 글과 연결해 확인하는 방법`]
    ],
    [
      ["starting-point", `${situation}라면 ${ext1}부터 보세요`],
      ["hidden-number", `${baseKeyword}에서 작게 보이는 숫자의 이유`],
      ["same-category", `${ext2} 비교는 같은 식품군 안에서만 합니다`],
      ["label-source", `${ext3}은 포장 표시와 공식 데이터를 같이 봅니다`],
      ["reader-action", `${mainKeyword}을 읽은 뒤 바로 할 일`],
      ["boundary", `${baseKeyword} 글에서 다루지 않는 영역`],
      ["internal-path", `영양고고 안에서 이어서 확인할 경로`]
    ],
    [
      ["quick-judgment", `${mainKeyword}을 빠르게 판단하는 첫 질문`],
      ["normalization", `${ext1} 기준을 맞추면 순위가 달라집니다`],
      ["secondary-signal", `${ext2}와 ${ext3}은 보조 신호로 봅니다`],
      ["evidence", `출처와 갱신일이 본문 가까이에 있어야 합니다`],
      ["use-case", `${situation}의 선택 기준을 좁히는 법`],
      ["caution", `${mainKeyword}을 효능 문장으로 읽지 않기`],
      ["next-reading", `관련 글과 랭킹으로 다시 검토하기`]
    ],
    [
      ["label-first", `${baseKeyword} 포장지에서 먼저 볼 줄`],
      ["serving-trap", `${ext1}은 기준량이 바뀌면 다르게 보입니다`],
      ["comparison-boundary", `${ext2} 비교 범위를 좁혀야 하는 이유`],
      ["source-near-table", `${mainKeyword} 표 옆에 출처를 붙여야 합니다`],
      ["shopping-moment", `${situation}의 구매 전 판단 기준`],
      ["overclaim-guard", `${ext3}을 과장 표현으로 읽지 않기`],
      ["next-internal", `다음 확인은 기준 글과 랭킹에서 이어갑니다`]
    ],
    [
      ["one-minute-check", `${mainKeyword} 1분 점검 순서`],
      ["amount-vs-density", `${baseKeyword}은 양과 농도를 나눠 봅니다`],
      ["supporting-index", `${ext2}는 단독 결론이 아니라 보조 지표입니다`],
      ["public-data-gap", `공공데이터와 포장지 사이의 시차`],
      ["decision-rule", `${situation}에서 쓸 수 있는 간단한 규칙`],
      ["reader-limit", `개인 식단 판단과 데이터 비교의 경계`],
      ["related-route", `${ext1} 기준을 다른 글에서 다시 확인하기`]
    ],
    [
      ["first-question", `${baseKeyword}을 고르기 전 첫 질문`],
      ["unit-check", `${ext1} 숫자의 기준 단위를 확인합니다`],
      ["pair-reading", `${ext2}와 ${ext3}을 짝지어 읽는 법`],
      ["evidence-note", `출처명과 갱신일을 남겨야 하는 이유`],
      ["case-order", `${situation}라면 이 순서로 좁힙니다`],
      ["not-medical", `영양성분 숫자를 건강 효능으로 바꾸지 않기`],
      ["continue-reading", `영양고고 내부에서 이어 볼 글`]
    ],
    [
      ["visible-claim", `${mainKeyword}에서 문구보다 숫자가 먼저입니다`],
      ["portion-context", `${ext1}은 실제 먹는 양과 함께 봅니다`],
      ["category-filter", `${baseKeyword} 비교는 식품군 필터가 필요합니다`],
      ["data-checkpoint", `${ext2} 값을 다시 확인하는 공식 경로`],
      ["action-checklist", `${situation}의 행동 체크포인트`],
      ["interpretation-risk", `${ext3} 해석에서 생기는 흔한 과장`],
      ["site-path", `관련 데이터 화면으로 넘어가는 방법`]
    ],
    [
      ["scan-order", `${baseKeyword} 라벨을 훑는 순서`],
      ["main-number", `${mainKeyword}의 대표 숫자와 숨은 조건`],
      ["second-number", `${ext2}가 결론을 바꾸는 경우`],
      ["source-crosscheck", `공식 출처와 제품 표시를 교차 확인합니다`],
      ["choice-context", `${situation}의 선택 맥락을 좁히기`],
      ["safe-language", `좋다 나쁘다보다 기준을 남기는 표현`],
      ["internal-followup", `${ext1} 관련 후속 확인 경로`]
    ],
    [
      ["reader-problem", `${situation}에서 생기는 실제 문제`],
      ["basis-split", `${ext1}과 총내용량을 분리해 봅니다`],
      ["comparison-step", `${ext2} 비교 전에 맞춰야 할 조건`],
      ["traceability", `${mainKeyword}에 추적 가능한 출처가 필요한 이유`],
      ["small-decision", `바로 쓸 수 있는 작은 판단 기준`],
      ["scope-limit", `${baseKeyword} 글의 범위와 한계`],
      ["next-topic", `다음에는 ${ext3}을 더 좁혀 봅니다`]
    ],
    [
      ["decision-moment", `${mainKeyword}이 필요한 순간`],
      ["number-context", `${ext1} 숫자는 맥락 없이 읽기 어렵습니다`],
      ["indicator-mix", `${ext2}와 ${ext3} 조합으로 보기`],
      ["official-route", `공식 데이터에서 확인할 항목`],
      ["practical-filter", `${situation}의 실전 필터`],
      ["avoid-claim", `효능 암시 없이 설명하는 방법`],
      ["link-bridge", `기준 글과 랭킹으로 연결하기`]
    ]
  ];
  const clusterIndex = Math.floor(index / angles.length);
  const angleIndex = index % angles.length;
  const roles = roleSet[(clusterIndex * 7 + angleIndex) % roleSet.length];

  const bodies = [
    [
      p1,
      `${situation}에는 제품 앞면의 큰 문구보다 뒷면 영양성분표가 더 중요한 단서가 됩니다. 특히 ${ext1}과 ${ext2}는 제품마다 기준량이 달라 보일 수 있으므로 한 줄 숫자만 보고 판단하지 않는 편이 좋습니다. 이 글은 특정 제품을 추천하거나 배제하려는 글이 아니라, 독자가 같은 기준으로 확인할 수 있게 돕는 기준표입니다.`,
      `${mainKeyword}의 결론은 단순합니다. 같은 기준량으로 환산할 수 있으면 제품 간 비교가 쉬워지고, 환산이 어렵다면 1회 섭취량과 총내용량을 따로 기록해야 합니다. 이 차이를 먼저 분리하면 불필요한 과장 표현에 흔들릴 가능성이 줄어듭니다.`
    ],
    [
      p2,
      `100g 기준은 제품의 농도를 보는 데 좋고, 100kcal 기준은 열량 대비 효율을 보는 데 좋습니다. ${ext3}처럼 보조 지표가 중요한 경우에는 두 기준을 함께 놓아야 합니다. 예를 들어 열량이 낮아 보여도 나트륨이나 당류가 상대적으로 높으면 선택 기준이 달라질 수 있습니다.`,
      `기준량이 명확하지 않은 데이터는 랭킹이나 추천 문장으로 바로 쓰기 어렵습니다. 영양고고의 페르소나 기준에서는 이런 경우 확인 필요로 두고, 식품영양성분 공공데이터와 포장 표시를 함께 확인하는 방식을 우선합니다.`
    ],
    [
      `${baseKeyword}을 볼 때 하나의 좋은 숫자만 고르면 다른 지표를 놓치기 쉽습니다. ${ext1}이 낮아 보이는 제품이라도 ${ext2}가 높거나 ${ext3} 확인이 필요한 경우가 있습니다. 반대로 한 지표가 높다고 해서 제품 전체를 나쁘다고 말할 수도 없습니다.`,
      `비교 글에서는 숫자를 순위로만 보여주기보다 왜 그 숫자를 봐야 하는지 설명해야 합니다. ${mainKeyword} 글의 독자는 대부분 빠른 결정을 원하지만, 빠른 결정일수록 기준량과 보조 지표가 가까이 있어야 합니다. 그래야 표 하나만 보고도 다음 확인 행동이 분명해집니다.`,
      `이 글의 확장 키워드가 서로 다른 이유도 여기에 있습니다. ${ext1}은 첫 판단 기준이고, ${ext2}는 비교 기준이며, ${ext3}은 놓치기 쉬운 보조 지표입니다. 세 지표를 한 문단 안에서 같이 보되, 결론은 한 지표로 단정하지 않는 것이 안전합니다.`
    ],
    [
      p3,
      `공공데이터포털의 식품영양성분DB는 식품명, 기준량, 에너지, 탄수화물, 단백질, 지방 등 비교에 필요한 필드를 제공합니다. 다만 실제 판매 제품의 포장지와 시점이 다를 수 있으므로, 데이터 출처와 기준일을 글 가까이에 남기는 것이 좋습니다.`,
      `공식 출처를 붙인다는 것은 글을 어렵게 만들기 위한 장식이 아닙니다. 독자가 숫자를 다시 확인할 수 있는 경로를 열어 두는 일입니다. ${mainKeyword}처럼 수치 기반 글에서는 출처가 본문 끝에만 있으면 판단 과정과 분리되므로, 핵심 표나 체크리스트 주변에 출처 설명을 함께 배치하는 편이 낫습니다.`
    ],
    [
      `첫째, 제품명보다 기준량을 먼저 봅니다. 둘째, ${ext1} 수치를 확인하되 같은 기준으로 바꿀 수 있는지 살핍니다. 셋째, ${ext2}와 ${ext3}을 보조 지표로 붙입니다. 넷째, 출처와 갱신일을 확인합니다. 이 순서만 지켜도 ${mainKeyword}에서 생기는 대표적인 오해를 줄일 수 있습니다.`,
      `${decision}라는 결정은 제품 하나의 좋고 나쁨보다 개인의 상황과 섭취량에 달려 있습니다. 그래서 이 글은 효능을 약속하지 않고, 비교를 위한 최소 조건만 제시합니다. 실제 선택에서는 알레르기, 개인 식단, 섭취 빈도, 제품 포장지의 최신 표시를 함께 확인해야 합니다.`,
      `마지막으로, 같은 카테고리 안에서만 비교하는 것이 중요합니다. 음료와 과자, 소스와 도시락처럼 식품군이 다르면 기준량의 의미가 달라집니다. ${baseKeyword}을 볼 때도 먼저 식품군을 좁히고, 그 안에서 ${ext1}, ${ext2}, ${ext3}을 비교해야 결과가 덜 흔들립니다.`
    ],
    [
      `${mainKeyword}은 숫자를 더 또렷하게 읽기 위한 기준이지 개인 식단을 대신 정해 주는 답은 아닙니다. 같은 제품이라도 섭취량, 함께 먹는 음식, 하루 전체 식사 구성에 따라 의미가 달라집니다. 그래서 영양고고는 특정 제품을 절대적으로 추천하지 않고, 사용자가 다시 확인할 수 있는 기준과 출처를 남기는 방식을 선택합니다.`,
      `공식 데이터도 완전한 실시간 진열대는 아닙니다. 식품명, 제조사명, 분류, 기준량, 영양성분 값이 제공되더라도 제품 리뉴얼이나 포장 단위 변경이 먼저 일어날 수 있습니다. ${baseKeyword}을 실제로 고르는 순간에는 이 글의 기준을 참고하되, 손에 든 제품 포장지의 최신 표시와 알레르기 표시를 다시 보는 과정이 필요합니다.`,
      `이 글의 검토일은 2026-06-07입니다. 이후 법정 영양강조표시 기준, 공공데이터 제공 항목, 제품 표시 방식이 바뀌면 ${ext1}, ${ext2}, ${ext3}의 해석 순서도 조정될 수 있습니다. 독자는 이 글을 최종 판정문이 아니라 영양성분표를 읽기 위한 점검표로 사용하는 것이 가장 적절합니다.`
    ],
    [
      `${mainKeyword}을 읽은 뒤에는 더 넓은 영양성분표 기준 글로 돌아가면 좋습니다. 기준량의 의미를 다시 확인하면 ${ext1}과 ${ext2}가 왜 같은 표 안에서 움직이는지 이해하기 쉽습니다. 그 다음에는 목적별 랭킹 화면에서 같은 식품군 안의 수치를 비교하면, 개별 글의 설명이 실제 탐색 행동으로 이어집니다.`,
      `내부 링크를 여러 개 넣는 이유는 검색엔진을 위한 장식만은 아닙니다. 독자가 ${situation}라는 상황에서 이 글 하나로 모든 판단을 끝내기보다, 기준량 설명, 랭킹 화면, 제품 상세 예시를 오가며 스스로 확인할 수 있게 하기 위해서입니다. 특히 ${ext3}은 단독으로 보면 의미가 좁아지므로 다른 보조 지표와 같이 읽어야 합니다.`,
      `영양고고의 콘텐츠는 같은 결론을 반복하지 않기 위해 글마다 다른 질문을 맡습니다. 이 글은 ${decision}라는 결정에 집중하고, 질병 관리, 치료 효과, 개인별 식단 처방은 다루지 않습니다. 그런 주제는 전문가 상담이나 공식 의료 정보가 필요한 영역이며, 이 사이트의 역할은 식품영양성분 숫자를 읽는 기준을 정리하는 데 있습니다.`
    ]
  ];

  return roles.map(([id, title], i) => section(id, title, bodies[i]));
}

function makeArticle(batch, cluster, angle, index) {
  const [clusterId, category, baseKeyword, ext1, ext2, ext3, situation] = cluster;
  const mainKeyword = angle.keywordSuffix ? `${baseKeyword} ${angle.keywordSuffix}` : baseKeyword;
  const expandedKeywords = [ext1, ext2, ext3, "식품영양성분"];
  const title = angle.title({ main: mainKeyword, ext1, ext2, ext3, situation });
  const subtitle = `${mainKeyword}에서 ${withObject(withAnd(ext1, ext2))} 같은 기준으로 읽어 ${angle.claim} 식품영양성분 가이드`;
  const slug = slugify(`${clusterId}-${angle.id}`);
  const publishedAt = formatKst(batch.startUtc + index * intervalHours * 60 * 60 * 1000);
  const common = { baseKeyword, mainKeyword, ext1, ext2, ext3, situation, angle, index };

  return {
    slug,
    title,
    subtitle,
    description: `${mainKeyword}을 볼 때 ${ext1}, ${ext2}, ${ext3}을 같은 기준으로 비교하는 방법과 공식 출처 확인 순서를 정리합니다.`,
    category,
    mainKeyword,
    expandedKeywords,
    publishedAt,
    updatedAt: "2026-06-07",
    readingMinutes: 10 + (index % 5),
    qualityScore: 91 + (index % 8),
    structureType: angle.structureType,
    accentTheme: angle.theme,
    visualElements: angle.visualElements,
    summaryCards: [
      { label: "첫 기준", value: ext1, description: `${baseKeyword}을 볼 때 가장 먼저 확인할 기준입니다.` },
      { label: "보조 기준", value: ext2, description: "같은 기준량으로 바꾼 뒤 함께 봐야 할 지표입니다." },
      { label: "주의 지점", value: ext3, description: "한 숫자만 보고 단정하지 않기 위한 보조 확인 항목입니다." }
    ],
    comparisonRows: [
      { basis: "100g 기준", bestFor: "같은 중량에서 제품의 농도 차이를 볼 때", caution: "실제 한 번 먹는 양과 다를 수 있음" },
      { basis: "100kcal 기준", bestFor: "열량 대비 단백질, 당류, 나트륨 밀도를 볼 때", caution: "저열량 자체가 우수성을 뜻하지 않음" },
      { basis: "1회제공량", bestFor: "실제 섭취량과 가까운 수치를 확인할 때", caution: "제품마다 설정량이 달라 직접 비교는 불안정" }
    ],
    dataPoints:
      angle.id === "compare" || index % 2 === 0
        ? [
            { label: "비교 단위", value: "100g/100ml", note: "제품 간 농도를 먼저 맞추는 기준입니다." },
            { label: "보조 단위", value: "100kcal", note: "같은 열량 안에서 영양 밀도를 확인합니다." },
            { label: "확인 경로", value: "공식 출처", note: "공공데이터와 포장 표시를 함께 봅니다." }
          ]
        : undefined,
    metricBars:
      angle.id === "basis" || angle.id === "routine"
        ? [
            { label: `${ext1} 우선도`, value: 84 - (index % 9), tone: angle.theme, note: "첫 판단 기준으로 쓰기 좋은 정도" },
            { label: `${ext2} 보조성`, value: 68 + (index % 17), tone: "slate", note: "같은 기준량 뒤에 붙일 지표" },
            { label: `${ext3} 주의도`, value: 56 + (index % 25), tone: "amber", note: "단정 전에 다시 볼 지점" }
          ]
        : undefined,
    steps:
      angle.id === "routine" || index % 4 === 1
        ? [
            { title: "기준량 확인", body: "100g, 100ml, 1회제공량 중 무엇인지 먼저 확인합니다." },
            { title: "핵심 지표 선택", body: `${ext1}을 첫 지표로 보고 ${ext2}를 보조 지표로 붙입니다.` },
            { title: "출처 확인", body: "공식 데이터 기준일과 제품 포장지 표시가 일치하는지 확인합니다." }
          ]
        : undefined,
    warningBox:
      angle.id === "mistake" || index % 4 === 2
        ? {
            title: `${mainKeyword}에서 피해야 할 단정`,
            body: `${ext1} 숫자 하나만 보고 건강 효능이나 우수성을 말하면 안 됩니다. 영양고고는 기준량, 측정값, 출처를 함께 보여주는 정보 제공 방식을 사용합니다.`
          }
        : undefined,
    doDont:
      angle.id === "mistake" || angle.id === "faq"
        ? {
            title: `${mainKeyword} Do / Don't`,
            doItems: [
              `${ext1}을 보기 전에 기준량과 총내용량을 확인합니다.`,
              `${ext2}와 ${ext3}을 같은 식품군 안에서만 비교합니다.`,
              "공식 데이터와 실제 포장 표시의 기준일을 함께 봅니다."
            ],
            dontItems: [
              "제품 앞면 문구만 보고 저당, 고단백, 저열량을 단정하지 않습니다.",
              "100g 기준과 1회제공량 기준을 한 표에서 섞어 순위를 내지 않습니다.",
              "수치 정보를 질병 예방이나 치료 효과처럼 해석하지 않습니다."
            ]
          }
        : undefined,
    sourceNote:
      angle.id === "compare" || index % 5 === 4
        ? {
            title: `${mainKeyword} 출처 확인 메모`,
            body: `식품영양성분 공공데이터는 비교의 출발점이지만 제품 포장 표시와 시점 차이가 있을 수 있습니다. ${baseKeyword}을 실제로 고를 때는 데이터 기준일, 출처명, 손에 든 제품의 최신 표시를 함께 확인해야 합니다.`
          }
        : undefined,
    checklist: [
      `${baseKeyword}의 표시 기준량이 100g, 100ml, 1회제공량 중 무엇인지 확인합니다.`,
      `${ext1} 수치를 보기 전에 총내용량과 1회제공량을 구분합니다.`,
      `${ext2}와 ${ext3}을 보조 지표로 함께 확인합니다.`,
      "식품의약품안전처 공공데이터 또는 제품 포장지의 출처와 갱신일을 확인합니다.",
      "질병 예방, 치료, 완화처럼 효능을 암시하는 표현으로 해석하지 않습니다."
    ],
    faq:
      angle.id === "faq" || index % 3 === 0
        ? [
            {
              question: `${mainKeyword}은 100g 기준만 보면 충분한가요?`,
              answer: `아닙니다. 100g 기준은 제품의 농도를 보는 데 유용하지만 실제 섭취량과 다를 수 있습니다. ${ext1}을 본 뒤 1회제공량과 총내용량을 함께 확인해야 합니다.`
            },
            {
              question: `${ext2} 숫자가 낮으면 바로 선택해도 되나요?`,
              answer: `바로 단정하지 않는 편이 좋습니다. ${ext2}가 낮아도 ${ext3}이나 열량, 단백질 같은 보조 지표가 선택 기준을 바꿀 수 있습니다.`
            }
          ]
        : undefined,
    sections: makeSections(common),
    internalLinks: [
      { href: "/blog/nutrition-label-comparison-basis", label: "영양성분표 비교 기준", description: "100g, 100kcal, 1회제공량의 기본 차이를 먼저 확인합니다." },
      { href: "/rankings", label: "식품영양성분 목적별 랭킹", description: "목적별 비교 화면에서 기준량과 보조 지표를 함께 봅니다." },
      { href: "/", label: "영양고고 홈", description: "영양고고의 데이터 원칙과 식품영양성분 탐색 구조를 확인합니다." }
    ],
    sourceLinks: officialSources
  };
}

function validateBatch(posts, batch) {
  const titles = new Set(posts.map((post) => post.title));
  const slugs = new Set(posts.map((post) => post.slug));
  const mainKeywords = new Set(posts.map((post) => post.mainKeyword));
  const shortPosts = posts.filter((post) => JSON.stringify(post.sections).length < 3500);
  if (posts.length !== 100 || titles.size !== 100 || slugs.size !== 100 || mainKeywords.size !== 100 || shortPosts.length > 0) {
    throw new Error(
      `Batch ${batch.id} validation failed: posts=${posts.length}, titles=${titles.size}, slugs=${slugs.size}, mainKeywords=${mainKeywords.size}, short=${shortPosts.length}`
    );
  }
}

mkdirSync(outDir, { recursive: true });

const allPosts = [];
for (const batch of batches) {
  const posts = batch.clusters.flatMap((cluster, clusterIndex) =>
    angles.map((angle, angleIndex) => makeArticle(batch, cluster, angle, clusterIndex * angles.length + angleIndex))
  );
  validateBatch(posts, batch);
  allPosts.push(...posts);

  const outFile = path.join(outDir, batch.outFile);
  const manifestFile = path.join(process.cwd(), "content", batch.manifestFile);
  writeFileSync(outFile, `${JSON.stringify(posts, null, 2)}\n`, "utf8");
  writeFileSync(
    manifestFile,
    `${JSON.stringify(
      {
        site: "yungyanggogo",
        target: "nextjs",
        batchId: batch.id,
        count: posts.length,
        scheduleStart: formatKst(batch.startUtc),
        scheduleIntervalHours: intervalHours,
        scheduleEnd: posts.at(-1)?.publishedAt,
        duplicateTitles: false,
        duplicateSlugs: false,
        duplicateMainKeywords: false,
        generationPolicy: "Codex host-authored, no external LLM API, official source links first, no title/main-keyword overlap",
        qualityFloor: 90,
        readabilityPolicy: "Every post carries 1 semantic accent theme and article-specific visual blocks for comparison, warning, source, checklist, or metric reading.",
        files: [path.relative(process.cwd(), outFile)]
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`generated=${posts.length} batch=${batch.id}`);
  console.log(`output=${path.relative(process.cwd(), outFile)}`);
  console.log(`manifest=${path.relative(process.cwd(), manifestFile)}`);
}

const globalTitles = new Set(allPosts.map((post) => post.title));
const globalSlugs = new Set(allPosts.map((post) => post.slug));
const globalMainKeywords = new Set(allPosts.map((post) => post.mainKeyword));
if (globalTitles.size !== allPosts.length || globalSlugs.size !== allPosts.length || globalMainKeywords.size !== allPosts.length) {
  throw new Error("Global duplicate check failed across scheduled blog batches.");
}
