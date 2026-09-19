"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { buildComparisonHref, buildComparisonItemValue, normalizeComparisonAmount, parseComparisonBasis, parseComparisonSelection, toggleComparisonSelection, withComparisonState } from "../lib/comparison-selection";
import { NATIONAL_NUTRITION_DATASETS, type NationalNutritionDataset, type NationalNutritionItem } from "../lib/national-nutrition-api";

type Props = { datasetInfo: NationalNutritionDataset; foods: NationalNutritionItem[]; query: string; page: number; hasPrevious: boolean; hasNext: boolean; children: ReactNode };

export function NutritionDatasetBrowser({ datasetInfo, foods, query, page, hasPrevious, hasNext, children }: Props) {
  const dataset = datasetInfo.slug;
  const params = useSearchParams();
  const selection = parseComparisonSelection(params.getAll("item"));
  const selectedRefs = selection.selectedRefs;
  const state = { refs: selectedRefs, basis: parseComparisonBasis(params.get("basis") ?? undefined), targetServingUnit: normalizeComparisonAmount(params.get("amount") ?? undefined) };
  const pageQuery = query ? `&q=${encodeURIComponent(query)}` : "";
  const hiddenSelection = <>
    {selectedRefs.map((ref) => <input key={ref.value} type="hidden" name="item" value={ref.value} />)}
    <input type="hidden" name="basis" value={state.basis} />
    <input type="hidden" name="amount" value={state.targetServingUnit} />
  </>;
  function toggle(value: string, checked: boolean) {
    // Read the latest URL so two rapid checkbox events cannot overwrite each other.
    const current = new URL(window.location.href);
    const refs = toggleComparisonSelection(current.searchParams.getAll("item"), value, checked);
    window.history.replaceState(null, "", withComparisonState(`${current.pathname}${current.search}`, { ...state, refs }));
  }
  return <>
      <form className="data-search" action={`/nutrition-data/${dataset}`}>
        {hiddenSelection}
        <label htmlFor="dataset-food-search">
          {datasetInfo.shortName} 식품명 검색
        </label>
        <div>
          <input
            id="dataset-food-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="식품명 일부를 입력하세요"
          />
          <button type="submit">검색</button>
        </div>
      </form>

      {children}
      {selection.tooMany ? <p role="status">최대 3개까지 비교할 수 있습니다. 앞에서 선택한 3개를 유지했습니다.</p> : null}

      {selectedRefs.length > 0 ? <p><Link href={buildComparisonHref(state)}>선택한 {selectedRefs.length}개 비교로 돌아가기</Link></p> : null}
      {foods.length ? (
        <form action="/compare" className="comparison-picker" onSubmit={(event) => {
          event.preventDefault();
          // Native fallback submits visible checkboxes plus off-page hidden
          // inputs; hydrated navigation also preserves their selection order.
          const refs = parseComparisonSelection(new URL(window.location.href).searchParams.getAll("item")).selectedRefs;
          window.location.assign(buildComparisonHref({ ...state, refs }));
        }}>
          {selectedRefs.filter((ref) => !foods.some((food) => ref.value === buildComparisonItemValue(dataset, food.foodCode))).map((ref) => <input key={ref.value} type="hidden" name="item" value={ref.value} />)}
          <input type="hidden" name="basis" value={state.basis} />
          <input type="hidden" name="amount" value={state.targetServingUnit} />
          <div className="comparison-picker__head">
            <div><strong>나란히 비교하기</strong><p>식품 2~3개를 선택하세요. 현재 {selectedRefs.length}개 선택. 선택한 항목을 해제하면 교체할 수 있습니다.</p></div>
            <button type="submit">선택한 식품 비교</button>
          </div>
          <div className="nutrition-dataset-grid">
          {foods.map((food) => (
          <article
            key={food.foodCode || food.name}
            className="health-nutrition-card"
          >
            <div className="health-food-card__head">
              <label className="comparison-check">
                <input
                  type="checkbox"
                  name="item"
                  value={buildComparisonItemValue(dataset, food.foodCode)}
                  checked={selectedRefs.some((ref) => ref.value === buildComparisonItemValue(dataset, food.foodCode))}
                  onChange={(event) => toggle(buildComparisonItemValue(dataset, food.foodCode), event.target.checked)}
                  aria-label={`${food.name || food.foodCode} 비교 선택`}
                  disabled={selectedRefs.length >= 3 && !selectedRefs.some((ref) => ref.value === buildComparisonItemValue(dataset, food.foodCode))}
                />
                <span>비교 선택</span>
              </label>
              <span>{food.typeName || datasetInfo.shortName}</span>
              <strong>
                <Link
                  href={withComparisonState(`/nutrition-data/${dataset}/${encodeURIComponent(food.foodCode)}?page=${page}${pageQuery}`, state)}
                >
                  {food.name || "식품명 미기재"}
                </Link>
              </strong>
              <small>
                {food.maker ||
                  food.restaurant ||
                  food.importer ||
                  food.sourceName ||
                  "제공처 미기재"}
              </small>
            </div>
            <dl>
              <div>
                <dt>기준량</dt>
                <dd>{food.servingUnit || "-"}</dd>
              </div>
              <div>
                <dt>열량</dt>
                <dd>{food.energy || "-"} kcal</dd>
              </div>
              <div>
                <dt>단백질</dt>
                <dd>{food.protein || "-"} g</dd>
              </div>
              <div>
                <dt>당류</dt>
                <dd>{food.sugars || "-"} g</dd>
              </div>
              <div>
                <dt>나트륨</dt>
                <dd>{food.sodium || "-"} mg</dd>
              </div>
              <div>
                <dt>갱신일</dt>
                <dd>{food.updatedAt || "-"}</dd>
              </div>
            </dl>
          </article>
          ))}
          </div>
        </form>
      ) : null}

      <nav
        className="pagination-nav"
        aria-label={`${datasetInfo.shortName} 목록 페이지 이동`}
      >
        {hasPrevious ? (
          <Link
            href={withComparisonState(`/nutrition-data/${dataset}?page=${page - 1}${pageQuery}`, state)}
          >
            이전 50개
          </Link>
        ) : (
          <span>이전 50개</span>
        )}
        <strong>{page.toLocaleString("ko-KR")}페이지</strong>
        {hasNext ? (
          <Link
            href={withComparisonState(`/nutrition-data/${dataset}?page=${page + 1}${pageQuery}`, state)}
          >
            다음 50개
          </Link>
        ) : (
          <span>다음 50개</span>
        )}
      </nav>

      <section className="link-panel">
        <h2>다른 데이터셋 보기</h2>
        <ul>
          {NATIONAL_NUTRITION_DATASETS.filter(
            (item) => item.slug !== dataset,
          ).map((item) => (
            <li key={item.slug}>
              <Link href={withComparisonState(`/nutrition-data/${item.slug}`, state)}>
                {item.shortName} 영양성분표 데이터
              </Link>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </section>
  </>;
}
