// Builds pending (unpublished) draft posts from production food-group data.
// humanReview stays "pending": the public loader excludes them until a person
// reviews and approves. Numbers come from output of scripts run 2026-09-30.
import { writeFileSync } from "node:fs";

const checkedAt = "2026-09-30";
const groups = [
  {
    slug: "sandwich-nutrition-232-compare",
    name: "샌드위치",
    count: 232,
    total: 232,
    theme: "green",
    stats: { energy: ["100", "239", "422", 232], protein: ["1.9", "8.9", "42.9", 232], fat: ["1.5", "11.2", "24", 35], carbs: ["8.4", "24", "43.1", 48], sugars: ["0.5", "4.1", "27", 232], sodium: ["16", "428.5", "1,092", 232] },
    makers: "뚜레쥬르 49개, 파스쿠찌 24개, 투썸플레이스 21개, 할리스 13개, 스타벅스 10개 등",
    angle: "카페·베이커리 샌드위치는 같은 100g이라도 열량이 약 4배, 나트륨이 약 68배까지 차이 납니다. 빵 종류, 속 재료, 소스 양이 달라서입니다.",
    tip: "샌드위치는 메뉴마다 한 개 무게가 달라, 100g당 값을 본 뒤 실제 한 개 무게를 곱해 보는 순서가 필요합니다. 한 개 무게는 매장 안내나 포장 표시에서 확인하세요.",
  },
  {
    slug: "fried-chicken-nutrition-91-compare",
    name: "닭튀김",
    count: 87,
    total: 91,
    theme: "amber",
    stats: { energy: ["130", "278", "633", 87], protein: ["8.4", "22.5", "29.1", 87], fat: ["9.7", "16.3", "23.5", 9], carbs: ["4.2", "13", "58.1", 24], sugars: ["0", "2.8", "21", 83], sodium: ["60", "395", "1,003", 87] },
    makers: "교촌치킨 26개, 치킨플러스 10개, 자담치킨 8개, 호식이두마리치킨 6개, 비비큐 6개 등",
    angle: "치킨은 단백질 중앙값이 100g당 22.5g으로 높지만, 양념·소스가 더해지면 열량(최고 633kcal)과 당류(최고 21g)가 크게 달라집니다.",
    tip: "치킨은 뼈 무게가 포함되는지, 한 마리·반 마리 중 무엇을 기준으로 먹는지부터 확인해야 섭취량 계산이 맞습니다.",
  },
  {
    slug: "salad-nutrition-57-compare",
    name: "샐러드",
    count: 53,
    total: 57,
    theme: "green",
    stats: { energy: ["15", "129", "210", 53], protein: ["0.9", "5.2", "15", 53], fat: ["4.8", "8.7", "13.4", 16], carbs: ["2.2", "8", "26.8", 16], sugars: ["0", "4.1", "15", 53], sodium: ["12", "200", "491", 53] },
    makers: "뚜레쥬르 21개, 피자알볼로 6개, 투썸플레이스 5개, 롤링핀 3개 등",
    angle: "샐러드도 100g당 열량이 15kcal부터 210kcal까지 퍼져 있습니다. 채소 비중보다 드레싱·치즈·곡물·육류 토핑이 값을 좌우합니다.",
    tip: "드레싱이 따로 담겨 있다면 제공 자료가 드레싱 포함 기준인지 확인하고, 실제로 넣은 양만큼만 더하세요.",
  },
];

const label = { energy: ["열량", "kcal"], protein: ["단백질", "g"], fat: ["지방", "g"], carbs: ["탄수화물", "g"], sugars: ["당류", "g"], sodium: ["나트륨", "mg"] };

function post(g) {
  const url = `/nutrition-data/food/group/${encodeURIComponent(g.name)}`;
  const statRows = Object.entries(g.stats).map(([key, [min, med, max, n]]) => [label[key][0], `${min} ${label[key][1]}`, `${med} ${label[key][1]}`, `${max} ${label[key][1]}`, `${n}/${g.count}`]);
  const e = g.stats.energy;
  const s = g.stats.sodium;
  return {
    slug: g.slug,
    title: `${g.name} 영양성분 비교: 공공데이터 ${g.total}종 100g당 열량·나트륨`,
    subtitle: `${g.name} ${g.total}종을 같은 100g 기준으로 맞춰 보면 무엇이 얼마나 다른지 정리합니다`,
    description: `공공데이터에 등록된 ${g.name} ${g.total}종 중 100g 기준으로 비교 가능한 ${g.count}종의 100g당 열량(중앙값 ${e[1]}kcal, ${e[0]}~${e[2]}kcal)과 나트륨(중앙값 ${s[1]}mg)을 비교하고, 실제 먹는 양으로 계산하는 방법을 설명합니다.`,
    category: "식품군 비교",
    mainKeyword: `${g.name} 영양성분`,
    expandedKeywords: [`${g.name} 칼로리`, `${g.name} 나트륨`, `${g.name} 100g`, "식품군 비교"],
    publishedAt: "2026-10-05T09:00:00+09:00",
    updatedAt: checkedAt,
    readingMinutes: 5,
    // Draft: excluded from the public site until a person reviews it.
    humanReview: "pending",
    noindex: true,
    accentTheme: g.theme,
    summaryCards: [
      { label: "비교 자료", value: `${g.count}종`, description: g.total === g.count ? `대표식품이 ‘${g.name}’인 공공데이터 자료 전체` : `전체 ${g.total}종 중 g 기준량으로 비교 가능한 자료` },
      { label: "100g당 열량 중앙값", value: `${e[1]} kcal`, description: `범위 ${e[0]}~${e[2]} kcal` },
      { label: "100g당 나트륨 중앙값", value: `${s[1]} mg`, description: `범위 ${s[0]}~${s[2]} mg` },
    ],
    comparisonRows: [
      { basis: "100g당", bestFor: `${g.name} 제품 간 밀도 비교`, caution: "한 개 무게가 다르면 실제 섭취량과 다름" },
      { basis: "한 개(1회분)", bestFor: "실제로 먹는 양 확인", caution: "제품마다 중량이 달라 직접 비교가 어려움" },
      { basis: "100kcal당", bestFor: "열량 대비 단백질·나트륨 구성", caution: "절대량이 아니라 비율임" },
    ],
    checklist: [
      "먼저 100g당 값으로 비교하고, 실제 한 개 무게로 다시 계산합니다.",
      "지방·탄수화물은 값이 빈 자료가 많아 계산된 자료 수를 함께 봅니다.",
      "같은 메뉴명이라도 판매처·리뉴얼 시점에 따라 값이 다를 수 있습니다.",
      "원자료 기준일과 제품 포장·매장 안내를 함께 확인합니다.",
    ],
    sections: [
      {
        id: "summary",
        title: `${g.name} ${g.total}종, 100g당 숫자로 보면`,
        body: [],
        blocks: [
          { type: "paragraph", text: `영양고고에 저장된 전국통합식품영양성분정보(음식) 표준데이터 가운데 대표식품이 ‘${g.name}’로 분류된 자료는 ${g.total}개입니다(${checkedAt} 확인). ${g.total === g.count ? "모두 g 기준량이라 100g당 값으로 맞출 수 있습니다." : `이 중 기준량이 g로 표기된 ${g.count}개를 100g당 값으로 맞췄고, 단위가 달라 환산할 수 없는 ${g.total - g.count}개는 뺐습니다.`} ${g.angle}` },
          { type: "table", headers: ["영양성분", "최저", "중앙값", "최고", "값이 있는 자료"], rows: statRows },
          { type: "paragraph", text: "‘값이 있는 자료’가 전체보다 적은 성분은 원자료에 값이 비어 있는 경우입니다. 빈값은 0으로 넣지 않고 계산에서 뺐습니다. 특히 지방·탄수화물은 일부 자료에만 값이 있어 중앙값의 대표성이 낮습니다." },
        ],
      },
      {
        id: "sources",
        title: "어떤 자료가 들어 있나",
        body: [],
        blocks: [
          { type: "paragraph", text: `판매처 기준으로는 ${g.makers}의 메뉴가 포함돼 있습니다. 공공데이터에 등록된 메뉴만 들어 있으므로 시판 ${g.name} 전체를 대표하지 않으며, 특정 브랜드가 많다고 그 브랜드가 대표적이라는 뜻도 아닙니다.` },
          { type: "paragraph", text: "개별 메뉴의 원자료 기준량·출처·원자료 기준일은 식품군 비교표에서 각 메뉴를 눌러 확인할 수 있습니다." },
        ],
      },
      {
        id: "how-to-use",
        title: "내가 먹는 양으로 바꿔 보기",
        body: [],
        blocks: [
          { type: "paragraph", text: g.tip },
          { type: "list", ordered: true, items: [
            `식품군 비교표에서 비슷한 메뉴를 찾아 100g당 열량·나트륨을 확인합니다.`,
            "메뉴 상세 페이지의 ‘먹는 양에 맞춰 계산하기’에 실제 무게(g)를 넣습니다.",
            "포장 제품이라면 영양성분표 100g 환산 계산기로 라벨 값을 같은 기준으로 바꿔 비교합니다.",
          ] },
          { type: "paragraph", text: `예시(가상 계산): 100g당 나트륨이 중앙값 ${s[1]}mg인 메뉴를 200g 먹으면 약 ${Math.round(Number(s[1].replace(/,/g, "")) * 2).toLocaleString("ko-KR")}mg입니다. 실제 값은 메뉴와 무게에 따라 달라집니다.` },
        ],
      },
      {
        id: "limits",
        title: "해석할 때 주의할 점",
        body: [],
        blocks: [
          { type: "list", ordered: false, items: [
            "이 글은 제품 순위나 추천이 아니며, 어떤 메뉴가 건강에 좋다고 판정하지 않습니다.",
            "공공데이터 값은 제공 시점 기준이며 현재 판매 제품과 다를 수 있습니다.",
            "개인의 식이 제한이 있다면 의료·영양 전문가와 상의하세요.",
          ] },
        ],
      },
    ],
    internalLinks: [
      { href: url, label: `${g.name} ${g.total}종 비교표`, description: "메뉴별 100g당 값과 원자료로 이동합니다." },
      { href: "/tools/label-converter", label: "영양성분표 100g 환산 계산기", description: "포장 라벨 값을 같은 기준으로 바꿉니다." },
      { href: "/nutrition-data/food/group", label: "음식 식품군 목록", description: "다른 메뉴군의 비교표를 봅니다." },
    ],
    sourceLinks: [
      { href: `https://yungyanggogo.kr${url}`, label: `영양고고 ${g.name} 식품군 비교표`, description: "공공데이터포털 전국통합식품영양성분정보(음식) 표준데이터를 저장·정리한 표입니다." },
      { href: "https://www.data.go.kr/", label: "공공데이터포털", description: "원천 표준데이터 제공처입니다. (검토 시 데이터셋 상세 URL 확인 필요)" },
    ],
  };
}

writeFileSync(new URL("../content/blog/drafts-2026-09-30-food-groups.json", import.meta.url), `${JSON.stringify(groups.map(post), null, 2)}\n`);
console.log(`wrote ${groups.length} pending drafts`);
