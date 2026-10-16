// Pure policy checks (no DB, no network): food-group publish decision shared by
// body and gate, provenance wording, and comparison-state navigation.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";

// lib files import each other without extensions (bundler style).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && (context.parentURL || "").startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      for (const extension of [".ts", ".tsx"]) {
        if (existsSync(fileURLToPath(url) + extension)) return nextResolve(url.href + extension, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
const { analyzeGroup, comparableCountsByGroup, groupDuplicateKey, MIN_GROUP_SIZE } = await import("../lib/nutrition-group.ts");
const { describeProvenance, formatSourceDate, formatStoredAt, PROVENANCE_MISSING, PROVENANCE_NOT_STORED } = await import("../lib/nutrition-provenance.ts");
const { parseComparisonSelection, resolveStatefulHref } = await import("../lib/comparison-selection.ts");

const GROUP = "군";
const item = (code, serving, over = {}) => ({
  foodCode: code, name: `식품${code}`, maker: "", restaurant: "", importer: "", servingUnit: serving,
  energy: "100", protein: "10", fat: "5", carbs: "20", sugars: "3", sodium: "50", ...over,
});
// A repeated record: different code, identical visible fields (same groupDuplicateKey).
const twin = (code, serving) => item(code, serving, { name: "같은식품" });
const unique = (prefix, count, serving) => Array.from({ length: count }, (_, i) => item(`${prefix}${i}`, serving, { energy: String(100 + i) }));
const repeated = (prefix, count, serving) => Array.from({ length: count }, (_, i) => twin(`${prefix}${i}`, serving));

// The publish gate (sitemap/list/links) and the page body must agree on the same input.
function gate(items) {
  const bases = items.map((entry) => ({ name: GROUP, servingUnit: entry.servingUnit, duplicateKey: groupDuplicateKey(entry) }));
  return comparableCountsByGroup(bases).get(GROUP) ?? 0;
}
function agree(label, items, expected) {
  const body = analyzeGroup(items).comparable.length;
  assert.equal(body, gate(items), `${label}: body and gate disagree`);
  assert.equal(body, expected, `${label}: expected ${expected} comparable rows, got ${body}`);
  assert.equal(body >= MIN_GROUP_SIZE, expected >= MIN_GROUP_SIZE, `${label}: publish decision`);
}

// 1/2. Repeated records in one dimension must not decide the dimension.
agree("repeated g x6 + unique ml x5", [...repeated("D", 6, "100g"), ...unique("M", 5, "100ml")], 5);
assert.equal(analyzeGroup([...repeated("D", 6, "100g"), ...unique("M", 5, "100ml")]).basis, "per100ml");
agree("repeated ml x6 + unique g x5", [...repeated("D", 6, "100ml"), ...unique("G", 5, "100g")], 5);
assert.equal(analyzeGroup([...repeated("D", 6, "100ml"), ...unique("G", 5, "100g")]).basis, "per100g");

// 3. Plain group.
agree("plain", unique("G", 7, "100g"), 7);
// 4. Tie after de-duplication -> mass, same in body and gate.
agree("tie 5g/5ml", [...unique("G", 5, "100g"), ...unique("M", 5, "100ml")], 5);
assert.equal(analyzeGroup([...unique("G", 5, "100g"), ...unique("M", 5, "100ml")]).basis, "per100g");
// 5. Threshold: just below / at / just above.
agree("below", unique("G", MIN_GROUP_SIZE - 1, "100g"), MIN_GROUP_SIZE - 1);
agree("at", unique("G", MIN_GROUP_SIZE, "100g"), MIN_GROUP_SIZE);
agree("above", unique("G", MIN_GROUP_SIZE + 1, "100g"), MIN_GROUP_SIZE + 1);
// 6. Unknown / unusable basis never counts.
agree("unsupported mixed in", [...unique("G", 4, "100g"), item("X1", "1인분"), item("X2", ""), item("X3", "abc")], 4);
assert.equal(analyzeGroup([...unique("G", 4, "100g"), item("X1", "1인분")]).unsupportedBasis.length, 1);
// 7. Missing nutrients do not change the record count, only per-nutrient n.
const partial = [...unique("G", 5, "100g")].map((entry, i) => (i < 2 ? { ...entry, sugars: "" } : entry));
const partialAnalysis = analyzeGroup(partial);
agree("partial nutrients", partial, 5);
assert.equal(partialAnalysis.stats.find((s) => s.key === "sugars").n, 3);
assert.equal(partialAnalysis.stats.find((s) => s.key === "energy").n, 5);
assert.equal(analyzeGroup(unique("G", 5, "100g").map((e) => ({ ...e, sodium: "" }))).stats.find((s) => s.key === "sodium").n, 0);
// Repeated records are reported, not silently dropped.
assert.equal(analyzeGroup([...repeated("D", 3, "100g"), ...unique("G", 2, "100g")]).duplicates.length, 2);
// A repeated record in the losing dimension is still not listed as a duplicate of the table.
assert.equal(analyzeGroup([...repeated("D", 3, "100ml"), ...unique("G", 4, "100g")]).duplicates.length, 0);

// Provenance: three different notions are never swapped.
assert.equal(formatSourceDate("2024-02-29"), "2024-02-29");
assert.equal(formatSourceDate("2023-02-29"), PROVENANCE_MISSING);
assert.equal(formatSourceDate(""), PROVENANCE_MISSING);
assert.equal(formatSourceDate(null), PROVENANCE_MISSING);
assert.equal(formatSourceDate("2024-02-29T00:00:00Z"), PROVENANCE_MISSING, "no time zone is invented for a date-only value");
assert.equal(formatStoredAt("not a date"), PROVENANCE_MISSING);
assert.match(formatStoredAt("2026-10-01T15:30:00.000Z"), /2026.*10.*2.*오전 12:30|2026.*10.*2.*00:30/);
const stored = describeProvenance({ source: "stored", sourceUpdatedAt: "2021-03-04", storedAt: "2026-10-01T15:30:00.000Z", checkedAt: null });
assert.equal(stored.sourceDate, "2021-03-04");
assert.notEqual(stored.storedAt, stored.sourceDate);
const upstream = describeProvenance({ source: "upstream", sourceUpdatedAt: "2021-03-04", storedAt: null, checkedAt: "2026-10-16T00:00:00.000Z" });
assert.equal(upstream.storedAt, PROVENANCE_NOT_STORED);
assert.equal(describeProvenance({ source: "stored", sourceUpdatedAt: null, storedAt: null, checkedAt: null }).storedAt, PROVENANCE_MISSING);

// Comparison state survives the food-group path.
const params = (query) => new URLSearchParams(query);
const itemsOf = (href) => new URL(href, "https://x.invalid").searchParams;
const AB = "item=food%7CA&item=food%7CB&basis=perIntake&amount=45g";
const add = (query, value) => resolveStatefulHref({ href: "/compare", addItem: value }, params(query));
const c = add(AB, "food|C");
assert.equal(c.kind, "link");
assert.deepEqual(itemsOf(c.href).getAll("item"), ["food|A", "food|B", "food|C"]);
assert.equal(itemsOf(c.href).get("basis"), "perIntake");
assert.equal(itemsOf(c.href).get("amount"), "45g");
const again = add(`${AB}&item=food%7CC`, "food|C");
assert.deepEqual(itemsOf(again.href).getAll("item"), ["food|A", "food|B", "food|C"], "re-adding does not duplicate");
const full = add(`${AB}&item=food%7CC`, "food|D");
assert.equal(full.kind, "full");
assert.deepEqual(itemsOf(full.manageHref).getAll("item"), ["food|A", "food|B", "food|C"], "fourth item keeps the existing three");
// Entering the group from a list page: selection/basis/amount move, search params do not.
const enter = resolveStatefulHref({ href: "/nutrition-data/food/group", carryKeys: [] }, params(`${AB}&q=라면&page=3&source=upstream`));
assert.equal(new URL(enter.href, "https://x.invalid").pathname, "/nutrition-data/food/group");
assert.deepEqual(itemsOf(enter.href).getAll("item"), ["food|A", "food|B"]);
assert.equal(itemsOf(enter.href).get("amount"), "45g");
for (const key of ["q", "page", "source"]) assert.equal(itemsOf(enter.href).has(key), false, `${key} must not leak into the group URL`);
// Group -> detail -> compare keeps the same state, and clean browsing stays clean.
const toDetail = resolveStatefulHref({ href: "/nutrition-data/food/F1", carryKeys: [] }, itemsOf(enter.href));
assert.deepEqual(itemsOf(toDetail.href).getAll("item"), ["food|A", "food|B"]);
assert.equal(resolveStatefulHref({ href: "/nutrition-data/food/group", carryKeys: [] }, params("")).href, "/nutrition-data/food/group");
// Existing dataset-list behaviour still carries q/page/source by default.
assert.equal(itemsOf(resolveStatefulHref({ href: "/nutrition-data/food" }, params(`${AB}&q=라면&page=3`)).href).get("q"), "라면");
assert.equal(parseComparisonSelection(itemsOf(enter.href).getAll("item")).selectedRefs.length, 2);

console.log("group publish consistency, provenance, comparison navigation: ok");
