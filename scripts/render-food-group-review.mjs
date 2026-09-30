// Renders the 30 scheduled food-group posts into one local HTML file so a
// reviewer can read them as text (pending posts are 404 on the site).
//
//   npm run blog:review            -> output/review/food-group-posts.html
//   npm run blog:review -- --live  -> also compares each post's medians with
//                                     the live group page (read-only GETs)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const posts = JSON.parse(readFileSync("content/blog/drafts-2026-10-food-groups-30.json", "utf8"));
const snapshot = JSON.parse(readFileSync("content/editorial-data/food-groups-2026-09-30.json", "utf8"));
const live = process.argv.includes("--live");
const site = "https://yungyanggogo.kr";

const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Render [label](href) links from post text as anchors; everything else escaped.
const inline = (text) => esc(text).replace(/\[([^\]]+)]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href.startsWith("/") ? site + href : href}">${label}</a>`);

function block(b) {
  if (b.type === "paragraph") return `<p>${inline(b.text)}</p>`;
  if (b.type === "list") {
    const tag = b.ordered ? "ol" : "ul";
    return `<${tag}>${b.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`;
  }
  if (b.type === "table") {
    return `<table><thead><tr>${b.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((row) => `<tr>${row.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  return `<pre>${esc(JSON.stringify(b))}</pre>`;
}

// Live cross-check: the summary table on the group page lists 최저/중앙값/최고.
async function liveMedians(href) {
  const html = (await (await fetch(site + href)).text()).replace(/<!-- -->/g, "");
  const table = html.match(/<table[\s\S]*?<\/table>/)?.[0] ?? "";
  const out = {};
  for (const row of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
    if (cells.length >= 3) out[cells[0]] = cells[2];
  }
  return out;
}

const labels = { energy: "열량", protein: "단백질", fat: "지방", carbs: "탄수화물", sugars: "당류", sodium: "나트륨" };
const fmt = (v, unit) => `${Number(v).toLocaleString("ko-KR", { maximumFractionDigits: 1 })} ${unit}`;
const sections = [];
let mismatches = 0;
for (const post of posts) {
  const href = post.internalLinks[0].href;
  const group = snapshot.groups.find((g) => g.href === href);
  let check = "";
  if (live && group) {
    const actual = await liveMedians(href);
    const rows = Object.entries(group.stats).filter(([, s]) => s.n).map(([key, s]) => {
      const expected = fmt(s.median, s.unit);
      const ok = actual[labels[key]] === expected;
      if (!ok) mismatches += 1;
      return `<tr class="${ok ? "ok" : "bad"}"><td>${labels[key]}</td><td>${esc(expected)}</td><td>${esc(actual[labels[key]] ?? "없음")}</td><td>${ok ? "일치" : "불일치"}</td></tr>`;
    });
    check = `<table class="check"><thead><tr><th>성분</th><th>글의 중앙값</th><th>현재 운영 페이지</th><th>결과</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  }
  sections.push(`<article id="${esc(post.slug)}">
  <p class="meta">${esc(post.publishedAt)} · <code>${esc(post.slug)}</code> · 상태: <strong>${esc(post.humanReview)}</strong></p>
  <h2>${esc(post.title)}</h2>
  <p class="sub">${esc(post.subtitle)}</p>
  <p class="desc"><b>검색 설명:</b> ${esc(post.description)}</p>
  <ul class="cards">${post.summaryCards.map((c) => `<li><b>${esc(c.label)}</b> ${esc(c.value)}<br><small>${esc(c.description)}</small></li>`).join("")}</ul>
  ${post.sections.map((s) => `<h3>${esc(s.title)}</h3>${s.blocks.map(block).join("\n")}`).join("\n")}
  <h3>내부 링크</h3><ul>${post.internalLinks.map((l) => `<li><a href="${site}${l.href}">${esc(l.label)}</a> — ${esc(l.description)}</li>`).join("")}</ul>
  <h3>출처</h3><ul>${post.sourceLinks.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a> — ${esc(l.description)}</li>`).join("")}</ul>
  <div class="review">
    <h3>검토 체크</h3>
    <ol>
      <li>비교표 링크를 열어 표의 중앙값·범위가 운영 페이지와 같은지 확인${live ? " (아래 자동 대조 참고)" : ""}</li>
      <li>‘데이터에서 보이는 점’의 설명이 비교표의 실제 자료 이름·값과 맞는지 확인</li>
      <li>효능·추천·순위로 읽힐 표현이 없는지 확인</li>
      <li>승인: <code>npm run blog:approve -- ${esc(post.slug)} --reviewer "이름"</code></li>
    </ol>
    ${check}
  </div>
</article>`);
}

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>식품군 예약 글 검토 (${posts.length}개)</title>
<style>
body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1f2933}
article{border-top:3px solid #cbd2d9;padding-top:1.5rem;margin-top:3rem}
table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.9rem}th,td{border:1px solid #cbd2d9;padding:.35rem .5rem;text-align:left}
.meta,.sub{color:#52606d}.cards{display:flex;gap:.75rem;list-style:none;padding:0}.cards li{flex:1;border:1px solid #cbd2d9;padding:.5rem}
.review{background:#f5f7fa;padding:.5rem 1rem;border-left:4px solid #3e7c5a}.ok td:last-child{color:#1f7a3f}.bad td{background:#fde8e8}
nav ol{columns:2}
</style></head><body>
<h1>식품군 예약 글 검토</h1>
<p>${posts.length}개, 모두 humanReview 값이 approved가 되기 전까지 사이트에 공개되지 않습니다. 데이터 스냅샷: ${esc(snapshot.checkedAt)}.${live ? ` 운영 페이지 자동 대조 불일치: <strong>${mismatches}건</strong>.` : ""}</p>
<nav><ol>${posts.map((p) => `<li><a href="#${esc(p.slug)}">${esc(p.publishedAt.slice(5, 10))} ${esc(p.title)}</a> (${esc(p.humanReview)})</li>`).join("")}</ol></nav>
${sections.join("\n")}
</body></html>
`;
mkdirSync("output/review", { recursive: true });
writeFileSync("output/review/food-group-posts.html", html);
console.log(`review packet: output/review/food-group-posts.html (${posts.length} posts${live ? `, ${mismatches} live mismatches` : ""})`);
if (live && mismatches) process.exitCode = 1;
