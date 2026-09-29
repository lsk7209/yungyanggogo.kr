import type { NationalNutritionItem } from "./national-nutrition-api";

export type NutrientValueState =
  | "reported"
  | "reported_zero"
  | "missing"
  | "not_detected"
  | "trace_or_below_limit"
  | "invalid";

export type ComparisonBasis = "reported" | "per100g" | "per100ml" | "per100kcal" | "perIntake";

export type ParsedNutrientValue = {
  rawValue: string;
  numericValue: number | null;
  unit: string;
  state: NutrientValueState;
};

export type NormalizedNutrientValue = ParsedNutrientValue & {
  basis: ComparisonBasis;
  displayValue: number | null;
  refusalReason: string;
};

type ServingBasis =
  | { dimension: "mass"; amount: number; canonicalUnit: "g" }
  | { dimension: "volume"; amount: number; canonicalUnit: "ml" }
  | { dimension: "unsupported"; amount: null; canonicalUnit: "" };

export function parseNutrientValue(rawValue: string, unit: string): ParsedNutrientValue {
  const raw = rawValue.trim();
  if (!raw) return { rawValue, numericValue: null, unit, state: "missing" };
  if (/^(미검출|불검출|nd|n\/d)$/i.test(raw)) {
    return { rawValue, numericValue: null, unit, state: "not_detected" };
  }
  if (/^(미량|흔적|trace|정량한계\s*미만|검출한계\s*미만)$/i.test(raw)) {
    return { rawValue, numericValue: null, unit, state: "trace_or_below_limit" };
  }
  if (/^<\s*\d+(?:\.\d+)?(?:\s*[a-zμµ]+)?$/i.test(raw)) {
    return { rawValue, numericValue: null, unit, state: "trace_or_below_limit" };
  }

  const withoutUnit = raw.replace(new RegExp(`\\s*${escapeRegExp(unit)}\\s*$`, "i"), "").trim();
  const normalized = stripThousandsSeparators(withoutUnit);
  if (normalized === null || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return { rawValue, numericValue: null, unit, state: "invalid" };
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue) || numericValue < 0 || Object.is(numericValue, -0)) {
    return { rawValue, numericValue: null, unit, state: "invalid" };
  }

  return {
    rawValue,
    numericValue,
    unit,
    state: numericValue === 0 ? "reported_zero" : "reported"
  };
}

export function parseServingBasis(servingUnit: string): ServingBasis {
  const trimmed = servingUnit.trim().replace(/µ/g, "μ");
  const unitMatch = trimmed.match(/^([\d,.]+)\s*(g|mg|μg|ml)$/i);
  const amountText = unitMatch ? stripThousandsSeparators(unitMatch[1]) : null;
  if (!unitMatch || amountText === null || !/^\d+(?:\.\d+)?$/.test(amountText)) {
    return { dimension: "unsupported", amount: null, canonicalUnit: "" };
  }

  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { dimension: "unsupported", amount: null, canonicalUnit: "" };
  }

  const unit = unitMatch[2].toLowerCase();
  if (unit === "ml") return { dimension: "volume", amount, canonicalUnit: "ml" };
  if (unit === "g") return { dimension: "mass", amount, canonicalUnit: "g" };
  if (unit === "mg") return { dimension: "mass", amount: amount / 1000, canonicalUnit: "g" };
  return { dimension: "mass", amount: amount / 1_000_000, canonicalUnit: "g" };
}

export function normalizeNutrientForComparison({
  rawValue,
  unit,
  servingUnit,
  energy,
  basis,
  targetServingUnit = ""
}: {
  rawValue: string;
  unit: string;
  servingUnit: string;
  energy: string;
  basis: ComparisonBasis;
  targetServingUnit?: string;
}): NormalizedNutrientValue {
  const parsed = parseNutrientValue(rawValue, unit);
  const base = { ...parsed, basis };
  if (parsed.numericValue == null) {
    return { ...base, displayValue: null, refusalReason: valueStateReason(parsed.state) };
  }
  if (basis === "reported") {
    return { ...base, displayValue: parsed.numericValue, refusalReason: "" };
  }
  if (basis === "per100kcal") {
    const parsedEnergy = parseNutrientValue(energy, "kcal");
    if (parsedEnergy.numericValue == null || parsedEnergy.numericValue <= 0) {
      return { ...base, displayValue: null, refusalReason: "열량이 0·결측·이상값이어서 100kcal 환산을 할 수 없습니다." };
    }
    return finiteResult(base, (parsed.numericValue * 100) / parsedEnergy.numericValue);
  }

  const serving = parseServingBasis(servingUnit);
  if (basis === "perIntake") {
    const target = parseServingBasis(targetServingUnit);
    if (serving.dimension === "unsupported" || target.dimension === "unsupported" || serving.dimension !== target.dimension) {
      return { ...base, displayValue: null, refusalReason: "원자료와 같은 질량 또는 부피 단위의 목표 섭취량이 필요합니다." };
    }
    return finiteResult(base, (parsed.numericValue * target.amount) / serving.amount);
  }
  if (basis === "per100g") {
    if (serving.dimension !== "mass") {
      return { ...base, displayValue: null, refusalReason: "질량 기준량이 없어 100g 환산을 할 수 없습니다." };
    }
    return finiteResult(base, (parsed.numericValue * 100) / serving.amount);
  }
  if (serving.dimension !== "volume") {
    return { ...base, displayValue: null, refusalReason: "부피 기준량이 없어 100ml 환산을 할 수 없습니다." };
  }
  return { ...base, displayValue: (parsed.numericValue * 100) / serving.amount, refusalReason: "" };
}

export function comparisonRows(items: NationalNutritionItem[], basis: ComparisonBasis, targetServingUnit = "") {
  const nutrients = [
    { key: "energy", label: "열량", unit: "kcal" },
    { key: "protein", label: "단백질", unit: "g" },
    { key: "fat", label: "지방", unit: "g" },
    { key: "carbs", label: "탄수화물", unit: "g" },
    { key: "sugars", label: "당류", unit: "g" },
    { key: "sodium", label: "나트륨", unit: "mg" }
  ] as const;

  return nutrients.map((nutrient) => ({
    ...nutrient,
    values: items.map((item) =>
      normalizeNutrientForComparison({
        rawValue: item[nutrient.key],
        unit: nutrient.unit,
        servingUnit: item.servingUnit,
        energy: item.energy,
        basis,
        targetServingUnit
      })
    )
  }));
}

export function formatComparisonValue(value: NormalizedNutrientValue) {
  if (value.displayValue == null || !Number.isFinite(value.displayValue)) return "계산 불가";
  const rounded = Math.round((value.displayValue + Number.EPSILON) * 100) / 100;
  return `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${value.unit}`;
}

function valueStateReason(state: NutrientValueState) {
  if (state === "missing") return "원천값이 비어 있어 계산하지 않습니다.";
  if (state === "not_detected") return "미검출은 수치 0으로 바꾸지 않습니다.";
  if (state === "trace_or_below_limit") return "미량·검출한계 미만은 임의 수치로 바꾸지 않습니다.";
  return "원천값 형식이 올바르지 않아 계산하지 않습니다.";
}

// "1,234.5" is a grouped number; "1,2" or "12,34" is ambiguous and rejected.
function stripThousandsSeparators(value: string): string | null {
  if (!value.includes(",")) return value;
  return /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(value) ? value.replace(/,/g, "") : null;
}

function finiteResult(base: ParsedNutrientValue & { basis: ComparisonBasis }, value: number): NormalizedNutrientValue {
  if (!Number.isFinite(value)) {
    return { ...base, displayValue: null, refusalReason: "환산 결과가 유효한 숫자가 아니어서 표시하지 않습니다." };
  }
  return { ...base, displayValue: value, refusalReason: "" };
}

const DISPLAY_STATE_LABELS: Record<Exclude<NutrientValueState, "reported" | "reported_zero">, string> = {
  missing: "자료 없음",
  not_detected: "미검출",
  trace_or_below_limit: "미량",
  invalid: "형식 확인 필요",
};

// Display a stored/source value without inventing numbers: blanks, ND and trace
// keep their meaning instead of "- g" or 0.
export function formatNutrientForDisplay(rawValue: string, unit: string) {
  const parsed = parseNutrientValue(rawValue ?? "", unit);
  if (parsed.numericValue != null) return `${rawValue.trim().replace(new RegExp(`\\s*${escapeRegExp(unit)}\\s*$`, "i"), "")} ${unit}`;
  if (parsed.state === "invalid") return `${rawValue.trim()} (형식 확인 필요)`;
  return DISPLAY_STATE_LABELS[parsed.state as keyof typeof DISPLAY_STATE_LABELS];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
