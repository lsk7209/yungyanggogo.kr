import assert from "node:assert/strict";
import {
  formatComparisonValue,
  normalizeNutrientForComparison,
  parseNutrientValue,
  parseServingBasis
} from "../lib/nutrition-comparison.ts";

const normalize = (rawValue, unit, servingUnit, energy, basis) =>
  normalizeNutrientForComparison({ rawValue, unit, servingUnit, energy, basis });

assert.deepEqual(parseServingBasis("500mg"), { dimension: "mass", amount: 0.5, canonicalUnit: "g" });
assert.deepEqual(parseServingBasis("250 ml"), { dimension: "volume", amount: 250, canonicalUnit: "ml" });
assert.equal(parseServingBasis("1캡슐").dimension, "unsupported");
assert.equal(parseNutrientValue("", "g").state, "missing");
assert.equal(parseNutrientValue("0", "g").state, "reported_zero");
assert.equal(parseNutrientValue("미검출", "g").state, "not_detected");
assert.equal(parseNutrientValue("미량", "g").state, "trace_or_below_limit");
assert.equal(parseNutrientValue("<1", "mg").state, "trace_or_below_limit");
assert.equal(parseNutrientValue("-1", "g").state, "invalid");
assert.equal(parseNutrientValue("-0", "g").state, "invalid");
assert.equal(parseNutrientValue("NaN", "g").state, "invalid");

const intake120 = normalizeNutrientForComparison({
  rawValue: "400",
  unit: "mg",
  servingUnit: "80g",
  energy: "100",
  basis: "perIntake",
  targetServingUnit: "120g"
});
assert.equal(intake120.displayValue, 600);

const intakeDimensionMismatch = normalizeNutrientForComparison({
  rawValue: "20",
  unit: "g",
  servingUnit: "250ml",
  energy: "200",
  basis: "perIntake",
  targetServingUnit: "120g"
});
assert.equal(intakeDimensionMismatch.displayValue, null);

const precision = normalizeNutrientForComparison({
  rawValue: "1",
  unit: "g",
  servingUnit: "3g",
  energy: "1",
  basis: "per100g"
});
assert.ok(Math.abs(precision.displayValue - 100 / 3) < 1e-12);
assert.equal(formatComparisonValue(precision), "33.33 g");
assert.equal(normalize("20", "g", "250ml", "200", "per100ml").displayValue, 8);
assert.equal(normalize("20", "g", "250ml", "200", "per100kcal").displayValue, 10);
assert.equal(normalize("400", "mg", "80g", "100", "per100g").displayValue, 500);
assert.equal(normalize("400", "mg", "80g", "100", "reported").displayValue, 400);
assert.equal(normalize("20", "g", "250ml", "200", "per100g").displayValue, null);
assert.equal(normalize("20", "g", "80g", "200", "per100ml").displayValue, null);
assert.equal(normalize("20", "g", "80g", "0", "per100kcal").displayValue, null);
assert.equal(normalize("20", "g", "80g", "", "per100kcal").displayValue, null);
assert.equal(normalize("미검출", "g", "100g", "200", "per100g").displayValue, null);

console.log("nutrition comparison: 24 assertions passed");
