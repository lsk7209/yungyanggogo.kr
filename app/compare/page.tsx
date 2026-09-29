import type { Metadata } from "next";
import Link from "next/link";
import { fetchNationalNutritionItemDetail, type NationalNutritionDetailResult } from "../../lib/national-nutrition-db";
import type { NationalNutritionItem } from "../../lib/national-nutrition-api";
import {
  buildComparisonHref,
  buildComparisonCollectionHref,
  readComparisonState,
  splitComparisonAmount,
  withComparisonState,
  type ComparisonItemRef,
} from "../../lib/comparison-selection";
import {
  comparisonRows,
  formatComparisonValue,
  type ComparisonBasis
} from "../../lib/nutrition-comparison";
import { absoluteUrl } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "선택한 식품 영양성분 비교",
  description: "선택한 식품 2~3개의 기준량, 출처와 영양성분을 같은 기준으로 비교합니다.",
  alternates: { canonical: absoluteUrl("/compare") },
  robots: { index: false, follow: true }
};

type PageProps = {
  searchParams?: Promise<{
    item?: string | string[];
    basis?: string;
    amount?: string;
    amountValue?: string;
    amountUnit?: string;
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

type LoadedEntry = { ref: ComparisonItemRef; result: NationalNutritionDetailResult };
type AvailableEntry = { ref: ComparisonItemRef; item: NationalNutritionItem };

async function loadEntry(ref: ComparisonItemRef): Promise<LoadedEntry> {
  try {
    return { ref, result: await fetchNationalNutritionItemDetail({ dataset: ref.dataset, foodCode: ref.foodCode }) };
  } catch {
    // Isolate an unexpected failure to this one selection.
    return { ref, result: { kind: "temporarily_unavailable", reasonCode: "lookup_failed", status: 503, retryable: true } };
  }
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { selection, state, invalidAmountInput } = readComparisonState(params);
  const { selectedRefs, tooMany, invalidCount, duplicateCount } = selection;
  const { basis, targetServingUnit } = state;
  const loaded = await Promise.all(selectedRefs.map(loadEntry));
  const available: AvailableEntry[] = loaded.flatMap((entry) =>
    entry.result.kind === "found" ? [{ ref: entry.ref, item: entry.result.item }] : [],
  );
  const unavailable = loaded.filter((entry) => entry.result.kind === "temporarily_unavailable");
  const missing = loaded.filter((entry) => entry.result.kind === "not_found" || entry.result.kind === "not_in_stored_scope");
  const items = available.map((entry) => entry.item);
  const rows = comparisonRows(items, basis, targetServingUnit);
  const amountParts = splitComparisonAmount(targetServingUnit);
  const reportedBasesDiffer = basis === "reported" && new Set(items.map((item) => item.servingUnit.trim().toLowerCase())).size > 1;
  const removeHref = (value: string) => buildComparisonHref({ refs: selectedRefs, removeValue: value, basis, targetServingUnit });
  const addHref = buildComparisonCollectionHref(available[0]?.ref.dataset ?? selectedRefs[0]?.dataset ?? "all", selectedRefs, { basis, targetServingUnit });

  return (
    <section className="section comparison-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link><span>/</span><Link href="/nutrition-data">식품 검색</Link><span>/</span><span>선택한 식품 비교</span>
      </nav>
      <div className="section__head">
        <p className="eyebrow">Nutrition Comparison</p>
        <h1>선택한 식품 영양성분 비교</h1>
        <p>같은 기준으로 환산할 수 있는 값만 계산합니다. 결측값, 0kcal, 질량·부피 불일치는 순위로 만들지 않습니다.</p>
      </div>

      {selectedRefs.length > 0 && selectedRefs.length < 3 ? (
        <p>
          <Link href={addHref}>현재 선택을 유지하고 항목 추가·교체하기</Link>
        </p>
      ) : null}

      {tooMany ? <div className="api-status api-status--warn"><strong>최대 3개까지 비교할 수 있습니다</strong><p>앞에서 선택한 3개만 표시했습니다.</p></div> : null}
      {invalidCount > 0 ? <div className="api-status api-status--warn"><strong>잘못된 비교 항목을 제외했습니다</strong><p>식별할 수 없는 {invalidCount}개 선택값은 사용하지 않았습니다.</p></div> : null}
      {duplicateCount > 0 ? <div className="api-status"><strong>중복 선택을 한 번만 반영했습니다</strong><p>같은 식품 {duplicateCount}개를 중복 없이 비교합니다.</p></div> : null}
      {invalidAmountInput ? <div className="api-status api-status--warn"><strong>섭취량 입력을 인식하지 못했습니다</strong><p>0보다 큰 숫자와 g 또는 ml 단위를 선택해 주세요. 이전 값 {targetServingUnit}을(를) 유지했습니다.</p></div> : null}
      {unavailable.length > 0 ? (
        <div className="api-status api-status--warn" role="status">
          <strong>일부 식품을 일시적으로 불러오지 못했습니다</strong>
          <p>선택은 그대로 유지했습니다. 잠시 후 다시 시도하거나, 필요 없으면 비교에서 제거하세요.</p>
          <ul>
            {unavailable.map(({ ref }) => (
              <li key={ref.value}>
                {ref.foodCode} · <Link href={buildComparisonHref({ refs: selectedRefs, basis, targetServingUnit })}>다시 시도</Link> · <Link href={removeHref(ref.value)}>비교에서 제거</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {missing.length > 0 ? (
        <div className="api-status api-status--warn" role="status">
          <strong>확인되지 않는 식품이 있습니다</strong>
          <p>현재 자료 범위에서 아래 식품코드를 찾지 못했습니다. 공식 원천 전체의 미등록을 뜻하지는 않습니다.</p>
          <ul>
            {missing.map(({ ref }) => (
              <li key={ref.value}>{ref.foodCode} · <Link href={removeHref(ref.value)}>비교에서 제거</Link></li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length < 2 ? (
        <div className="api-status" role="status">
          <strong>{items.length === 1 ? `${items[0].name} 1개를 선택했습니다. 비교할 식품을 하나 더 고르세요` : "비교할 식품을 2개 이상 선택하세요"}</strong>
          <p>식품 검색이나 데이터 목록에서 2~3개 항목을 선택하면 이 화면에서 나란히 볼 수 있습니다. 현재 선택은 유지됩니다.</p>
          <Link href={addHref}>식품 목록에서 선택하기</Link>{" "}
          <Link href={withComparisonState("/nutrition-data", state)}>식품명으로 검색하기</Link>
        </div>
      ) : (
        <>
          <form className="comparison-basis-form" action="/compare">
            {/* Keep every selection, including temporarily unavailable ones. */}
            {selectedRefs.map((ref) => <input key={ref.value} type="hidden" name="item" value={ref.value} />)}
            <label htmlFor="comparison-basis">비교 기준</label>
            <select id="comparison-basis" name="basis" defaultValue={basis}>
              {comparisonBasis.map((option) => <option key={option} value={option}>{basisLabels[option]}</option>)}
            </select>
            <fieldset className="comparison-amount-fieldset" aria-describedby="comparison-amount-help">
              <legend>목표 섭취량</legend>
              <label htmlFor="comparison-amount-value" className="visually-hidden">섭취량 숫자</label>
              <input id="comparison-amount-value" name="amountValue" defaultValue={amountParts.value} inputMode="decimal" pattern="[0-9]+([.][0-9]+)?" autoComplete="off" />
              <label htmlFor="comparison-amount-unit" className="visually-hidden">섭취량 단위</label>
              <select id="comparison-amount-unit" name="amountUnit" defaultValue={amountParts.unit}>
                <option value="g">g</option>
                <option value="ml">ml</option>
              </select>
            </fieldset>
            <small id="comparison-amount-help">
              목표 섭취량은 &lsquo;직접 입력한 섭취량당&rsquo; 기준에서만 계산에 쓰이며, 선택한 모든 식품에 같은 양을 적용합니다.
              원자료와 같은 질량 또는 부피 단위일 때만 계산합니다.
            </small>
            <button type="submit">기준 적용</button>
          </form>

          {reportedBasesDiffer ? (
            <div className="api-status api-status--warn" role="status">
              <strong>각 열의 기준량이 서로 다릅니다</strong>
              <p>원자료 기준량 그대로의 값이므로 같은 기준의 비교가 아닙니다. 100g·100ml·100kcal 기준으로 바꿔 보세요.</p>
            </div>
          ) : null}
          {basis !== "perIntake" && params?.amountValue ? (
            <p className="api-status" role="status">현재 기준({basisLabels[basis]})에서는 목표 섭취량이 결과에 쓰이지 않습니다.</p>
          ) : null}

          <p className="comparison-scroll-hint">표가 화면보다 넓으면 가로로 이동해 모든 식품을 확인하세요.</p>
          <div className="comparison-table-scroll" role="region" aria-label="식품 비교표 — 가로로 이동해 모든 식품 확인" tabIndex={0}>
          <div className="comparison-table" role="table" aria-label={`${basisLabels[basis]} 영양성분 비교`}>
            <div className="comparison-table__row comparison-table__head" role="row" style={comparisonGridStyle(items.length)}>
              <strong role="columnheader">영양성분</strong>
              {available.map(({ ref, item }) => (
                <div key={ref.value} role="columnheader">
                  <strong>{item.name}</strong>
                  <small>{[item.maker || item.restaurant || item.importer, item.typeName].filter(Boolean).join(" · ") || "제공처 미기재"}</small>
                  <small>{columnBasisLabel(basis, item.servingUnit, targetServingUnit)}</small>
                  <Link href={removeHref(ref.value)}>비교에서 제거</Link>
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
              {available.map(({ ref, item }) => (
                <article key={ref.value}>
                  <strong>{item.name}</strong>
                  <span>식품코드 {item.foodCode}</span>
                  <span>{item.sourceName || "출처명 확인 필요"}</span>
                  <span>원자료 기준일 {item.updatedAt || "자료 없음"}</span>
                  <Link href={withComparisonState(`/nutrition-data/${ref.dataset}/${encodeURIComponent(ref.foodCode)}`, state)}>상세 보기</Link>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function columnBasisLabel(basis: ComparisonBasis, servingUnit: string, targetServingUnit: string) {
  if (basis === "reported") return `원자료 기준량 ${servingUnit || "확인 필요"}`;
  if (basis === "perIntake") return `${targetServingUnit}당 (원자료 ${servingUnit || "기준량 확인 필요"})`;
  return `${basisLabels[basis]} (원자료 ${servingUnit || "기준량 확인 필요"})`;
}

function comparisonGridStyle(itemCount: number) {
  return { gridTemplateColumns: `minmax(130px, .7fr) repeat(${itemCount}, minmax(170px, 1fr))` };
}
