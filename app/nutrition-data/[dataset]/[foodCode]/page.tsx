import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  fetchNationalNutritionItemDetail,
  readRelatedNationalNutritionItemsFromDb,
  RELATED_RELATION_LABELS,
  type NationalNutritionDetailResult,
} from "../../../../lib/national-nutrition-db";
import {
  getNationalNutritionDataset,
  isSyntheticFoodCode,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
  type NationalNutritionDatasetSlug,
} from "../../../../lib/national-nutrition-api";
import { absoluteUrl, siteConfig } from "../../../../lib/site";
import { serializeJsonLd } from "../../../../lib/json-ld";
import { formatNutrientForDisplay } from "../../../../lib/nutrition-comparison";
import { ComparisonNavigationLink } from "../../../../components/ComparisonNavigationLink";
import { NutritionBasisCalculator } from "../../../../components/NutritionBasisCalculator";
import { groupContextFor, groupLinkFor } from "../../../../lib/nutrition-group-data";
import { formatGroupNumber } from "../../../../lib/nutrition-group";
import { isGroupDataset } from "../../../../lib/nutrition-group";
import { AdsenseScript } from "../../../../components/AdsenseScript";
import { buildComparisonHref, buildComparisonItemValue } from "../../../../lib/comparison-selection";

// searchParams 없음 — params(dataset, foodCode)만 사용하므로 ISR 가능
// 식품 영양성분 데이터는 거의 변하지 않으므로 1일 캐싱으로 DB reads 대폭 절감
export const revalidate = 86400;

// An empty list makes every path ISR: rendered on first visit, then cached.
// Without generateStaticParams Next 16 renders these routes on every request.
export function generateStaticParams() {
  return [];
}
export const preferredRegion = "icn1";

type PageProps = {
  params: Promise<{
    dataset: string;
    foodCode: string;
  }>;
};

const datasetSlugs = new Set(
  NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug),
);

// generateMetadata and the page share one lookup per render (no duplicate DB/API call).
const loadDetail = cache((dataset: NationalNutritionDatasetSlug, foodCode: string) =>
  fetchNationalNutritionItemDetail({ dataset, foodCode }),
);

// found → render; confirmed absence → 404; temporary failure → throw so the
// response is a 5xx and a previously generated ISR page is kept, not replaced
// by a false "not found".
function requireFound(detail: NationalNutritionDetailResult) {
  if (detail.kind === "found") return detail;
  if (detail.kind === "temporarily_unavailable") {
    throw new Error(`nutrition_detail_unavailable:${detail.reasonCode}`);
  }
  // not_found (source confirmed) or not_in_stored_scope (only stored data can
  // be asked): this URL has no page here. The not-found page does not claim
  // the food is missing from the official source.
  notFound();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { dataset, foodCode } = await params;
  if (!isDatasetSlug(dataset)) {
    return {};
  }
  const datasetSlug = dataset;

  const detail = await loadDetail(datasetSlug, decodeURIComponent(foodCode));
  if (detail.kind !== "found") {
    return {
      title: "식품영양성분 상세 정보",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
  const { item } = detail;

  const datasetInfo = getNationalNutritionDataset(datasetSlug);
  const title = `${item.name} 영양성분표: 열량·단백질·당류·나트륨`;
  const description = `${item.name}의 기준량 ${item.servingUnit || "확인 필요"}, 열량 ${formatNutrientForDisplay(item.energy, "kcal")}, 단백질 ${formatNutrientForDisplay(item.protein, "g")}, 당류 ${formatNutrientForDisplay(item.sugars, "g")}, 나트륨 ${formatNutrientForDisplay(item.sodium, "mg")} 정보를 ${datasetInfo.shortName} 표준데이터 기준으로 확인합니다.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(
        `/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`,
      ),
    },
    // Name-derived legacy identifiers are not indexable records.
    robots: isSyntheticFoodCode(datasetSlug, item) ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(
        `/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`,
      ),
    },
  };
}

export default async function NationalNutritionDetailPage({
  params,
}: PageProps) {
  const { dataset, foodCode } = await params;
  if (!isDatasetSlug(dataset)) {
    notFound();
  }
  const datasetSlug = dataset;

  const decodedFoodCode = decodeURIComponent(foodCode);
  const datasetInfo = getNationalNutritionDataset(datasetSlug);
  const detail = requireFound(await loadDetail(datasetSlug, decodedFoodCode));
  const { item, cacheSource, provenance } = detail;
  const syntheticCode = isSyntheticFoodCode(datasetSlug, item);

  const [groupLink, groupContext] = isGroupDataset(datasetSlug)
    ? await Promise.all([groupLinkFor(datasetSlug, item.representativeFood), groupContextFor(datasetSlug, item)])
    : [null, null];
  let relatedItems: Awaited<ReturnType<typeof readRelatedNationalNutritionItemsFromDb>> = [];
  try {
    relatedItems = await readRelatedNationalNutritionItemsFromDb({
      dataset: datasetSlug,
      item,
      limit: 6,
    });
  } catch {
    // Related links are optional; their failure must not fail the record page.
  }

  const pageUrl = absoluteUrl(
    `/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`,
  );
  const primaryMetrics = [
    ["기준량", item.servingUnit || "자료 없음"],
    ["열량", formatNutrientForDisplay(item.energy, "kcal")],
    ["단백질", formatNutrientForDisplay(item.protein, "g")],
    ["지방", formatNutrientForDisplay(item.fat, "g")],
    ["탄수화물", formatNutrientForDisplay(item.carbs, "g")],
    ["당류", formatNutrientForDisplay(item.sugars, "g")],
    ["나트륨", formatNutrientForDisplay(item.sodium, "mg")],
    ["식이섬유", formatNutrientForDisplay(item.fiber, "g")],
  ];
  const micronutrients = [
    ["칼슘", formatNutrientForDisplay(item.calcium, "mg")],
    ["철", formatNutrientForDisplay(item.iron, "mg")],
    ["칼륨", formatNutrientForDisplay(item.potassium, "mg")],
    ["비타민 A", formatNutrientForDisplay(item.vitaminA, "ug RAE")],
    ["비타민 C", formatNutrientForDisplay(item.vitaminC, "mg")],
    ["비타민 D", formatNutrientForDisplay(item.vitaminD, "ug")],
    ["포화지방산", formatNutrientForDisplay(item.saturatedFat, "g")],
    ["트랜스지방산", formatNutrientForDisplay(item.transFat, "g")],
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${item.name} 영양성분 상세 정보`,
    description: `${item.name}의 영양성분, 기준량, 출처, 갱신일을 ${datasetInfo.name} 기준으로 표시합니다.`,
    url: pageUrl,
    isBasedOn: NATIONAL_NUTRITION_SOURCE,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
    variableMeasured: primaryMetrics.map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value,
    })),
  };

  return (
    <article className="section nutrition-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link>
        <span>/</span>
        <Link href="/nutrition-data">식품 검색</Link>
        <span>/</span>
        <span>{datasetInfo.shortName}</span>
      </nav>

      <header className="nutrition-detail-header">
        <p className="eyebrow">{datasetInfo.shortName} 영양성분 상세</p>
        <h1>{item.name} 영양성분표</h1>
        <p>
          {item.name}의 기준량, 열량, 단백질, 지방, 탄수화물, 당류, 나트륨을
          공식 표준데이터 기준으로 확인합니다. 수치는 제품 선택을 돕는 참고
          정보이며, 실제 섭취 전에는 제품 라벨과 갱신일을 함께 확인해야 합니다.
        </p>
        <div className="keyword-row">
          <span>{item.typeName || datasetInfo.shortName}</span>
          <span>{item.largeCategory || "대분류 미기재"}</span>
          <span>{item.representativeFood || "대표식품 미기재"}</span>
          <span>
            {cacheSource === "db" ? "영양고고 저장 자료" : "공식 원천 응답 자료"}
          </span>
        </div>
        <ComparisonNavigationLink className="button" addItem={buildComparisonItemValue(datasetSlug, item.foodCode)} href={buildComparisonHref({
          refs: [{ dataset: datasetSlug, foodCode: item.foodCode, value: buildComparisonItemValue(datasetSlug, item.foodCode) }],
          basis: "reported",
          targetServingUnit: "120g",
        })}>
          이 식품을 비교 목록에 담기
        </ComparisonNavigationLink>
      </header>

      <AdsenseScript />

      <section className="nutrition-detail-summary">
        {primaryMetrics.slice(0, 4).map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{item.servingUnit || "기준량 확인 필요"}</em>
          </article>
        ))}
      </section>

      <section className="nutrition-detail-section">
        <h2>{item.name} 주요 영양성분</h2>
        <dl className="nutrition-table">
          {primaryMetrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {groupContext ? (
        <section className="nutrition-detail-section">
          <h2>같은 식품군({groupContext.name} {groupContext.count}종)과 비교</h2>
          <p>
            대표식품이 같은 공공데이터 자료의 {groupContext.basisLabel} 중앙값·범위와 이 식품의 값을 나란히 봅니다. 순위나 좋고 나쁨의 판정이 아닙니다.
          </p>
          <div className="comparison-table-scroll" role="region" aria-label={`${item.name}과 ${groupContext.name} 식품군 비교`} tabIndex={0}>
            <table className="basis-calculator__table">
              <thead>
                <tr>
                  <th scope="col">영양성분</th>
                  <th scope="col">이 식품 {groupContext.basisLabel}</th>
                  <th scope="col">식품군 중앙값</th>
                  <th scope="col">식품군 범위</th>
                  <th scope="col">중앙값 대비</th>
                </tr>
              </thead>
              <tbody>
                {groupContext.rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">{row.label}</th>
                    <td>{formatGroupNumber(row.value, row.unit)}</td>
                    <td>{formatGroupNumber(row.median, row.unit)}</td>
                    <td>{row.min === null ? "계산 불가" : `${formatGroupNumber(row.min, row.unit)} ~ ${formatGroupNumber(row.max, row.unit)}`}</td>
                    <td>{relativeToMedian(row.value, row.median)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p><Link href={groupContext.href}>{groupContext.name} {groupContext.count}종 전체 비교표 보기</Link></p>
        </section>
      ) : null}
      <section className="nutrition-detail-section">
        <h2>{item.name} 먹는 양에 맞춰 계산하기</h2>
        <p>원자료 기준량을 100g(100ml)당, 100kcal당, 직접 입력한 섭취량 기준으로 바꿔 봅니다.</p>
        <NutritionBasisCalculator
          servingUnit={item.servingUnit}
          nutrients={[
            { key: "energy", label: "열량", unit: "kcal", raw: item.energy },
            { key: "carbs", label: "탄수화물", unit: "g", raw: item.carbs },
            { key: "sugars", label: "당류", unit: "g", raw: item.sugars },
            { key: "protein", label: "단백질", unit: "g", raw: item.protein },
            { key: "fat", label: "지방", unit: "g", raw: item.fat },
            { key: "sodium", label: "나트륨", unit: "mg", raw: item.sodium },
          ]}
        />
      </section>

      <section className="nutrition-detail-section">
        <h2>미량영양소와 지방산</h2>
        <dl className="nutrition-table">
          {micronutrients.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="nutrition-detail-section">
        <h2>출처와 제품 식별 정보</h2>
        <dl className="source-detail-list">
          <div>
            <dt>식품코드</dt>
            <dd>{syntheticCode ? "원천 식품코드 없음 (내부 식별자로 저장된 과거 자료)" : item.foodCode}</dd>
          </div>
          <div>
            <dt>데이터셋</dt>
            <dd>{datasetInfo.name}</dd>
          </div>
          <div>
            <dt>분류</dt>
            <dd>
              {[
                item.originName,
                item.largeCategory,
                item.representativeFood,
                item.middleCategory,
              ]
                .filter(Boolean)
                .join(" · ") || "-"}
            </dd>
          </div>
          <div>
            <dt>제조사/제공처</dt>
            <dd>
              {item.maker ||
                item.restaurant ||
                item.importer ||
                item.distributor ||
                "-"}
            </dd>
          </div>
          <div>
            <dt>원산지</dt>
            <dd>{item.originCountry || "-"}</dd>
          </div>
          <div>
            <dt>출처</dt>
            <dd>{item.sourceName || NATIONAL_NUTRITION_SOURCE}</dd>
          </div>
          <div>
            <dt>데이터 생성일</dt>
            <dd>{item.createdAt || "자료 없음"}</dd>
          </div>
          <div>
            <dt>원자료 기준일</dt>
            <dd>{provenance.sourceUpdatedAt || "자료 없음"}</dd>
          </div>
          {provenance.storedAt ? (
            <div>
              <dt>영양고고 저장 시각</dt>
              <dd><time dateTime={provenance.storedAt}>{formatKoreanDateTime(provenance.storedAt)}</time></dd>
            </div>
          ) : null}
          {provenance.checkedAt ? (
            <div>
              <dt>원천 응답 확인 시각</dt>
              <dd><time dateTime={provenance.checkedAt}>{formatKoreanDateTime(provenance.checkedAt)}</time></dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="warning-panel">
        <h2>해석 전 확인할 점</h2>
        <p>
          같은 식품명이라도 브랜드, 조리법, 중량, 리뉴얼 여부에 따라 실제
          영양성분이 달라질 수 있습니다. 이 페이지는 {datasetInfo.name}의 공개
          데이터를 보기 쉽게 정리한 것이며, 치료·예방·추천을 의미하지 않습니다.
        </p>
      </section>

      {relatedItems.length > 0 ? (
        <section className="nutrition-detail-section">
          <h2>같은 분류의 {datasetInfo.shortName} 영양성분표</h2>
          {groupLink ? (
            <p><Link href={groupLink.href}>{item.representativeFood} {groupLink.count}종 영양성분 비교표 보기</Link></p>
          ) : null}
          <p>대표식품·중분류·대분류가 같은 저장 자료입니다. 추천이나 순위가 아닙니다.</p>
          <div className="related-nutrition-grid">
            {relatedItems.map((related) => (
              <ComparisonNavigationLink
                key={related.foodCode}
                href={`/nutrition-data/${datasetSlug}/${encodeURIComponent(related.foodCode)}`}
              >
                <span>{RELATED_RELATION_LABELS[related.relation]}</span>
                <strong>{related.name || "식품명 미기재"}</strong>
                <small>
                  열량 {formatNutrientForDisplay(related.energy, "kcal")} · 단백질{" "}
                  {formatNutrientForDisplay(related.protein, "g")} · 나트륨 {formatNutrientForDisplay(related.sodium, "mg")}
                </small>
              </ComparisonNavigationLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="link-panel">
        <h2>함께 확인할 데이터</h2>
        <ul>
          <li>
            <ComparisonNavigationLink href={`/nutrition-data/${datasetSlug}`}>
              {datasetInfo.shortName} 영양성분표 목록
            </ComparisonNavigationLink>
            <span>같은 데이터셋의 다른 식품을 이어서 확인합니다.</span>
          </li>
          <li>
            <Link href="/nutrition-data">전국통합 식품영양성분정보 조회</Link>
            <span>다른 음식, 가공식품, 원재료성 식품과 비교합니다.</span>
          </li>
          <li>
            <Link href="/rankings">비교 기준 안내</Link>
            <span>
              열량, 단백질, 당류, 나트륨 기준의 비교 흐름을 확인합니다.
            </span>
          </li>
          <li>
            <Link href="/editorial-policy">편집·출처 정책</Link>
            <span>영양고고의 데이터 출처와 표현 제한 원칙을 확인합니다.</span>
          </li>
        </ul>
      </section>
    </article>
  );
}

function isDatasetSlug(value: string): value is NationalNutritionDatasetSlug {
  return datasetSlugs.has(value as NationalNutritionDatasetSlug);
}

function formatKoreanDateTime(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return iso;
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" });
}

function relativeToMedian(value: number | null, median: number | null) {
  if (value === null || median === null || !Number.isFinite(value) || !Number.isFinite(median)) return "계산 불가";
  if (median === 0) return value === 0 ? "같음" : "중앙값이 0";
  const ratio = value / median;
  if (Math.abs(ratio - 1) < 0.05) return "비슷함";
  const percent = Math.round(Math.abs(ratio - 1) * 100);
  return ratio > 1 ? `${percent}% 높음` : `${percent}% 낮음`;
}
