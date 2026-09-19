import assert from "node:assert/strict";
import {
  buildComparisonCollectionHref,
  buildComparisonHref,
  buildComparisonItemValue,
  normalizeComparisonAmount,
  parseComparisonBasis,
  parseComparisonSelection,
  withComparisonState,
  toggleComparisonSelection
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

const preserved = new URL(withComparisonState("/nutrition-data/food?page=2&q=치즈&item=health%7Cold", {
  refs: selection.refs,
  basis: "perIntake",
  targetServingUnit: " 150g ",
}), "https://example.test");
assert.deepEqual(preserved.searchParams.getAll("item"), ["food|A", "process|B", "material|C"]);
assert.equal(preserved.searchParams.get("q"), "치즈");
assert.equal(preserved.searchParams.get("page"), "2");
assert.equal(preserved.searchParams.get("basis"), "perIntake");
assert.equal(preserved.searchParams.get("amount"), "150g");
const collection = new URL(buildComparisonCollectionHref("food", selection.selectedRefs, { basis: "perIntake", targetServingUnit: "250ml" }), "https://example.test");
assert.equal(collection.searchParams.get("amount"), "250ml");
assert.equal(collection.searchParams.get("basis"), "perIntake");
const cleared = new URL(withComparisonState(preserved.pathname + preserved.search, { refs: [], basis: "reported", targetServingUnit: "120g" }), "https://example.test");
assert.equal(cleared.searchParams.has("item"), false);
assert.equal(cleared.searchParams.get("page"), "2");
assert.deepEqual(toggleComparisonSelection(["food|A", "food|B", "food|C", "food|D"], "food|A", false).map((ref) => ref.value), ["food|B", "food|C"], "over-limit hidden values never reappear after removal");
assert.deepEqual(toggleComparisonSelection(["food|A", "food|B", "food|C"], "food|D", true).map((ref) => ref.value), ["food|A", "food|B", "food|C"], "fourth item is not silently substituted");
assert.equal(toggleComparisonSelection(["food|A"], "food|A", false).length, 0);
console.log("comparison selection: 26 assertions passed");
