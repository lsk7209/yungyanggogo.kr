// Builds 30 scheduled food-group articles from the committed production-data
// snapshot (content/editorial-data/food-groups-2026-09-30.json, created by
// scripts/snapshot-food-group-data.mjs). Every number in the output is computed
// from that snapshot; the hand-written angle text only cites values verified in
// it. All posts stay humanReview "pending" + noindex until a person approves.
import { readFileSync, writeFileSync, rmSync } from "node:fs";

const root = new URL("../", import.meta.url);
const snapshot = JSON.parse(readFileSync(new URL("content/editorial-data/food-groups-2026-09-30.json", root), "utf8"));
const checkedAt = snapshot.checkedAt;
const byName = new Map(snapshot.groups.map((g) => [`${g.dataset}:${g.name}`, g]));

const datasetLabel = {
  food: { short: "음식", source: "전국통합식품영양성분정보(음식) 표준데이터", unit: "메뉴" },
  process: { short: "가공식품", source: "전국통합식품영양성분정보(가공식품) 표준데이터", unit: "제품" },
  material: { short: "원재료성 식품", source: "전국통합식품영양성분정보(원재료성 식품) 표준데이터", unit: "자료" },
};
const nutrientLabel = { energy: "열량", protein: "단백질", fat: "지방", carbs: "탄수화물", sugars: "당류", sodium: "나트륨" };

// One entry per day. `angle` = the question this post answers; `insight` =
// group-specific observations (only values present in the snapshot);
// `example` = a clearly labelled hypothetical serving calculation.
const plan = [
  { key: "food:샌드위치", slug: "sandwich-nutrition-100g-compare", theme: "green", focus: "sodium",
    title: "샌드위치 영양성분 비교: 카페·베이커리 232개 메뉴 100g당 열량과 나트륨",
    angle: "카페에서 샌드위치를 고를 때 메뉴판 칼로리만 보면 한 개 크기가 달라 비교가 어긋납니다. 같은 100g으로 맞추면 차이가 어디서 나는지 보입니다.",
    insight: ["열량은 절반의 메뉴가 100g당 {energy.q1}~{energy.q3}kcal 안에 모여 있지만 최저 {energy.min}kcal, 최고 {energy.max}kcal까지 퍼져 있습니다. 나트륨도 최저 {sodium.min}mg에서 최고 {sodium.max}mg까지 벌어집니다.", "지방과 탄수화물은 232개 중 일부 메뉴에만 값이 있어(지방 {fat.n}개, 탄수화물 {carbs.n}개) 이 두 성분의 중앙값은 대표성이 약합니다. 반대로 열량·단백질·당류·나트륨은 모든 메뉴에 값이 있습니다."],
    example: { grams: 180, what: "샌드위치 한 개" }, related: ["food:샐러드", "process:샌드위치"] },
  { key: "food:닭튀김", slug: "fried-chicken-nutrition-100g-compare", theme: "amber", focus: "protein",
    title: "치킨(닭튀김) 영양성분 비교: 프랜차이즈 메뉴 100g당 단백질·나트륨",
    angle: "치킨은 한 마리, 반 마리, 조각 단위로 팔려서 메뉴 간 비교가 어렵습니다. 100g당 값으로 맞추면 양념·조리법에 따른 차이를 분리해 볼 수 있습니다.",
    insight: ["단백질은 100g당 중앙값 {protein.median}g으로, 절반의 메뉴가 {protein.q1}~{protein.q3}g 사이입니다. 100kcal당으로 바꾸면 중앙값 {pk.protein}g입니다.", "열량은 최고 {energy.max}kcal까지 있어 중앙값({energy.median}kcal)의 두 배를 넘는 메뉴도 있습니다. 당류는 최고 {sugars.max}g입니다. 비교할 때는 양념·소스 메뉴인지 후라이드 메뉴인지를 비교표에서 함께 확인하세요."],
    example: { grams: 250, what: "뼈를 뺀 가식부" }, related: ["food:피자", "process:양념육"] },
  { key: "food:샐러드", slug: "salad-nutrition-100g-compare", theme: "green", focus: "energy",
    title: "샐러드 영양성분 비교: 100g당 열량이 {energy.min}~{energy.max}kcal로 갈리는 이유",
    angle: "샐러드라는 이름만으로 열량이 낮다고 단정하기 어렵습니다. 공공데이터의 샐러드 메뉴를 100g 기준으로 맞춰 범위를 확인합니다.",
    insight: ["100g당 열량은 최저 {energy.min}kcal에서 최고 {energy.max}kcal까지이고, 절반의 메뉴가 {energy.q1}~{energy.q3}kcal 사이입니다. 채소 위주 메뉴와 치즈·곡물·육류 토핑이 올라간 메뉴가 한 분류에 함께 들어 있습니다.", "나트륨은 중앙값 {sodium.median}mg이지만 최고 {sodium.max}mg인 메뉴도 있습니다. 드레싱이 따로 포장된 메뉴라면 제공 값이 드레싱 포함 기준인지 확인이 필요합니다."],
    example: { grams: 250, what: "드레싱 포함 한 그릇" }, related: ["food:샌드위치", "process:샐러드"] },
  { key: "food:피자", slug: "pizza-nutrition-100g-compare", theme: "terra", focus: "sodium",
    title: "피자 영양성분 비교: 100g당 열량은 비슷해도 나트륨은 다른 이유",
    angle: "피자는 조각 크기와 도우 두께가 브랜드마다 달라 조각당 칼로리로는 비교가 어렵습니다. 100g으로 맞추면 무엇이 비슷하고 무엇이 다른지 보입니다.",
    insight: ["{total}개 메뉴의 100g당 열량은 {energy.min}~{energy.max}kcal로 폭이 좁습니다. 절반이 {energy.q1}~{energy.q3}kcal 안에 들어 있습니다.", "반면 나트륨은 최저 {sodium.min}mg, 최고 {sodium.max}mg으로 세 배 이상 벌어집니다. 열량이 비슷하다고 나트륨도 비슷하다고 볼 수 없는 예입니다. 지방·탄수화물은 {fat.n}개 메뉴에만 값이 있어 비교하지 않았습니다."],
    example: { grams: 300, what: "조각 세 개" }, related: ["process:피자", "food:닭튀김"] },
  { key: "food:생강차", slug: "ginger-tea-sugar-100ml-compare", theme: "amber", focus: "sugars",
    title: "카페 생강차 당류 비교: 100ml당 당류와 한 잔 용량으로 계산하기",
    angle: "카페 생강차는 메뉴마다 한 잔 용량이 다릅니다. 공공데이터의 생강차 메뉴를 100ml 기준으로 맞춰 당류가 얼마인지, 한 잔으로 바꾸면 어떻게 되는지 봅니다.",
    insight: ["비교 가능한 {comparable}개 메뉴의 100ml당 당류는 {sugars.min}~{sugars.max}g이고 중앙값은 {sugars.median}g입니다. 100ml당 값의 폭이 좁아서, 한 잔 기준 값은 메뉴보다 잔 용량에 따라 더 크게 달라질 수 있습니다.", "전체 {total}개 중 {excluded}개는 기준량 단위가 달라 100ml로 환산하지 않았습니다. 지방·탄수화물은 값이 있는 메뉴가 없어 표에서 계산 불가로 남습니다."],
    example: { grams: 355, what: "큰 사이즈 한 잔", unit: "ml" }, related: ["process:액상차", "process:과·채주스"] },
  { key: "process:만두", slug: "frozen-dumpling-nutrition-100g-compare", theme: "terra", focus: "sodium",
    title: "냉동만두 영양성분 비교: 가공식품 {total}개 100g당 나트륨 분포",
    angle: "만두는 포장 뒷면에 1회 제공량이 제각각이라 봉지끼리 비교가 어렵습니다. 가공식품 표준데이터의 만두 제품을 100g으로 맞춰 분포를 확인합니다.",
    insight: ["나트륨은 100g당 {sodium.min}~{sodium.max}mg이고 절반이 {sodium.q1}~{sodium.q3}mg 사이에 몰려 있습니다. 다른 식품군에 비해 제품 간 폭이 좁은 편입니다.", "열량 중앙값은 {energy.median}kcal, 단백질 중앙값은 {protein.median}g입니다. 모든 제품에 여섯 가지 성분 값이 다 있어 성분 간 비교가 가능한 식품군입니다."],
    example: { grams: 150, what: "만두 여러 개" }, related: ["process:어묵", "process:밥류"] },
  { key: "process:일반과자", slug: "snack-nutrition-100g-compare", theme: "amber", focus: "sugars",
    title: "과자 영양성분 비교: 100g당 열량·당류가 넓게 퍼지는 이유",
    angle: "과자는 봉지 크기와 1회 제공량 표기가 제각각이라 봉지 뒷면 숫자를 그대로 비교하면 틀리기 쉽습니다. 100g으로 맞춰 과자 {total}개의 분포를 봅니다.",
    insight: ["100g당 열량은 최저 {energy.min}kcal부터 최고 {energy.max}kcal까지 퍼져 있습니다. 절반은 {energy.q1}~{energy.q3}kcal 사이입니다.", "당류는 중앙값 {sugars.median}g, 최고 {sugars.max}g입니다. 같은 일반과자로 분류돼도 스낵, 부각, 쿠키형 과자가 섞여 있어 이름만으로 값을 짐작하기 어렵습니다."],
    example: { grams: 60, what: "과자 한 봉지" }, related: ["process:비스킷/쿠키/크래커", "process:케이크"] },
  { key: "process:양념육", slug: "marinated-meat-nutrition-100g-compare", theme: "terra", focus: "sodium",
    title: "양념육 영양성분 비교: 불고기·양념갈비류 100g당 나트륨과 당류",
    angle: "양념육은 고기에 양념이 더해진 제품이라 같은 부위 생고기와 값이 다릅니다. 양념육 제품 {total}개를 100g으로 맞춰 양념이 만드는 차이를 봅니다.",
    insight: ["나트륨은 100g당 {sodium.min}~{sodium.max}mg으로 20배 넘게 벌어지고 중앙값은 {sodium.median}mg입니다.", "단백질은 100kcal당 중앙값 {pk.protein}g이고, 당류는 최고 {sugars.max}g입니다. 제품 값이 조리 전 기준인지 포장에서 확인하세요. 굽거나 볶으면 수분이 빠져 무게가 달라집니다."],
    example: { grams: 200, what: "조리 전 한 번 분량" }, related: ["process:햄", "process:소시지"] },
  { key: "process:기타 소스류", slug: "sauce-sodium-100g-compare", theme: "slate", focus: "sodium",
    title: "소스·양념장 나트륨 비교: 100g당 수치보다 사용량이 중요한 이유",
    angle: "소스는 100g당 나트륨이 높게 보여도 실제로는 한 숟가락씩 씁니다. 소스 제품 {comparable}개의 100g당 값을 본 뒤 실제 사용량으로 바꾸는 방법을 설명합니다.",
    insight: ["100g당 나트륨은 최저 {sodium.min}mg부터 최고 {sodium.max}mg까지, 식품군 안에서 가장 넓게 퍼진 편입니다. 육수·농축액·비빔장·치킨소스가 한 분류에 섞여 있기 때문입니다.", "당류도 중앙값 {sugars.median}g, 최고 {sugars.max}g입니다. 소스는 사용량이 제품마다, 요리마다 달라 100g 값만 보고 제품끼리 우열을 가리기 어렵습니다."],
    example: { grams: 15, what: "한 큰술" }, related: ["process:카레", "process:젓갈/액젓"] },
  { key: "process:밥류", slug: "instant-rice-nutrition-100g-compare", theme: "green", focus: "energy",
    title: "즉석밥·볶음밥 영양성분 비교: 100g당 열량과 나트륨",
    angle: "즉석밥, 볶음밥, 비빔밥 제품은 모두 밥류로 분류되지만 양념 여부에 따라 값이 크게 다릅니다. 밥류 {total}개를 100g으로 맞춰 봅니다.",
    insight: ["나트륨은 중앙값 {sodium.median}mg이지만 하위 25% 지점은 {sodium.q1}mg, 최고는 {sodium.max}mg입니다. 나트륨이 낮은 제품과 높은 제품이 한 분류에 함께 있어 분포가 한쪽으로 치우칩니다.", "열량은 절반이 {energy.q1}~{energy.q3}kcal 사이입니다. 즉석밥은 한 개 무게가 제품마다 달라 개당 비교 전에 100g 값을 먼저 보는 편이 정확합니다."],
    example: { grams: 210, what: "즉석밥 한 개" }, related: ["process:도시락", "process:죽"] },
  { key: "process:과·채주스", slug: "fruit-vegetable-juice-sugar-100ml", theme: "green", focus: "sugars",
    title: "과·채주스 당류 비교: 100ml당 당류와 한 병 용량 계산",
    angle: "주스는 병·팩 용량이 제각각이라 한 병 당류를 비교하려면 먼저 100ml 기준으로 맞춰야 합니다. 과·채주스 제품의 분포를 봅니다.",
    insight: ["비교 가능한 {comparable}개의 100ml당 당류는 {sugars.min}~{sugars.max}g, 중앙값 {sugars.median}g입니다. 열량 중앙값은 {energy.median}kcal입니다.", "전체 {total}개 중 {excluded}개는 기준량이 g 등 다른 단위라 100ml 비교에서 제외했습니다. 단위가 다른 값을 억지로 환산하지 않았습니다."],
    example: { grams: 200, what: "주스 한 팩", unit: "ml" }, related: ["process:액상차", "food:생강차"] },
  { key: "process:비스킷/쿠키/크래커", slug: "cookie-biscuit-nutrition-100g-compare", theme: "amber", focus: "sugars",
    title: "쿠키·비스킷 영양성분 비교: 100g당 지방과 당류 분포",
    angle: "쿠키와 비스킷은 한 개 무게가 작아 1개당 숫자가 작게 보입니다. 100g으로 맞추면 제품 간 구성 차이가 드러납니다.",
    insight: ["100g당 열량 중앙값은 {energy.median}kcal로 이번 30개 식품군 중 높은 편이고, 지방 중앙값은 {fat.median}g입니다.", "당류는 절반이 {sugars.q1}~{sugars.q3}g 사이지만 최고 {sugars.max}g인 제품도 있습니다. 한 분류 안에 성격이 다른 제품이 함께 있어 범위가 넓습니다."],
    example: { grams: 30, what: "쿠키 세 개" }, related: ["process:일반과자", "process:기타 빵"] },
  { key: "process:반찬", slug: "side-dish-nutrition-100g-compare", theme: "green", focus: "sodium",
    title: "시판 반찬 영양성분 비교: 100g당 나트륨과 실제 먹는 양",
    angle: "시판 반찬은 한 번에 먹는 양이 적어 100g당 값만 보면 체감과 다릅니다. 반찬 제품 {total}개의 분포를 보고 실제 한 접시로 바꿔 봅니다.",
    insight: ["100g당 나트륨은 {sodium.min}~{sodium.max}mg, 중앙값 {sodium.median}mg입니다.", "열량은 최저 {energy.min}kcal부터 최고 {energy.max}kcal까지로 제품 간 차이가 큽니다. 반찬은 한 끼에 여러 가지를 함께 먹으므로 반찬별 값을 따로 더해야 합니다."],
    example: { grams: 50, what: "반찬 한 접시" }, related: ["process:기타김치", "process:도시락"] },
  { key: "process:기타김치", slug: "kimchi-sodium-100g-compare", theme: "terra", focus: "sodium",
    title: "김치 나트륨 비교: 100g당 수치와 한 접시 양으로 계산하기",
    angle: "김치는 열량이 낮지만 나트륨은 제품마다 차이가 있습니다. 기타김치로 분류된 제품 {total}개를 100g으로 맞춰 봅니다.",
    insight: ["100g당 열량은 중앙값 {energy.median}kcal로 낮고, 나트륨은 {sodium.min}~{sodium.max}mg, 중앙값 {sodium.median}mg입니다.", "제조사 기준으로는 {makerCount}곳의 제품만 들어 있어 시판 김치 전체를 대표하지 않습니다. 같은 제조사 제품이 많으면 분포가 그 제조사 쪽으로 치우칠 수 있습니다."],
    example: { grams: 40, what: "김치 한 접시" }, related: ["process:반찬", "process:젓갈/액젓"] },
  { key: "process:국/탕류", slug: "soup-nutrition-100g-compare", theme: "slate", focus: "sodium",
    title: "즉석 국·탕 영양성분 비교: 100g당 나트륨과 한 그릇 계산",
    angle: "국과 탕은 100g당 값이 작아 보여도 한 그릇이 수백 g이라 실제 섭취량은 커집니다. 국/탕류 {total}개로 계산 순서를 설명합니다.",
    insight: ["100g당 나트륨 중앙값은 {sodium.median}mg, 범위는 {sodium.min}~{sodium.max}mg입니다. 열량은 곰탕·설렁탕처럼 {energy.min}kcal대인 제품부터 {energy.max}kcal인 제품까지 있습니다.", "국물 요리는 국물을 얼마나 마시는지에 따라 실제 섭취량이 달라집니다. 제품 값이 국물 포함 기준인지 상세 페이지에서 확인하세요."],
    example: { grams: 500, what: "국 한 그릇" }, related: ["process:찌개/전골류", "process:즉석 면요리"] },
  { key: "process:기타 빵", slug: "bread-nutrition-100g-compare", theme: "amber", focus: "fat",
    title: "시판 빵 영양성분 비교: 100g당 지방과 당류가 갈리는 지점",
    angle: "빵은 크기와 속재료가 다양해 개당 칼로리 비교가 어렵습니다. 기타 빵으로 분류된 제품 {total}개를 100g으로 맞춥니다.",
    insight: ["100g당 지방은 최저 {fat.min}g, 최고 {fat.max}g으로 크게 다릅니다. 절반이 {fat.q1}~{fat.q3}g 사이입니다.", "당류는 중앙값 {sugars.median}g, 최고 {sugars.max}g입니다. 제조사가 {makerCount}곳으로 제품마다 달라 특정 제조사 경향이 분포를 좌우하지 않습니다."],
    example: { grams: 90, what: "빵 한 개" }, related: ["process:케이크", "process:비스킷/쿠키/크래커"] },
  { key: "process:죽", slug: "porridge-nutrition-100g-compare", theme: "green", focus: "energy",
    title: "시판 죽 영양성분 비교: 밀키트 조리 전·후 기준 확인법",
    angle: "죽 제품 중에는 쌀을 따로 넣는 밀키트가 섞여 있어 제품명과 기준 상태를 먼저 확인해야 합니다. 죽 {total}개의 값을 그 관점에서 봅니다.",
    insight: ["100g당 열량은 {energy.min}~{energy.max}kcal로, 같은 레시피라도 ‘쌀 제외’ 표기가 있는 밀키트와 쌀 포함 제품이 따로 등록돼 있습니다.", "나트륨은 중앙값 {sodium.median}mg으로 이번 식품군 중 낮은 편입니다. 다만 제조사 {makerCount}곳 중 한 곳의 제품이 대부분이라 시판 죽 전체의 경향으로 보기는 어렵습니다."],
    example: { grams: 300, what: "죽 한 그릇" }, related: ["process:밥류", "process:국/탕류"] },
  { key: "process:도시락", slug: "lunchbox-nutrition-100g-compare", theme: "green", focus: "sodium",
    title: "도시락 영양성분 비교: 100g당 값과 한 개 무게로 계산하기",
    angle: "도시락은 한 개 무게가 커서 100g당 값보다 한 개 전체 값이 중요합니다. 도시락 {total}개로 100g당 분포와 계산 순서를 봅니다.",
    insight: ["100g당 열량은 {energy.min}~{energy.max}kcal로 폭이 좁고 중앙값은 {energy.median}kcal입니다.", "나트륨은 중앙값 {sodium.median}mg, 최고 {sodium.max}mg입니다. 100g 값이 비슷해도 한 개 무게가 다르면 한 개 기준 섭취량은 크게 달라집니다."],
    example: { grams: 400, what: "도시락 한 개" }, related: ["process:밥류", "process:반찬"] },
  { key: "process:떡", slug: "rice-cake-nutrition-100g-compare", theme: "terra", focus: "sodium",
    title: "떡·떡볶이 제품 영양성분 비교: 100g당 나트륨이 크게 갈리는 이유",
    angle: "떡으로 분류된 제품에는 가래떡, 떡국떡 같은 원료형과 소스가 든 떡볶이·떡강정이 함께 있습니다. {total}개를 100g으로 맞춰 차이를 봅니다.",
    insight: ["100g당 나트륨은 {sodium.min}~{sodium.max}mg으로 벌어지고 중앙값은 {sodium.median}mg입니다. 소스가 함께 든 떡볶이류가 섞여 있으니 제품별 값은 상세 페이지에서 확인하세요.", "열량은 절반이 {energy.q1}~{energy.q3}kcal에 모여 있지만 최고 {energy.max}kcal인 제품이 하나 있습니다. 같은 제품의 맛별 값이 크게 다르면 원자료의 기준 상태를 상세 페이지에서 확인하세요."],
    example: { grams: 200, what: "떡볶이 한 접시" }, related: ["process:어묵", "process:기타 소스류"] },
  { key: "process:어묵", slug: "fish-cake-sodium-100g-compare", theme: "slate", focus: "sodium",
    title: "어묵 나트륨 비교: 100g당 수치로 제품 간 차이 보기",
    angle: "어묵은 국, 볶음, 떡볶이에 두루 쓰여 섭취 빈도가 높습니다. 어묵 {total}개를 100g으로 맞춰 나트륨을 중심으로 봅니다.",
    insight: ["100g당 나트륨은 최저 {sodium.min}mg, 중앙값 {sodium.median}mg, 최고 {sodium.max}mg입니다. 이번 30개 식품군 중 중앙값이 높은 편입니다.", "단백질은 100kcal당 중앙값 {pk.protein}g이고 열량은 {energy.min}~{energy.max}kcal로 제품 간 폭이 좁습니다."],
    example: { grams: 80, what: "어묵 한 번 분량" }, related: ["process:떡", "process:국/탕류"] },
  { key: "process:젓갈/액젓", slug: "salted-seafood-sodium-100g", theme: "slate", focus: "sodium",
    title: "젓갈·액젓 나트륨 비교: 100g당 값을 한 숟가락으로 바꾸기",
    angle: "젓갈과 액젓은 100g당 나트륨이 매우 높지만 한 번에 쓰는 양은 적습니다. 제품 {comparable}개의 값을 실제 사용량으로 바꾸는 방법을 봅니다.",
    insight: ["100g당 나트륨 중앙값은 {sodium.median}mg, 최고 {sodium.max}mg으로 이번 30개 식품군 가운데 고형 카레와 함께 가장 높은 쪽입니다.", "최저값이 {sodium.min}mg으로 기록된 자료도 있어, 상세 페이지에서 원자료 표기를 확인할 필요가 있습니다. 극단값 하나가 결론을 바꾸지 않도록 중앙값과 사분위({sodium.q1}~{sodium.q3}mg)를 함께 봅니다."],
    example: { grams: 10, what: "한 작은 숟가락" }, related: ["process:기타김치", "process:기타 소스류"] },
  { key: "process:카레", slug: "curry-roux-nutrition-basis", theme: "amber", focus: "sodium",
    title: "카레 영양성분 읽는 법: 고형·분말 카레와 즉석 카레는 기준이 다릅니다",
    angle: "카레 영양성분을 검색하면 100g당 열량 400~500kcal대 숫자가 나와 놀라기 쉽습니다. 제품 형태에 따라 기준 상태가 다르기 때문입니다.",
    insight: ["카레로 분류된 {total}개 중 8개는 제품명에 ‘골든 카레’, ‘후레이크’가 들어간, 물에 풀어 조리하는 제품입니다. 이 8개가 분포를 좌우해 열량 중간 50% 범위가 {energy.q1}~{energy.q3}kcal, 나트륨 중간 50% 범위가 {sodium.q1}~{sodium.q3}mg로 모여 있습니다.", "반면 바로 먹는 즉석 카레 제품은 100g당 {energy.min}kcal로 기록돼 있습니다. 같은 카레라도 조리 전 원료와 조리된 음식은 직접 비교하지 않습니다."],
    example: { grams: 20, what: "고형 카레 한 조각" }, related: ["process:기타 소스류", "process:밥류"] },
  { key: "process:케이크", slug: "cake-sugar-100g-compare", theme: "amber", focus: "sugars",
    title: "케이크 당류 비교: 100g당 당류와 한 조각 무게",
    angle: "케이크는 조각 크기가 매장마다 달라 조각당 숫자로는 비교가 어렵습니다. 케이크 제품 {total}개를 100g으로 맞춰 당류를 봅니다.",
    insight: ["100g당 당류는 {sugars.min}~{sugars.max}g, 중앙값 {sugars.median}g입니다. 열량 중앙값은 {energy.median}kcal입니다.", "나트륨은 중앙값 {sodium.median}mg으로 낮은 편이지만 최고 {sodium.max}mg인 제품도 있습니다. 자료 수가 {total}개로 적어 경향을 일반화하기보다 개별 값 확인에 쓰는 편이 맞습니다."],
    example: { grams: 110, what: "케이크 한 조각" }, related: ["process:기타 빵", "process:비스킷/쿠키/크래커"] },
  { key: "process:소시지", slug: "sausage-nutrition-100g-compare", theme: "terra", focus: "fat",
    title: "소시지 영양성분 비교: 100g당 지방·나트륨과 자료 수의 한계",
    angle: "소시지는 한 봉지 용량과 1회 제공량이 다양합니다. 소시지 {total}개를 100g으로 맞추되, 자료 수가 적다는 한계를 먼저 밝힙니다.",
    insight: ["100g당 지방은 {fat.min}~{fat.max}g, 중앙값 {fat.median}g이고 나트륨은 {sodium.min}~{sodium.max}mg입니다.", "자료가 {total}개뿐이라 이 범위가 시판 소시지 전체를 대표하지 않습니다. 포장 제품이라면 라벨 값을 100g 환산 계산기로 바꿔 이 표와 나란히 보는 방법이 더 정확합니다."],
    example: { grams: 70, what: "소시지 한 번 분량" }, related: ["process:햄", "process:양념육"] },
  { key: "process:햄", slug: "ham-nutrition-100g-compare", theme: "terra", focus: "sodium",
    title: "햄 영양성분 비교: 100g당 나트륨과 단백질, 적은 자료로 읽는 법",
    angle: "햄은 슬라이스, 통햄, 캔햄처럼 형태가 달라 1회 제공량도 다릅니다. 햄 {total}개를 100g으로 맞춰 봅니다.",
    insight: ["100g당 나트륨은 {sodium.min}~{sodium.max}mg, 중앙값 {sodium.median}mg입니다. 단백질은 {protein.min}~{protein.max}g입니다.", "열량 최저 {energy.min}kcal인 제품과 {energy.q1}kcal 이상인 제품이 섞여 있어 지방 함량 차이가 큽니다. {total}개는 적은 표본이라 개별 제품 값 확인이 우선입니다."],
    example: { grams: 50, what: "슬라이스 몇 장" }, related: ["process:소시지", "process:양념육"] },
  { key: "process:찌개/전골류", slug: "stew-sodium-100g-compare", theme: "slate", focus: "sodium",
    title: "즉석 찌개·전골 나트륨 비교: 100g당 값과 한 냄비 계산",
    angle: "찌개와 전골은 여럿이 나눠 먹는 경우가 많아 1인분 계산이 까다롭습니다. 찌개/전골류 {total}개로 100g당 값에서 1인분으로 가는 순서를 봅니다.",
    insight: ["100g당 나트륨은 절반이 {sodium.q1}~{sodium.q3}mg에 모여 있고 최고는 {sodium.max}mg입니다. 국/탕류보다 중앙값이 높은 편입니다.", "열량은 {energy.min}~{energy.max}kcal로 낮지만, 한 냄비 전체 무게와 나눠 먹은 비율을 알아야 1인분 값이 나옵니다."],
    example: { grams: 350, what: "찌개 1인분" }, related: ["process:국/탕류", "process:즉석 면요리"] },
  { key: "process:즉석 면요리", slug: "instant-noodle-dish-nutrition-100g", theme: "slate", focus: "energy",
    title: "즉석 면요리 영양성분 비교: 곤약면부터 파스타까지 100g당 차이",
    angle: "즉석 면요리에는 곤약면, 짬뽕, 비빔면, 라자냐, 크림 파스타가 함께 분류돼 있습니다. {total}개를 100g으로 맞춰 면 종류와 소스에 따른 차이를 봅니다.",
    insight: ["100g당 열량은 곤약면 계열의 {energy.min}kcal부터 크림 파스타 계열의 {energy.max}kcal까지 20배 넘게 벌어집니다. 중앙값은 {energy.median}kcal입니다.", "나트륨은 {sodium.min}~{sodium.max}mg입니다. 한 분류 안에 성격이 다른 음식이 섞여 있어 식품군 중앙값보다 비슷한 메뉴끼리의 비교가 의미 있습니다."],
    example: { grams: 350, what: "면요리 한 그릇" }, related: ["process:국/탕류", "process:찌개/전골류"] },
  { key: "material:고등어류", slug: "mackerel-nutrition-by-state", theme: "slate", focus: "fat",
    title: "고등어 영양성분 비교: 생것·구운것·절인것·통조림 100g당 차이",
    angle: "고등어는 생물, 자반(절인 것), 구이, 통조림으로 먹는 방식이 다양합니다. 원재료성 식품 자료 {total}개를 상태별로 읽는 방법을 봅니다.",
    insight: ["100g당 지방은 {fat.min}~{fat.max}g으로 크게 다릅니다. 같은 생고등어도 산지와 채취 월에 따라 별도 자료로 등록돼 있어 계절 차이가 값에 반영돼 있습니다.", "단백질은 100kcal당 중앙값 {pk.protein}g입니다. 나트륨은 {sodium.n}개 자료에만 값이 있고, 소금에 절인 자료가 섞여 있어 생것과 직접 비교하지 않습니다."],
    example: { grams: 100, what: "구운 고등어 한 토막" }, related: ["material:연어류", "process:어묵"] },
  { key: "material:연어류", slug: "salmon-nutrition-by-state", theme: "terra", focus: "fat",
    title: "연어 영양성분 비교: 생연어·훈제·통조림·연어알 100g당 차이",
    angle: "연어 자료에는 생연어뿐 아니라 훈제, 구운 것, 통조림, 연어알까지 들어 있습니다. {total}개 자료를 상태와 부위로 나눠 읽는 방법을 봅니다.",
    insight: ["100g당 열량은 {energy.min}~{energy.max}kcal, 지방은 {fat.min}~{fat.max}g입니다. 자료마다 양식 여부, 수입국, 부위(육·전체), 조리 상태가 다릅니다.", "나트륨은 중앙값 {sodium.median}mg이지만 최고 {sodium.max}mg인 자료가 있습니다. 훈제·절임처럼 소금이 들어간 상태는 생연어와 따로 봐야 합니다."],
    example: { grams: 120, what: "생연어 한 접시" }, related: ["material:고등어류", "food:샐러드"] },
  { key: "material:옥수수", slug: "corn-nutrition-raw-boiled-dried", theme: "green", focus: "energy",
    title: "옥수수 영양성분 비교: 생것·삶은것·말린것 100g당 열량이 다른 이유",
    angle: "옥수수 100g당 열량을 찾으면 100kcal대와 300kcal대 숫자가 함께 나옵니다. 품종보다 수분 상태(생것·삶은것·말린것)가 더 큰 차이를 만듭니다.",
    insight: ["{total}개 자료의 100g당 열량은 {energy.min}~{energy.max}kcal입니다. 자료 이름을 보면 생것·삶은것·찐것은 100kcal대, 말린것·분말·구운것은 350~370kcal대로 나뉩니다.", "중앙값({energy.median}kcal)은 두 무리 사이에 걸려 있어 어느 쪽도 대표하지 않습니다. 이런 식품군은 중앙값보다 상태별로 나눠 보는 편이 정확합니다. 나트륨은 모든 자료에서 {sodium.max}mg 이하입니다."],
    example: { grams: 150, what: "삶은 옥수수 한 개의 가식부", bimodal: "이 식품군은 중앙값이 수분 상태가 다른 두 무리 사이에 걸려 있어 식품군 전체 값으로 계산하면 틀립니다. 삶은 옥수수라면 비교표에서 ‘삶은것’ 자료를 골라 그 값으로 계산하세요." }, related: ["material:연어류", "process:밥류"] },
];

function fmt(v) {
  if (v === null || v === undefined) return "계산 불가";
  return Number(v).toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

function fill(text, g) {
  return text.replace(/\{([a-z]+)(?:\.([a-z0-9]+))?\}/g, (_, a, b) => {
    if (a === "total") return String(g.total);
    if (a === "comparable") return String(g.comparable);
    if (a === "excluded") return String(g.total - g.comparable);
    if (a === "makerCount") return String(g.makerCount);
    if (a === "pk") return fmt(g.perKcal[b]?.median);
    const stat = g.stats[a];
    if (!stat || !(b in stat)) throw new Error(`unknown placeholder ${a}.${b} for ${g.name}`);
    if (stat.n === 0) throw new Error(`placeholder ${a}.${b} has no data for ${g.name}`);
    return fmt(stat[b]);
  });
}

const groupUrl = (g) => `/nutrition-data/${g.dataset}/group/${encodeURIComponent(g.name)}`;

function publishDate(index) {
  const day = String(index + 1).padStart(2, "0");
  return `2026-10-${day}T09:00:00+09:00`;
}

function buildPost(entry, index) {
  const g = byName.get(entry.key);
  if (!g) throw new Error(`missing snapshot group ${entry.key}`);
  const ds = datasetLabel[g.dataset];
  const unitBase = g.basis.replace("당", "");
  const perUnit = unitBase === "100ml" ? "ml" : "g";
  const focus = g.stats[entry.focus];
  const statsRows = Object.entries(g.stats).map(([key, s]) => [
    nutrientLabel[key],
    s.n ? `${fmt(s.median)} ${s.unit}` : "계산 불가",
    s.n ? `${fmt(s.q1)}~${fmt(s.q3)} ${s.unit}` : "-",
    s.n ? `${fmt(s.min)}~${fmt(s.max)} ${s.unit}` : "-",
    `${s.n}/${g.comparable}`,
  ]);
  const exampleUnit = entry.example.unit || "g";
  const exampleValue = focus.median === null ? null : Math.round((focus.median * entry.example.grams) / 100 * 10) / 10;
  const lowValue = focus.q1 === null ? null : Math.round((focus.q1 * entry.example.grams) / 100 * 10) / 10;
  const highValue = focus.q3 === null ? null : Math.round((focus.q3 * entry.example.grams) / 100 * 10) / 10;
  const makersText = g.makers.length
    ? `제조·판매처 기준으로는 ${g.makers.slice(0, 4).map(([m, c]) => `${m} ${c}개`).join(", ")} 등 ${g.makerCount}곳의 자료가 들어 있습니다. 특정 업체 자료가 많다는 것이 그 업체가 대표적이라는 뜻은 아닙니다.`
    : "원재료성 식품 자료라 제조사 대신 품종·산지·조리 상태별로 등록돼 있습니다. 개별 자료 이름에 상태가 적혀 있으니 비교 전에 같은 상태끼리 골라 보세요.";
  const related = entry.related.map((key) => byName.get(key)).filter(Boolean);
  const coverage = g.total === g.comparable
    ? `모두 ${unitBase} 기준으로 환산할 수 있습니다.`
    : `이 중 기준량 단위가 맞는 ${g.comparable}개만 ${unitBase} 기준으로 환산했고, 단위가 달라 환산할 수 없는 ${g.total - g.comparable}개는 제외했습니다.`;
  const title = fill(entry.title, g);
  const focusLabel = nutrientLabel[entry.focus];

  return {
    slug: entry.slug,
    title,
    subtitle: `${ds.short} 공공데이터의 ${g.name} ${g.comparable}개를 ${unitBase} 기준으로 맞춰 중앙값·범위·계산 방법을 정리합니다`,
    description: `영양고고에 저장된 ${ds.short} 공공데이터 중 ${g.name} ${g.comparable}개의 ${g.basis} ${focusLabel} 중앙값은 ${fmt(focus.median)}${focus.unit}(범위 ${fmt(focus.min)}~${fmt(focus.max)}${focus.unit})입니다. 실제 먹는 양으로 바꾸는 계산법과 해석 한계를 함께 설명합니다.`,
    category: "식품군 데이터 비교",
    mainKeyword: `${g.name} 영양성분`,
    expandedKeywords: [`${g.name} ${focusLabel}`, `${g.name} 칼로리`, `${g.name} ${unitBase}`, `${g.name} 비교`],
    publishedAt: publishDate(index),
    updatedAt: checkedAt,
    readingMinutes: 5,
    // Not public until a person reviews the text against the data and approves.
    humanReview: "pending",
    noindex: true,
    accentTheme: entry.theme,
    summaryCards: [
      { label: "비교 자료", value: `${g.comparable}개`, description: g.total === g.comparable ? `${ds.short} 공공데이터 ${g.name} 전체` : `전체 ${g.total}개 중 ${unitBase} 환산 가능 자료` },
      { label: `${g.basis} ${focusLabel} 중앙값`, value: `${fmt(focus.median)} ${focus.unit}`, description: `중간 50% ${fmt(focus.q1)}~${fmt(focus.q3)} ${focus.unit}` },
      { label: `${g.basis} 열량 중앙값`, value: `${fmt(g.stats.energy.median)} kcal`, description: `범위 ${fmt(g.stats.energy.min)}~${fmt(g.stats.energy.max)} kcal` },
    ],
    comparisonRows: [
      { basis: g.basis, bestFor: `${g.name} 자료끼리 밀도 비교`, caution: "실제 먹는 양과 다름" },
      { basis: "실제 섭취량", bestFor: "오늘 먹은 양 기록", caution: "무게를 알아야 계산 가능" },
      { basis: "100kcal당", bestFor: "열량 대비 구성 비교", caution: "절대량이 아닌 비율" },
    ],
    checklist: [
      `${g.basis} 값으로 먼저 비교하고, 실제 먹는 무게로 다시 계산합니다.`,
      "값이 있는 자료 수가 적은 성분은 중앙값을 참고용으로만 봅니다.",
      "같은 이름이라도 조리 상태·판매처·기준일이 다르면 따로 봅니다.",
      "포장 제품은 현재 포장 라벨을 우선하고, 이 글의 값은 비교 기준으로 씁니다.",
    ],
    sections: [
      {
        id: "introduction",
        title: `${g.name}, 무엇을 비교하려는가`,
        body: [],
        blocks: [
          { type: "paragraph", text: fill(entry.angle, g) },
          { type: "paragraph", text: `이 글의 숫자는 영양고고가 공공데이터포털의 ${ds.source}에서 받아 저장한 자료 중 식품군이 ‘${g.name}’인 ${g.total}개로 계산했습니다(${checkedAt} 확인). ${coverage} 저장된 자료는 공공데이터 전체의 일부이므로, 시판 ${g.name} 전체를 대표하는 통계가 아니라 등록된 자료의 분포입니다.` },
        ],
      },
      {
        id: "distribution",
        title: `${g.basis} 영양성분 분포`,
        body: [],
        blocks: [
          { type: "table", headers: ["영양성분", "중앙값", "중간 50% 범위", "최저~최고", "값이 있는 자료"], rows: statsRows },
          { type: "paragraph", text: "중앙값은 값을 크기순으로 세웠을 때 가운데 값이고, 중간 50% 범위는 하위 25%와 상위 25%를 뺀 구간입니다. 극단값 하나에 평균이 끌려가는 문제를 피하려고 평균 대신 이 두 값을 씁니다. 원자료에 값이 비어 있는 경우는 0으로 채우지 않고 계산에서 뺐습니다." },
        ],
      },
      {
        id: "what-stands-out",
        title: "데이터에서 보이는 점",
        body: [],
        blocks: [
          ...entry.insight.map((text) => ({ type: "paragraph", text: fill(text, g) })),
          { type: "paragraph", text: makersText },
        ],
      },
      {
        id: "calculate",
        title: "실제 먹는 양으로 바꿔 보기",
        body: [],
        blocks: [
          { type: "paragraph", text: `${g.basis} 값은 자료끼리 비교하는 기준이고, 실제로 먹은 양은 무게를 곱해야 나옵니다. 계산식은 ‘${g.basis} 값 × 먹은 양(${perUnit}) ÷ 100’입니다.` },
          { type: "paragraph", text: exampleValue === null
            ? `가상 예시: 먹는 양을 ${entry.example.grams}${exampleUnit}(${entry.example.what})으로 잡아도, 이 식품군은 ${focusLabel} 값이 있는 자료가 없어 계산할 수 없습니다.`
            : entry.example.bimodal
              ? `가상 예시: 먹는 양을 ${entry.example.grams}${exampleUnit}(${entry.example.what})으로 잡는다고 가정합니다. ${entry.example.bimodal}`
              : `가상 예시: 먹는 양을 ${entry.example.grams}${exampleUnit}(${entry.example.what})으로 잡으면, ${focusLabel} 중앙값 ${fmt(focus.median)}${focus.unit} 기준으로 약 ${fmt(exampleValue)}${focus.unit}입니다. 중간 50% 범위로 계산하면 약 ${fmt(lowValue)}~${fmt(highValue)}${focus.unit}입니다. 이 숫자는 계산 방법을 보여 주는 가정이며, 특정 제품의 실제 값이 아닙니다.` },
          { type: "list", ordered: true, items: [
            `${g.name} 비교표에서 먹으려는 것과 가장 비슷한 자료를 찾습니다.`,
            "자료 상세 페이지의 ‘먹는 양에 맞춰 계산하기’에 실제 무게를 넣습니다.",
            "포장 제품이라면 영양성분표 환산 계산기로 라벨 값을 같은 기준으로 바꿔 비교합니다.",
          ] },
        ],
      },
      {
        id: "limits",
        title: "해석할 때 주의할 점",
        body: [],
        blocks: [
          { type: "list", ordered: false, items: [
            "이 글은 제품 순위나 추천이 아니며, 어떤 식품이 건강에 좋거나 나쁘다고 판정하지 않습니다.",
            "공공데이터 값은 제공 시점 기준이라 현재 판매 제품의 포장 표시와 다를 수 있습니다.",
            `자료 수가 적은 성분(표의 ‘값이 있는 자료’ 참고)은 ${g.name} 전체 경향으로 일반화하지 않습니다.`,
            "질환, 임신, 복용 약 등 개인 조건이 있다면 의료·영양 전문가와 상의하세요.",
          ] },
        ],
      },
    ],
    internalLinks: [
      { href: groupUrl(g), label: `${g.name} ${g.comparable}개 비교표`, description: `자료별 ${g.basis} 값과 원자료로 이동합니다.` },
      ...related.map((r) => ({ href: groupUrl(r), label: `${r.name} 비교표`, description: `${datasetLabel[r.dataset].short} ${r.name} ${r.comparable}개의 ${r.basis} 값을 봅니다.` })),
      { href: "/tools/label-converter", label: "영양성분표 100g 환산 계산기", description: "포장 라벨 값을 같은 기준으로 바꿉니다." },
    ],
    sourceLinks: [
      { href: `https://yungyanggogo.kr${groupUrl(g)}`, label: `영양고고 ${g.name} 식품군 비교표`, description: `${ds.source}를 저장·정리한 표 (${checkedAt} 확인)` },
      { href: "https://www.data.go.kr/", label: "공공데이터포털", description: "원천 표준데이터 제공처" },
      { href: "https://various.foodsafetykorea.go.kr/nutrient/", label: "식품의약품안전처 식품영양성분 데이터베이스", description: "개별 식품 영양성분 원자료 확인 경로" },
    ],
  };
}

if (plan.length !== 30) throw new Error(`expected 30 plan entries, got ${plan.length}`);
const slugs = new Set(plan.map((p) => p.slug));
if (slugs.size !== plan.length) throw new Error("duplicate slugs");
const posts = plan.map(buildPost);
const leftover = JSON.stringify(posts).match(/\{[a-z]+(?:\.[a-z0-9]+)?\}/g);
if (leftover) throw new Error(`unfilled placeholders: ${[...new Set(leftover)].join(", ")}`);

// The 30-post schedule supersedes the earlier three pending drafts.
rmSync(new URL("content/blog/drafts-2026-09-30-food-groups.json", root), { force: true });
writeFileSync(new URL("content/blog/drafts-2026-10-food-groups-30.json", root), `${JSON.stringify(posts, null, 2)}\n`);
console.log(`wrote ${posts.length} pending scheduled posts (${posts[0].publishedAt} .. ${posts.at(-1).publishedAt})`);
