import assert from "node:assert/strict";
import { COMMON_READING_STEPS, DATASET_GUIDES } from "../lib/dataset-guide.ts";

const slugs = ["all", "food", "process", "material", "health"];
assert.deepEqual(Object.keys(DATASET_GUIDES).sort(), [...slugs].sort());
assert.ok(COMMON_READING_STEPS.length >= 4);

const seen = new Set();
for (const slug of slugs) {
  const guide = DATASET_GUIDES[slug];
  assert.ok(guide.scope.length > 20 && guide.cautions.length >= 2 && guide.nextStep.length > 10, slug);
  for (const text of [guide.scope, ...guide.cautions, guide.nextStep]) {
    assert.ok(!seen.has(text), `중복 문구: ${text}`);
    seen.add(text);
  }
}
// 건강기능식품 안내는 효능을 약속하지 않는다.
const healthText = JSON.stringify(DATASET_GUIDES.health);
for (const banned of ["치료", "예방", "효과가 있", "개선됩니다"]) assert.ok(!healthText.includes(banned), banned);

console.log("dataset guide: 19 assertions passed");
