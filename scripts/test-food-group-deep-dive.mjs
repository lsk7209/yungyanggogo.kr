import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run = spawnSync(process.execPath, ["scripts/build-food-group-drafts.mjs", "--stdout"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.equal(run.status, 0, run.stderr);
const posts = JSON.parse(run.stdout);
const spreadOf = (p) => p.sections.find((s) => s.id === "spread");

const deep = posts.filter(spreadOf).map((p) => p.slug).sort();
assert.deepEqual(deep, [
  "corn-nutrition-raw-boiled-dried", "curry-roux-nutrition-basis", "fried-chicken-nutrition-100g-compare",
  "mackerel-nutrition-by-state", "salad-nutrition-100g-compare", "salmon-nutrition-by-state",
  "sandwich-nutrition-100g-compare", "sauce-sodium-100g-compare", "snack-nutrition-100g-compare",
]);

// 먹는 양 표는 중앙값이 한 무리를 대표하는 5편에만 있다(상태·형태가 섞인 4편은 제외).
const withTable = deep.filter((slug) => spreadOf(posts.find((p) => p.slug === slug)).blocks.some((b) => b.type === "table"));
assert.equal(withTable.length, 5);
for (const slug of ["corn-nutrition-raw-boiled-dried", "curry-roux-nutrition-basis", "mackerel-nutrition-by-state", "salmon-nutrition-by-state"]) {
  assert.ok(!withTable.includes(slug), slug);
}

for (const slug of deep) {
  const text = JSON.stringify(spreadOf(posts.find((p) => p.slug === slug)));
  assert.ok(!/NaN|undefined|null|Infinity/.test(text), `${slug} has an invalid number`);
}
assert.ok(JSON.stringify(spreadOf(posts.find((p) => p.slug === "sandwich-nutrition-100g-compare"))).includes("샌드위치를 먹는 양별"));
assert.ok(JSON.stringify(spreadOf(posts.find((p) => p.slug === "snack-nutrition-100g-compare"))).includes("일반과자를 먹는 양별"));
// 가정한 먹는 양은 실제 값이 아님을 밝힌다.
assert.ok(JSON.stringify(spreadOf(posts.find((p) => p.slug === "sauce-sodium-100g-compare"))).includes("가정이며"));
// 비공개 포함 나머지 글에는 새 절이 없다.
assert.equal(posts.filter(spreadOf).length, 9);

console.log("food group deep dive: 9 posts, 5 tables, no invalid numbers");
