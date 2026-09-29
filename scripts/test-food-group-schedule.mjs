// Guards the 30 scheduled food-group posts: they must stay pending/noindex
// until a person approves them, publish one per day, and every number must
// be reproducible from the committed data snapshot.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const file = "content/blog/drafts-2026-10-food-groups-30.json";
const before = readFileSync(file, "utf8");
execFileSync(process.execPath, ["scripts/build-food-group-drafts.mjs"], { stdio: "pipe" });
assert.equal(readFileSync(file, "utf8"), before, "drafts file must equal generator output (run scripts/build-food-group-drafts.mjs)");

const posts = JSON.parse(before);
const snapshot = JSON.parse(readFileSync("content/editorial-data/food-groups-2026-09-30.json", "utf8"));
assert.equal(posts.length, 30);
assert.equal(new Set(posts.map((p) => p.slug)).size, 30, "unique slugs");
assert.equal(new Set(posts.map((p) => p.title)).size, 30, "unique titles");
const days = posts.map((p) => p.publishedAt.slice(0, 10));
assert.equal(new Set(days).size, 30, "one post per day");
for (let i = 1; i < days.length; i += 1) {
  assert.equal((Date.parse(days[i]) - Date.parse(days[i - 1])) / 86400000, 1, `consecutive days at ${days[i]}`);
}

const otherSlugs = new Set();
for (const name of ["approved-editorial-2026-09-13.json", "scheduled-2026-10-10-phase6t.json", "scheduled-2026-09-19-phase6t.json"]) {
  for (const p of JSON.parse(readFileSync(`content/blog/${name}`, "utf8").replace(/^\uFEFF/, ""))) otherSlugs.add(p.slug);
}
for (const post of posts) {
  assert.equal(post.humanReview, "pending", `${post.slug}: must stay pending until human review`);
  assert.equal(post.noindex, true, `${post.slug}: must stay noindex until human review`);
  assert.ok(!otherSlugs.has(post.slug), `${post.slug}: slug collides with an existing post`);
  const text = JSON.stringify(post);
  assert.ok(!/NaN|undefined|\{[a-z]+(?:\.[a-z0-9]+)?\}/.test(text), `${post.slug}: no unfilled values`);
  assert.ok(!/가장 건강한|무조건 추천|살 빠지는|혈당을 낮추/.test(text), `${post.slug}: persona guardrail wording`);
  assert.ok(text.includes("가상 예시"), `${post.slug}: hypothetical calculation is labelled`);
  const groupLink = post.internalLinks[0].href;
  assert.match(groupLink, /^\/nutrition-data\/(food|process|material)\/group\//, `${post.slug}: links its group page`);
  const group = snapshot.groups.find((g) => groupLink.endsWith(`/group/${encodeURIComponent(g.name)}`));
  assert.ok(group, `${post.slug}: group exists in snapshot`);
  const median = group.stats.energy.median.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  assert.ok(text.includes(`${median} kcal`), `${post.slug}: energy median comes from snapshot`);
  assert.ok(post.internalLinks.length >= 3 && post.sourceLinks.length >= 2, `${post.slug}: links and sources`);
}
console.log(`food-group schedule: 30 pending posts ${days[0]}..${days.at(-1)}, reproducible from snapshot`);
