import assert from "node:assert/strict";
import {
  buildComparisonCollectionHref,
  buildComparisonHref,
  buildComparisonItemValue,
  normalizeComparisonAmount,
  parseComparisonBasis,
  parseComparisonSelection
} from "../lib/comparison-selection.ts";

const selection = parseComparisonSelection([
  "food|A",
  " food | A ",
  "process|B",
  "material|C",
  "health|D",
  "unknown|E",
  "broken",
]);

assert.equal(selection.refs.length, 4);
assert.equal(selection.selectedRefs.length, 3);
assert.equal(selection.duplicateCount, 1);
assert.equal(selection.invalidCount, 2);
assert.equal(selection.tooMany, true);
assert.deepEqual(selection.selectedRefs.map((ref) => ref.value), ["food|A", "process|B", "material|C"]);
assert.equal(parseComparisonBasis("per100g"), "per100g");
assert.equal(parseComparisonBasis("winner"), "reported");
assert.equal(normalizeComparisonAmount(" 300ml\n"), "300ml");
assert.equal(normalizeComparisonAmount(""), "120g");

const href = buildComparisonHref({
  refs: selection.selectedRefs,
  removeValue: "process|B",
  basis: "perIntake",
  targetServingUnit: "120g",
});
assert.equal(href, "/compare?basis=perIntake&amount=120g&item=food%7CA&item=material%7CC");
assert.equal(buildComparisonItemValue("food", " A "), "food|A");
assert.equal(
  buildComparisonCollectionHref("food", selection.selectedRefs),
  "/nutrition-data/food?item=food%7CA&item=process%7CB&item=material%7CC",
);
assert.deepEqual(
  parseComparisonSelection(new URL(href, "https://example.test").searchParams.getAll("item")).refs.map((ref) => ref.value),
  ["food|A", "material|C"],
);

console.log("comparison selection: 14 assertions passed");
