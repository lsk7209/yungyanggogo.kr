import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const generation = spawnSync(process.execPath, [path.join(root, "scripts", "promote-editorial-candidates.mjs")], { cwd: root, encoding: "utf8" });
assert.equal(generation.status, 0, generation.stderr || generation.stdout);

const output = JSON.parse(readFileSync(path.join(root, "content", "blog", "approved-editorial-2026-09-13.json"), "utf8"));
const approval = JSON.parse(readFileSync(path.join(root, "content", "editorial-candidates", "approval-2026-09-13.json"), "utf8"));
const expectedSlugs = new Set([
  "bakery-snack-serving-basis",
  "phase6t-bagel-basis",
  "phase6t-dried-fruit-basis",
  "phase6t-energy-drink-basis",
  "phase6t-konjac-jelly-basis",
  "phase6t-pickle-basis",
  "phase6t-salad-topping-basis",
]);

assert.equal(output.length, 7, "promotion output contains exactly seven posts");
assert.equal(approval.approval_scope, "local_public_snapshot", "approval is scoped to the local public snapshot");
assert.equal(approval.deployment_authorized, false, "approval does not authorize deployment");
assert.equal(approval.adsense_submission_authorized, false, "approval does not authorize AdSense submission");
assert.deepEqual(new Set(output.map((post) => post.slug)), expectedSlugs, "promotion output contains the reviewed candidate slugs");
for (const post of output) {
  assert.equal(post.humanReview, "approved", `${post.slug} records explicit local approval`);
  assert.equal(post.noindex, false, `${post.slug} is locally indexable`);
  assert.ok(post.sections.length >= 5, `${post.slug} retains a substantial section outline`);
  assert.ok(post.sections.every((section) => section.title && section.body.length > 0), `${post.slug} sections retain rendered prose`);
  assert.ok(post.internalLinks.length >= 3 && post.internalLinks.length <= 5, `${post.slug} retains three to five internal links`);
  assert.ok(post.sourceLinks.length >= 5 && post.sourceLinks.length <= 8, `${post.slug} retains five to eight research sources`);
  assert.ok(post.summaryCards.length === 3 && post.comparisonRows.length === 0, `${post.slug} uses draft tables instead of internal contract rows`);
  assert.ok(post.description.length >= 40 && post.description.length <= 160, `${post.slug} retains a bounded meta description`);
  assert.ok(post.sections.flatMap((section) => section.body).every((paragraph) => !/<\/?[a-z]|\]\(|style=|\{\{/.test(paragraph)), `${post.slug} exposes no raw MDX or HTML syntax`);
}

console.log("editorial promotion boundary: 68 assertions passed");
