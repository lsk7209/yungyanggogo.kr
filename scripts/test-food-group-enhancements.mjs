import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = spawnSync(process.execPath, ["scripts/build-food-group-drafts.mjs", "--stdout"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.equal(run.status, 0, run.stderr);
const posts = JSON.parse(run.stdout);
const bySlug = new Map(posts.map((p) => [p.slug, p]));
const text = (slug) => JSON.stringify(bySlug.get(slug));

const enhanced = ["sandwich-nutrition-100g-compare", "fried-chicken-nutrition-100g-compare", "salad-nutrition-100g-compare",
  "pizza-nutrition-100g-compare", "ginger-tea-sugar-100ml-compare", "snack-nutrition-100g-compare",
  "sauce-sodium-100g-compare", "rice-cake-nutrition-100g-compare", "corn-nutrition-raw-boiled-dried"];
for (const slug of enhanced) assert.ok(text(slug).includes("같은 열량을 먹는다고 가정") || text(slug).includes("표본 부족"), slug);
// 표본 1개 성분은 중앙값·범위처럼 보이지 않는다.
assert.ok(text("pizza-nutrition-100g-compare").includes("표본 부족"));
assert.ok(!/(\d[\d.,]*)~\1 /.test(text("pizza-nutrition-100g-compare")));
// 업체 한 곳이 30% 이상이면 편중을 밝힌다(피자 7/11).
assert.ok(text("pizza-nutrition-100g-compare").includes("64%"));
// 대상 외 글에는 새 블록을 넣지 않는다.
for (const slug of ["bread-nutrition-100g-compare", "mackerel-nutrition-by-state"]) assert.ok(!text(slug).includes("같은 열량을 먹는다고 가정"), slug);
assert.equal(posts.length, 30);

console.log("food group enhancements: 14 assertions passed");
