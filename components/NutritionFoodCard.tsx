import Link from "next/link";
import type { ReactNode } from "react";
import { isSyntheticFoodCode, type NationalNutritionItem } from "../lib/national-nutrition-api";
import { formatNutrientForDisplay } from "../lib/nutrition-comparison";

type Props = {
  food: NationalNutritionItem;
  dataset: string;
  datasetShortName: string;
  href?: string;
  control?: ReactNode;
  footer?: ReactNode;
};

// Distinguishing facts that actually exist on the record. Same-name records
// stay separate; these labels let a reader tell them apart.
export function describeFoodIdentity(food: NationalNutritionItem) {
  return [
    food.typeName,
    food.maker || food.restaurant || food.importer || food.distributor,
    food.originName,
    food.representativeFood && food.representativeFood !== food.name ? food.representativeFood : "",
  ].filter((value): value is string => Boolean(value && value.trim()));
}

export function NutritionFoodCard({ food, dataset, datasetShortName, href, control, footer }: Props) {
  const identity = describeFoodIdentity(food);
  const name = food.name || "식품명 미기재";
  return (
    <article className="health-nutrition-card">
      <div className="health-food-card__head">
        {control}
        <span>{food.typeName || datasetShortName}</span>
        <strong>{href ? <Link href={href}>{name}</Link> : name}</strong>
        <small>{identity.filter((label) => label !== food.typeName).join(" · ") || "제공처 미기재"}</small>
      </div>
      <dl>
        <div>
          <dt>기준량</dt>
          <dd>{food.servingUnit || "자료 없음"}</dd>
        </div>
        <div>
          <dt>열량</dt>
          <dd>{formatNutrientForDisplay(food.energy, "kcal")}</dd>
        </div>
        <div>
          <dt>단백질</dt>
          <dd>{formatNutrientForDisplay(food.protein, "g")}</dd>
        </div>
        <div>
          <dt>당류</dt>
          <dd>{formatNutrientForDisplay(food.sugars, "g")}</dd>
        </div>
        <div>
          <dt>나트륨</dt>
          <dd>{formatNutrientForDisplay(food.sodium, "mg")}</dd>
        </div>
        <div>
          <dt>원자료 기준일</dt>
          <dd>{food.updatedAt || "자료 없음"}</dd>
        </div>
        <div>
          <dt>식품코드</dt>
          <dd>{food.foodCode && !isSyntheticFoodCode(dataset, food) ? food.foodCode : "원천 코드 없음"}</dd>
        </div>
      </dl>
      {footer}
    </article>
  );
}
