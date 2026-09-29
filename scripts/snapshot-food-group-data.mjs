// Snapshot the production data needed for the 30 scheduled articles into the repo
// (reproducible input for scripts/build-food-group-drafts.mjs).
// Input: output/groups-data.json from scripts/collect-food-group-pages.mjs (read-only GETs).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const wanted = [
  ["food", "샌드위치"], ["food", "닭튀김"], ["food", "샐러드"], ["food", "피자"], ["food", "생강차"],
  ["process", "만두"], ["process", "일반과자"], ["process", "양념육"], ["process", "기타 소스류"], ["process", "밥류"],
  ["process", "과·채주스"], ["process", "비스킷/쿠키/크래커"], ["process", "반찬"], ["process", "기타김치"], ["process", "국/탕류"],
  ["process", "기타 빵"], ["process", "죽"], ["process", "도시락"], ["process", "떡"], ["process", "어묵"],
  ["process", "젓갈/액젓"], ["process", "카레"], ["process", "케이크"], ["process", "소시지"], ["process", "햄"],
  ["process", "찌개/전골류"], ["process", "즉석 면요리"],
  ["material", "고등어류"], ["material", "연어류"], ["material", "옥수수"],
];
const keys = ["energy", "protein", "fat", "carbs", "sugars", "sodium"];
const units = { energy: "kcal", protein: "g", fat: "g", carbs: "g", sugars: "g", sodium: "mg" };
const num = (v) => {
  const m = String(v || "").replace(/,/g, "").match(/^(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
};
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
const quantile = (sorted, q) => {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};
const round = (v) => (v === null ? null : Math.round(v * 10) / 10);

const all = JSON.parse(readFileSync("output/groups-data.json", "utf8"));
const snapshot = wanted.map(([dataset, name]) => {
  const g = all.find((x) => x.dataset === dataset && x.name === name);
  if (!g) throw new Error(`missing ${dataset} ${name}`);
  const rows = g.items.map((item) => Object.fromEntries(keys.map((k, i) => [k, num(item.values[i])])));
  const stats = Object.fromEntries(keys.map((k) => {
    const v = rows.map((r) => r[k]).filter((x) => x !== null).sort((a, b) => a - b);
    return [k, { n: v.length, min: round(v[0] ?? null), q1: round(quantile(v, 0.25)), median: round(quantile(v, 0.5)), q3: round(quantile(v, 0.75)), max: round(v.at(-1) ?? null), unit: units[k] }];
  }));
  const perKcal = (k) => {
    const v = rows.filter((r) => r[k] !== null && r.energy > 0).map((r) => (r[k] * 100) / r.energy).sort((a, b) => a - b);
    return v.length ? { n: v.length, median: round(quantile(v, 0.5)), q1: round(quantile(v, 0.25)), q3: round(quantile(v, 0.75)) } : null;
  };
  const makers = new Map();
  for (const item of g.items) {
    const maker = decode(item.meta.split(" · ")[0] || "").trim();
    if (maker && maker !== "해당없음" && maker !== "원재료성 식품") makers.set(maker, (makers.get(maker) || 0) + 1);
  }
  return {
    dataset, name, href: g.href, total: g.count, comparable: g.items.length, basis: g.basis, largeCategory: g.large,
    stats, perKcal: { protein: perKcal("protein"), sugars: perKcal("sugars"), sodium: perKcal("sodium") },
    makers: [...makers].sort((a, b) => b[1] - a[1]).slice(0, 6), makerCount: makers.size,
  };
});
mkdirSync("content/editorial-data", { recursive: true });
writeFileSync("content/editorial-data/food-groups-2026-09-30.json", `${JSON.stringify({ checkedAt: "2026-09-30", source: "https://yungyanggogo.kr (food-group pages, stored 전국통합식품영양성분정보 표준데이터)", groups: snapshot }, null, 1)}\n`);
console.log(`snapshot ${snapshot.length} groups`);
for (const s of snapshot) console.log(s.name, s.total, s.comparable, s.basis, "E", s.stats.energy.q1, s.stats.energy.median, s.stats.energy.q3, "Na", s.stats.sodium.median, `(${s.stats.sodium.n})`, "P/100kcal", s.perKcal.protein?.median, "makers", s.makerCount);
