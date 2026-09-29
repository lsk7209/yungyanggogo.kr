// Read-only (GET): collect publishable food groups and their production stats.
import { writeFileSync } from "node:fs";
const base = "https://yungyanggogo.kr";
const clean = (t) => t.replace(/<!-- -->/g, "");
const out = [];
for (const dataset of ["food", "process", "material"]) {
  const index = clean(await (await fetch(`${base}/nutrition-data/${dataset}/group`)).text());
  const groups = [...index.matchAll(/<li><a href="(\/nutrition-data\/[a-z]+\/group\/[^"]+)">([^<]+)<\/a><span>(\d+)종<\/span><\/li>/g)].map((m) => ({ href: m[1], name: m[2], count: Number(m[3]) }));
  for (const g of groups.slice(0, 40)) {
    const html = clean(await (await fetch(base + g.href)).text());
    const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]);
    const cells = (row) => [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
    const statRows = [...tables[0].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1).map((m) => cells(m[1]));
    const itemRows = [...tables[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1).map((m) => {
      const c = [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((x) => x[1]);
      const name = (c[0].match(/<a[^>]*>([^<]*)<\/a>/) || [])[1] || "";
      const meta = (c[0].match(/<small>([^<]*)<\/small>/) || [])[1] || "";
      return { name, meta, serving: c[1]?.replace(/<[^>]+>/g, ""), values: c.slice(2, 8).map((v) => v.replace(/<[^>]+>/g, "").trim()) };
    });
    const basis = (html.match(/<h2>(100(?:g|ml)당) 요약<\/h2>/) || [])[1];
    const large = (html.match(/<h2>([^<]+) 분류의 다른 식품군<\/h2>/) || [])[1] || "";
    out.push({ dataset, ...g, basis, large, stats: statRows, items: itemRows });
  }
}
writeFileSync("output/groups-data.json", JSON.stringify(out, null, 1));
for (const g of out) {
  const makers = new Map();
  for (const i of g.items) { const k = i.meta.split(" · ")[0] || "-"; makers.set(k, (makers.get(k) || 0) + 1); }
  console.log(`${g.dataset}\t${g.name}\t${g.count}\t${g.basis}\t${g.large}\titems=${g.items.length}\t${[...makers].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => k + ":" + v).join(",")}\t${g.stats.map((r) => r[0] + ":" + r[2] + "(" + r[4] + ")").join(" ")}`);
}
