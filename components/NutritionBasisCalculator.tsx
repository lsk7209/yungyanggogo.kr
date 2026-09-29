"use client";

import { useId, useMemo, useState } from "react";
import {
  formatComparisonValue,
  normalizeNutrientForComparison,
  parseServingBasis,
  type ComparisonBasis,
} from "../lib/nutrition-comparison";

import type { CalculatorNutrient } from "../lib/label-nutrients";

type Props = {
  // Fixed source values (detail page) or editable label values (tool page).
  nutrients: CalculatorNutrient[];
  servingUnit: string;
  editable?: boolean;
  defaultIntake?: string;
};

function splitServing(servingUnit: string) {
  const match = servingUnit.trim().match(/^([\d.,]+)\s*(g|ml)$/i);
  return match ? { amount: match[1], unit: match[2].toLowerCase() } : { amount: "", unit: "g" };
}

export function NutritionBasisCalculator({ nutrients, servingUnit, editable = false, defaultIntake = "" }: Props) {
  const id = useId();
  const initialServing = splitServing(servingUnit);
  const [servingAmount, setServingAmount] = useState(initialServing.amount);
  const [servingDimension, setServingDimension] = useState(initialServing.unit);
  const [values, setValues] = useState(nutrients);
  const intakeDefault = splitServing(defaultIntake);
  const [intakeAmount, setIntakeAmount] = useState(intakeDefault.amount);
  const [intakeUnit, setIntakeUnit] = useState(intakeDefault.amount ? intakeDefault.unit : initialServing.unit);

  const effectiveServing = editable ? `${servingAmount}${servingDimension}` : servingUnit;
  const energyRaw = values.find((item) => item.key === "energy")?.raw ?? "";
  const serving = parseServingBasis(effectiveServing);
  const densityBasis: ComparisonBasis = serving.dimension === "volume" ? "per100ml" : "per100g";
  const densityLabel = serving.dimension === "volume" ? "100ml당" : "100g당";
  const intake = intakeAmount ? `${intakeAmount}${intakeUnit}` : "";

  const rows = useMemo(() => values.map((item) => {
    const compute = (basis: ComparisonBasis) => normalizeNutrientForComparison({
      rawValue: item.raw,
      unit: item.unit,
      servingUnit: effectiveServing,
      energy: energyRaw,
      basis,
      targetServingUnit: intake,
    });
    return {
      ...item,
      reported: compute("reported"),
      density: compute(densityBasis),
      perKcal: item.key === "energy" ? null : compute("per100kcal"),
      perIntake: intake ? compute("perIntake") : null,
    };
  }), [values, effectiveServing, energyRaw, densityBasis, intake]);

  const servingValid = serving.dimension !== "unsupported";

  return (
    <div className="basis-calculator">
      <div className="basis-calculator__inputs">
        {editable ? (
          <fieldset className="comparison-amount-fieldset">
            <legend>영양성분표 기준량</legend>
            <label htmlFor={`${id}-serving`} className="visually-hidden">기준량 숫자</label>
            <input id={`${id}-serving`} inputMode="decimal" value={servingAmount} onChange={(event) => setServingAmount(event.target.value)} placeholder="예: 45" />
            <label htmlFor={`${id}-serving-unit`} className="visually-hidden">기준량 단위</label>
            <select id={`${id}-serving-unit`} value={servingDimension} onChange={(event) => setServingDimension(event.target.value)}>
              <option value="g">g</option>
              <option value="ml">ml</option>
            </select>
          </fieldset>
        ) : (
          <p className="basis-calculator__basis">원자료 기준량: <strong>{servingUnit || "자료 없음"}</strong></p>
        )}
        <fieldset className="comparison-amount-fieldset">
          <legend>내가 먹는 양</legend>
          <label htmlFor={`${id}-intake`} className="visually-hidden">섭취량 숫자</label>
          <input id={`${id}-intake`} inputMode="decimal" value={intakeAmount} onChange={(event) => setIntakeAmount(event.target.value)} placeholder="예: 150" />
          <label htmlFor={`${id}-intake-unit`} className="visually-hidden">섭취량 단위</label>
          <select id={`${id}-intake-unit`} value={intakeUnit} onChange={(event) => setIntakeUnit(event.target.value)}>
            <option value="g">g</option>
            <option value="ml">ml</option>
          </select>
        </fieldset>
      </div>

      {editable ? (
        <div className="basis-calculator__values">
          {values.map((item, index) => (
            <label key={item.key}>
              <span>{item.label} ({item.unit})</span>
              <input
                inputMode="decimal"
                value={item.raw}
                placeholder="비워 두면 자료 없음"
                onChange={(event) => setValues((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, raw: event.target.value } : row))}
              />
            </label>
          ))}
        </div>
      ) : null}

      {!servingValid ? (
        <p className="api-status api-status--warn" role="status">
          기준량이 g 또는 ml 숫자가 아니어서 {editable ? "환산할 수 없습니다. 예: 45g, 200ml" : "이 자료는 기준량 환산을 할 수 없습니다."}
        </p>
      ) : null}

      <div className="comparison-table-scroll" role="region" aria-label="기준별 환산 결과" tabIndex={0}>
        <table className="basis-calculator__table">
          <caption className="visually-hidden">영양성분 기준별 환산 결과</caption>
          <thead>
            <tr>
              <th scope="col">영양성분</th>
              <th scope="col">원자료 기준량</th>
              <th scope="col">{densityLabel}</th>
              <th scope="col">100kcal당</th>
              <th scope="col">{intake ? `${intake}당` : "내가 먹는 양"}</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <Cell value={row.reported} raw={row.raw} />
                <Cell value={row.density} raw={row.raw} />
                {row.perKcal ? <Cell value={row.perKcal} raw={row.raw} /> : <td>—</td>}
                {row.perIntake ? <Cell value={row.perIntake} raw={row.raw} /> : <td>섭취량 입력</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="basis-calculator__note">
        빈칸은 0으로 계산하지 않고 &lsquo;자료 없음&rsquo;으로 둡니다. g과 ml은 밀도 정보 없이 서로 바꾸지 않으며, 열량이 0이거나 없으면 100kcal 환산을 하지 않습니다.
      </p>
    </div>
  );
}

function Cell({ value, raw }: { value: ReturnType<typeof normalizeNutrientForComparison>; raw: string }) {
  if (!raw.trim()) return <td>자료 없음</td>;
  return (
    <td>
      {formatComparisonValue(value)}
      {value.refusalReason ? <small>{value.refusalReason}</small> : null}
    </td>
  );
}