// 공개 유지 식품군 글 9편에 덧붙이는 '분포가 얼마나 흩어져 있는가' 절.
// 스냅샷에 있는 값(stats·perKcal)으로만 계산하고, 원인은 추정하지 않는다.
// 사람이 쓴 해설(tip)은 수치를 자리표시자 대신 함수 인자로 받아 채운다.

const MIN_MEDIAN = 2; // 중앙값이 이 값 미만이면 상대 폭이 의미 없어 비교에서 뺀다
const PORTION_NOTE = "아래 먹는 양은 계산 방법을 보여 주기 위한 가정이며, 특정 제품의 실제 값이 아닙니다.";

const FLAT_DIFF = 0.1; // 두 기준의 폭 차이가 이 값(10%p) 미만이면 뚜렷한 차이로 보지 않는다

// 받침 유무로 을/를을 고른다(한글이 아닌 끝 글자는 '를').
const objectParticle = (word) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "을" : "를";
};
const pct = (value) => `${Math.round(value * 100)}%`;
const spreadOf = (s) => (s.q3 - s.q1) / s.median;

function wideNutrients(g, labels, minSample) {
  return Object.entries(g.stats)
    .filter(([, s]) => s.n >= minSample && s.n * 2 >= g.comparable && s.median >= MIN_MEDIAN)
    .map(([key, s]) => ({ key, label: labels[key], spread: spreadOf(s), s }));
}

function spreadParagraph(g, labels, minSample) {
  const rows = wideNutrients(g, labels, minSample).sort((a, b) => b.spread - a.spread);
  if (rows.length < 2) return null;
  const [most, least] = [rows[0], rows.at(-1)];
  return `값이 절반 이상의 자료에 있는 성분만 놓고, 중간 50% 범위의 폭을 중앙값으로 나눠 보면 ${g.name}에서 가장 크게 흩어진 성분은 ${most.label}(${pct(most.spread)})이고 상대적으로 가장 일정한 성분은 ${least.label}(${pct(least.spread)})입니다. 폭이 큰 성분일수록 어떤 자료를 고르느냐에 따라 결과가 크게 달라지므로, 중앙값 하나로 대신하지 말고 비교표에서 먹으려는 것과 비슷한 자료를 직접 확인해야 합니다.`;
}

function perKcalParagraph(g, labels, minSample, perKcalUnits) {
  const changes = Object.keys(perKcalUnits)
    .map((key) => ({ key, base: g.stats[key], k: g.perKcal[key] }))
    .filter(({ base, k }) => base && k && base.n >= minSample && k.n >= minSample && base.median >= MIN_MEDIAN && k.median > 0)
    .map(({ key, base, k }) => ({ label: labels[key], per100: spreadOf(base), perKcal: spreadOf(k) }))
    .sort((a, b) => Math.abs(b.per100 - b.perKcal) - Math.abs(a.per100 - a.perKcal));
  if (!changes.length) return null;
  const c = changes[0];
  const diff = c.perKcal - c.per100;
  const verdict = Math.abs(diff) < FLAT_DIFF
    ? "두 기준의 폭이 비슷해, 열량으로 맞춰도 비교 결과가 크게 달라지지 않습니다."
    : diff < 0
      ? "열량 차이를 걷어내면 자료들이 더 가깝게 모입니다. 100g 값의 차이 중 상당 부분이 열량 차이와 겹친다는 뜻입니다."
      : "열량으로 맞추면 오히려 더 흩어집니다. 이 성분의 차이는 열량 차이만으로는 설명되지 않습니다.";
  return `${c.label}의 중간 50% 폭은 100g당으로 보면 중앙값의 ${pct(c.per100)}, 100kcal당으로 보면 ${pct(c.perKcal)}입니다. ${verdict}`;
}

function portionTable(g, entry, spec, labels, fmt) {
  const focus = g.stats[entry.focus];
  const showEnergy = entry.focus !== "energy";
  const at = (value, grams) => fmt(Math.round(((value * grams) / 100) * 10) / 10);
  const head = ["먹는 양(가정)", ...(showEnergy ? ["열량(중앙값)"] : []), `${labels[entry.focus]} 하위 25%`, "중앙값", "상위 25%"];
  const rows = spec.portions.map((grams) => [
    `${grams}${spec.unit}`,
    ...(showEnergy ? [`${at(g.stats.energy.median, grams)} kcal`] : []),
    `${at(focus.q1, grams)} ${focus.unit}`,
    `${at(focus.median, grams)} ${focus.unit}`,
    `${at(focus.q3, grams)} ${focus.unit}`,
  ]);
  return { type: "table", headers: head, rows };
}

// portions가 없는 글은 중앙값이 상태·형태가 다른 두 무리 사이에 걸려 있어 먹는 양 표를 만들지 않는다.
export const DEEP_DIVES = {
  "sandwich-nutrition-100g-compare": { portions: [120, 180, 250], unit: "g",
    tip: (g, f) => `열량의 중간 50% 범위(${f(g.stats.energy.q1)}~${f(g.stats.energy.q3)}kcal)가 비슷한 두 메뉴도 당류는 최저 ${f(g.stats.sugars.min)}g에서 최고 ${f(g.stats.sugars.max)}g, 나트륨은 최저 ${f(g.stats.sodium.min)}mg에서 최고 ${f(g.stats.sodium.max)}mg까지 벌어질 수 있습니다. 샌드위치를 고를 때는 열량 한 줄로 끝내지 말고 당류·나트륨 칸을 같은 기준(100g)으로 나란히 보세요.` },
  "fried-chicken-nutrition-100g-compare": { portions: [150, 250, 400], unit: "g",
    tip: (g, f) => `단백질은 최저 ${f(g.stats.protein.min)}g에서 최고 ${f(g.stats.protein.max)}g로 약 ${f(g.stats.protein.max / g.stats.protein.min)}배 차이인데, 나트륨은 최저 ${f(g.stats.sodium.min)}mg에서 최고 ${f(g.stats.sodium.max)}mg로 약 ${f(g.stats.sodium.max / g.stats.sodium.min)}배 차이입니다. 단백질을 기준으로 고르더라도 나트륨 칸을 함께 봐야 하는 이유입니다.` },
  "salad-nutrition-100g-compare": { portions: [150, 250, 350], unit: "g",
    tip: (g, f) => `단백질은 중앙값 ${f(g.stats.protein.median)}g인데 최고 ${f(g.stats.protein.max)}g인 메뉴도 있어 토핑에 따라 크게 갈립니다. 어떤 토핑 때문인지는 이 자료만으로 알 수 없으므로, 먹으려는 샐러드의 메뉴 이름과 구성을 비교표에서 직접 확인하세요.` },
  "snack-nutrition-100g-compare": { portions: [30, 60, 100], unit: "g",
    tip: (g, f) => `열량의 중간 50% 범위는 ${f(g.stats.energy.q1)}~${f(g.stats.energy.q3)}kcal로 모여 있지만 나트륨은 최저 ${f(g.stats.sodium.min)}mg에서 최고 ${f(g.stats.sodium.max)}mg, 당류는 최고 ${f(g.stats.sugars.max)}g까지 벌어집니다. 열량이 비슷해 보여도 당류·나트륨 칸에서 갈린다는 점을 비교표에서 확인하세요.` },
  "sauce-sodium-100g-compare": { portions: [5, 15, 30], unit: "g",
    tip: (g, f) => `100g당 최고 ${f(g.stats.sodium.max)}mg 같은 값을 그대로 읽으면 과장되고, 중앙값 한 숟가락만 보면 상위 제품을 놓칩니다. 같은 양(위 표)으로 맞춘 뒤 하위·중앙·상위를 나란히 보면 한 번 쓰는 양에서의 차이가 드러납니다. 한 숟가락의 실제 무게는 제품마다 다릅니다.` },
  "curry-roux-nutrition-basis": {
    tip: (g, f) => `${g.comparable}개 중 최저 열량 ${f(g.stats.energy.min)}kcal·최저 나트륨 ${f(g.stats.sodium.min)}mg 자료는 중앙값(${f(g.stats.energy.median)}kcal, ${f(g.stats.sodium.median)}mg)과 크게 달라, 농축된 고형 형태와 조리된 즉석 형태의 기준이 섞여 있음을 시사합니다. 중앙값은 두 형태 어느 쪽에도 맞지 않으니 형태가 같은 자료끼리만 비교하세요.` },
  "corn-nutrition-raw-boiled-dried": {
    tip: (g, f) => `열량의 하위 25% 경계(${f(g.stats.energy.q1)}kcal)와 상위 25% 경계(${f(g.stats.energy.q3)}kcal)가 두 배 넘게 벌어져 있어, 중간 50% 범위가 수분 상태가 다른 두 무리를 모두 걸치고 있습니다. 평균이나 중앙값 대신 같은 상태의 자료끼리 묶어 보는 것이 이 식품군을 읽는 방법입니다.` },
  "mackerel-nutrition-by-state": {
    tip: (g, f) => `단백질의 중간 50% 범위는 ${f(g.stats.protein.q1)}~${f(g.stats.protein.q3)}g로 좁은 반면 지방은 ${f(g.stats.fat.q1)}~${f(g.stats.fat.q3)}g로 넓습니다. 자료마다 달라지는 정도는 단백질보다 지방이 훨씬 큽니다. 같은 고등어라도 조리·가공 상태가 다른 자료를 섞어 비교하지 마세요.` },
  "salmon-nutrition-by-state": {
    tip: (g, f) => `나트륨은 하위 25% 경계 ${f(g.stats.sodium.q1)}mg에서 상위 25% 경계 ${f(g.stats.sodium.q3)}mg까지, 최고 ${f(g.stats.sodium.max)}mg까지 벌어집니다. 연어는 단백질(${f(g.stats.protein.q1)}~${f(g.stats.protein.q3)}g)이 일정한 대신 나트륨이 자료마다 크게 다르므로 생것인지 가공품인지 자료 이름을 먼저 확인하세요.` },
};

export function deepDiveSection({ entry, g, labels, minSample, perKcalUnits, fmt }) {
  const spec = DEEP_DIVES[entry.slug];
  if (!spec) return null;
  const blocks = [
    spreadParagraph(g, labels, minSample),
    perKcalParagraph(g, labels, minSample, perKcalUnits),
    { text: spec.tip(g, fmt) },
  ].filter(Boolean).map((b) => (typeof b === "string" ? { type: "paragraph", text: b } : { type: "paragraph", text: b.text }));
  if (spec.portions) {
    blocks.push({ type: "paragraph", text: `${g.name}${objectParticle(g.name)} 먹는 양별로 바꾸면 이렇게 됩니다. ${PORTION_NOTE}` });
    blocks.push(portionTable(g, entry, spec, labels, fmt));
  }
  return { id: "spread", title: `${g.name} 수치는 얼마나 흩어져 있는가`, body: [], blocks };
}
