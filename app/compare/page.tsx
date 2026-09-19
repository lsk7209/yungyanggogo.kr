import type { Metadata } from "next";
import Link from "next/link";
import { fetchNationalNutritionItemDetail } from "../../lib/national-nutrition-db";
import {
  type NationalNutritionItem
} from "../../lib/national-nutrition-api";
import {
  buildComparisonHref,
  buildComparisonCollectionHref,
  normalizeComparisonAmount,
  parseComparisonBasis,
  parseComparisonSelection,
  withComparisonState
} from "../../lib/comparison-selection";
import {
  comparisonRows,
  formatComparisonValue,
  type ComparisonBasis
} from "../../lib/nutrition-comparison";
import { absoluteUrl } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "식품 영양성분 2~3개 비교",
  description: "선택한 식품 2~3개의 기준량, 출처와 영양성분을 같은 기준으로 비교합니다.",
  alternates: { canonical: absoluteUrl("/compare") },
  robots: { index: false, follow: true }
};

type PageProps = {
  searchParams?: Promise<{
    item?: string | string[];
    basis?: string;
    amount?: string;
  }>;
};

const comparisonBasis: ComparisonBasis[] = ["reported", "per100g", "per100ml", "per100kcal", "perIntake"];
const basisLabels: Record<ComparisonBasis, string> = {
  reported: "원자료 기준량",
  per100g: "100g당",
  per100ml: "100ml당",
  per100kcal: "100kcal당",
  perIntake: "직접 입력한 섭취량당"
};

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = Array.isArray(params?.item) ? params.item : params?.item ? [params.item] : [];
  const selection = parseComparisonSelection(requested);
  const { selectedRefs, tooMany, invalidCount, duplicateCount } = selection;
  const basis = parseComparisonBasis(params?.basis);
  const targetServingUnit = normalizeComparisonAmount(params?.amount);
  const loaded = await Promise.all(
    selectedRefs.map(async (ref) => ({
      ref,
      result: await fetchNationalNutritionItemDetail({ dataset: ref.dataset, foodCode: ref.foodCode })
    }))
  );
  const available = loaded.filter(
    (entry): entry is typeof entry & { result: { item: NationalNutritionItem; cacheSource: "db" | "api" | "api_no_db" } } =>
      Boolean(entry.result.item)
  );
  const items = available.map((entry) => entry.result.item);
  const rows = comparisonRows(items, basis, targetServingUnit);

  return (
    <section className="section comparison-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link><span>/</span><Link href="/nutrition-data">통합영양</Link><span>/</span><span>식품 비교</span>
      </nav>
      <div className="section__head">
        <p className="eyebrow">Nutrition Comparison</p>
        <h1>식품 영양성분 2~3개 비교</h1>
        <p>같은 기준으로 환산할 수 있는 값만 계산합니다. 결측값, 0kcal, 질량·부피 불일치는 순위로 만들지 않습니다.</p>
      </div>

      {available.length ? (
        <p>
          <Link href={buildComparisonCollectionHref(available[0].ref.dataset, available.map((entry) => entry.ref), { basis, targetServingUnit })}>
            현재 선택을 유지하고 항목 추가·교체하기
          </Link>
        </p>
      ) : null}

      {tooMany ? <div className="api-status api-status--warn"><strong>최대 3개까지 비교할 수 있습니다</strong><p>앞에서 선택한 3개만 표시했습니다.</p></div> : null}
      {invalidCount > 0 ? <div className="api-status api-status--warn"><strong>잘못된 비교 항목을 제외했습니다</strong><p>식별할 수 없는 {invalidCount}개 선택값은 사용하지 않았습니다.</p></div> : null}
      {duplicateCount > 0 ? <div className="api-status"><strong>중복 선택을 한 번만 반영했습니다</strong><p>같은 식품 {duplicateCount}개를 중복 없이 비교합니다.</p></div> : null}
      {loaded.some((entry) => !entry.result.item) ? <div className="api-status api-status--warn"><strong>일부 식품을 불러오지 못했습니다</strong><p>삭제되었거나 현재 데이터 원천에서 확인할 수 없는 항목은 비교에서 제외했습니다.</p></div> : null}

      {items.length < 2 ? (
        <div className="api-status api-status--warn">
          <strong>비교할 식품을 2개 이상 선택하세요</strong>
          <p>영양성분 데이터 목록에서 2~3개 항목을 선택하면 이 화면에서 나란히 볼 수 있습니다.</p>
          <Link href={buildComparisonCollectionHref(available[0]?.ref.dataset ?? "all", available.map((entry) => entry.ref), { basis, targetServingUnit })}>식품 목록에서 선택하기</Link>
        </div>
      ) : (
        <>
          <form className="comparison-basis-form" action="/compare">
            {available.map(({ ref }) => <input key={ref.value} type="hidden" name="item" value={ref.value} />)}
            <label htmlFor="comparison-basis">비교 기준</label>
            <select id="comparison-basis" name="basis" defaultValue={basis}>
              {comparisonBasis.map((option) => <option key={option} value={option}>{basisLabels[option]}</option>)}
            </select>
            <label htmlFor="comparison-amount">목표 섭취량</label>
            <input id="comparison-amount" name="amount" defaultValue={targetServingUnit} inputMode="decimal" aria-describedby="comparison-amount-help" />
            <small id="comparison-amount-help">예: 120g 또는 300ml. 원자료와 같은 차원일 때만 계산합니다.</small>
            <button type="submit">기준 적용</button>
          </form>

          <div className="comparison-table-scroll" role="region" aria-label="식품 비교표 — 가로로 이동해 모든 식품 확인" tabIndex={0}>
          <div className="comparison-table" role="table" aria-label={`${basisLabels[basis]} 영양성분 비교`}>
            <div className="comparison-table__row comparison-table__head" role="row" style={comparisonGridStyle(items.length)}>
              <strong role="columnheader">영양성분</strong>
              {available.map(({ ref, result }) => (
                <div key={ref.value} role="columnheader">
                  <strong>{result.item.name}</strong>
                  <small>{result.item.servingUnit || "기준량 확인 필요"}</small>
                  <Link href={buildComparisonHref({ refs: available.map((entry) => entry.ref), removeValue: ref.value, basis, targetServingUnit })}>비교에서 제거</Link>
                </div>
              ))}
            </div>
            {rows.map((row) => (
              <div className="comparison-table__row" role="row" key={row.key} style={comparisonGridStyle(items.length)}>
                <strong role="rowheader">{row.label}</strong>
                {row.values.map((value, index) => (
                  <div role="cell" key={`${row.key}-${available[index].ref.value}`}>
                    <b>{formatComparisonValue(value)}</b>
                    {value.refusalReason ? <small>{value.refusalReason}</small> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          </div>

          <section className="nutrition-detail-section">
            <h2>비교 항목의 출처와 식별 정보</h2>
            <div className="comparison-source-grid">
              {available.map(({ ref, result }) => (
                <article key={ref.value}>
                  <strong>{result.item.name}</strong>
                  <span>식품코드 {result.item.foodCode}</span>
                  <span>{result.item.sourceName || "출처명 확인 필요"}</span>
                  <span>갱신일 {result.item.updatedAt || "확인 필요"}</span>
                  <Link href={withComparisonState(`/nutrition-data/${ref.dataset}/${encodeURIComponent(ref.foodCode)}`, { refs: available.map((entry) => entry.ref), basis, targetServingUnit })}>상세 보기</Link>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function comparisonGridStyle(itemCount: number) {
  return { gridTemplateColumns: `minmax(130px, .7fr) repeat(${itemCount}, minmax(170px, 1fr))` };
}
