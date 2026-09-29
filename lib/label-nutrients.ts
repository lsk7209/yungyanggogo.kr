export type CalculatorNutrient = { key: string; label: string; unit: string; raw: string };

const DEFAULT_LABEL_NUTRIENTS: CalculatorNutrient[] = [
  { key: "energy", label: "열량", unit: "kcal", raw: "" },
  { key: "carbs", label: "탄수화물", unit: "g", raw: "" },
  { key: "sugars", label: "당류", unit: "g", raw: "" },
  { key: "protein", label: "단백질", unit: "g", raw: "" },
  { key: "fat", label: "지방", unit: "g", raw: "" },
  { key: "saturatedFat", label: "포화지방", unit: "g", raw: "" },
  { key: "sodium", label: "나트륨", unit: "mg", raw: "" },
];

export function defaultLabelNutrients(): CalculatorNutrient[] {
  return DEFAULT_LABEL_NUTRIENTS.map((item) => ({ ...item }));
}
