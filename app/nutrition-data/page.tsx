import type { Metadata } from "next";
import Link from "next/link";
import { fetchNationalNutritionItemsWithDbCacheCached } from "../../lib/national-nutrition-db";
import { isTursoConfigured } from "../../lib/db";
import { normalizeNutritionSearchQuery } from "../../lib/nutrition-query";
import {
  getNationalNutritionApiKey,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
} from "../../lib/national-nutrition-api";
import {
  buildComparisonHref,
  buildComparisonItemValue,
  buildDatasetSearchHref,
  parseComparisonSelection,
  readComparisonState,
  withOptionalComparisonState,
} from "../../lib/comparison-selection";
import { absoluteUrl, siteConfig } from "../../lib/site";
import { serializeJsonLd } from "../../lib/json-ld";
import { NutritionCountSummary } from "../../components/NutritionCountSummary";
import { NutritionFoodCard } from "../../components/NutritionFoodCard";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

const PREVIEW_ROWS = 4;

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    item?: string | string[];
    basis?: string;
    amount?: string;
  }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const hasSearch = Boolean(normalizeNutritionSearchQuery(params?.q)) || Boolean(params?.item);
  return {
    title: "식품 영양성분 검색",
    description: "전국통합식품영양성분정보 표준데이터에서 음식, 가공식품, 원재료성 식품, 건강기능식품의 영양성분을 검색하고 기준량·출처를 확인합니다.",
    alternates: { canonical: absoluteUrl("/nutrition-data") },
    robots: hasSearch ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `식품 영양성분 검색 | ${siteConfig.name}`,
      description: "공공데이터포털 전국통합식품영양성분정보 표준데이터의 열량, 단백질, 당류, 나트륨, 출처 정보를 확인합니다.",
      url: absoluteUrl("/nutrition-data"),
    },
  };
}

export default async function NutritionDataPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = normalizeNutritionSearchQuery(params?.q);
  const { state } = readComparisonState(params);
  const hasApiKey = Boolean(getNationalNutritionApiKey());
  // Each dataset lookup is isolated: one failing dataset never hides the others.
  const results = hasApiKey || isTursoConfigured
    ? await Promise.all(
        NATIONAL_NUTRITION_DATASETS.map((dataset) =>
          fetchNationalNutritionItemsWithDbCacheCached({
            dataset: dataset.slug,
            query,
            numOfRows: PREVIEW_ROWS,
          }),
        ),
      )
    : [];
  const successfulResults = results.filter((result) => result.ok);
  if (results.length > 0 && successfulResults.length === 0) {
    // Nothing usable at all: answer with a server error, not an empty 200.
    throw new Error("nutrition_lookup_unavailable");
  }
  const totalVisible = successfulResults.reduce((sum, result) => sum + result.count, 0);
  const selectedValues = new Set(state.refs.map((ref) => ref.value));

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "전국통합 식품영양성분정보 표준데이터 조회",
    description:
      "공공데이터포털 전국통합식품영양성분정보 표준데이터를 음식, 가공식품, 원재료성 식품, 건강기능식품으로 나눠 표시합니다.",
    url: absoluteUrl("/nutrition-data"),
    // The site publishes this view; the underlying data is the public source.
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
    isBasedOn: NATIONAL_NUTRITION_SOURCE,
    keywords: [
      "전국통합식품영양성분정보",
      "식품영양성분표준데이터",
      "음식 영양성분",
      "가공식품 영양성분",
      "원재료성 식품 영양성분",
      "건강기능식품 영양성분",
    ],
  };

  return (
    <section className="section blog-index">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(datasetSchema) }}
      />

      <div className="section__head">
        <p className="eyebrow">Food Search</p>
        <h1>식품 영양성분 검색</h1>
        <p>
          식품명을 검색해 기준량과 출처를 확인하고, 2~3개를 골라 같은 기준으로
          비교할 수 있습니다. 자료는 음식, 가공식품, 원재료성 식품, 건강기능식품으로
          나눠 보여 줍니다.
        </p>
      </div>

      <form className="data-search" action="/nutrition-data">
        {state.refs.map((ref) => <input key={ref.value} type="hidden" name="item" value={ref.value} />)}
        {state.refs.length > 0 ? <>
          <input type="hidden" name="basis" value={state.basis} />
          <input type="hidden" name="amount" value={state.targetServingUnit} />
        </> : null}
        <label htmlFor="nutrition-data-search">식품명 검색</label>
        <div>
          <input
            id="nutrition-data-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="식품명의 핵심 단어를 입력하세요"
          />
          <button type="submit">검색</button>
        </div>
      </form>

      {state.refs.length > 0 ? (
        <p className="api-status">
          <strong>비교 목록에 {state.refs.length}개 선택됨</strong>{" "}
          <Link href={buildComparisonHref(state)}>선택한 식품 비교로 이동</Link>
        </p>
      ) : null}

      {results.length > 0 ? (
        <div
          className="api-sample"
          aria-label="전국통합 영양성분 검색 결과 미리보기"
        >
          <div className="api-sample__head">
            <strong>
              {query ? `"${query}" 검색 결과 미리보기` : "데이터셋별 자료 미리보기"}
            </strong>
            <span>
              {`${totalVisible.toLocaleString("ko-KR")}개 표시 · 데이터셋별 최대 ${PREVIEW_ROWS}개, 데이터셋 간 같은 식품이 겹칠 수 있음`}
            </span>
          </div>

          <div className="nutrition-dataset-grid">
            {results.map((result) => {
              const slug = result.dataset.slug;
              // Same q and the same (default) scope rules as this preview.
              const moreHref = withOptionalComparisonState(buildDatasetSearchHref(slug, { query }), state);
              return (
                <section key={slug} className="nutrition-dataset">
                  <div className="nutrition-dataset__head">
                    <div>
                      <span>{result.dataset.shortName}</span>
                      <h2>{result.dataset.name}</h2>
                    </div>
                    <NutritionCountSummary result={result} filtered={Boolean(query)} />
                  </div>
                  {result.ok && result.scopeReason === "stored_unavailable" ? (
                    <p className="api-status api-status--warn">저장 자료를 불러오지 못해 공식 원천의 첫 페이지 응답을 표시합니다.</p>
                  ) : null}
                  {!result.ok ? (
                    <div className="api-status api-status--warn" role="status">
                      <strong>{result.dataset.shortName} 자료를 일시적으로 불러오지 못했습니다</strong>
                      <p>다른 데이터셋 결과는 그대로 표시합니다. 이 실패는 검색 결과 0건을 뜻하지 않습니다. 잠시 후 다시 검색해 주세요.</p>
                    </div>
                  ) : result.foods.length > 0 ? (
                    <>
                      <div className="health-nutrition-grid">
                        {result.foods.map((food) => {
                          const value = food.foodCode ? buildComparisonItemValue(slug, food.foodCode) : "";
                          const next = value ? parseComparisonSelection([...state.refs.map((ref) => ref.value), value]) : null;
                          return (
                            <NutritionFoodCard
                              key={`${slug}-${food.foodCode || food.name}`}
                              food={food}
                              dataset={slug}
                              datasetShortName={result.dataset.shortName}
                              href={food.foodCode ? withOptionalComparisonState(`/nutrition-data/${slug}/${encodeURIComponent(food.foodCode)}`, state) : undefined}
                              footer={!value ? null : selectedValues.has(value) ? (
                                <p className="comparison-card-action">비교 목록에 담김</p>
                              ) : next && !next.tooMany ? (
                                <p className="comparison-card-action">
                                  <Link href={withOptionalComparisonState(`/nutrition-data?${new URLSearchParams(query ? { q: query } : {})}`, { ...state, refs: next.selectedRefs })}>
                                    비교 목록에 담기
                                  </Link>
                                </p>
                              ) : (
                                <p className="comparison-card-action">비교는 최대 3개까지 담을 수 있습니다</p>
                              )}
                            />
                          );
                        })}
                      </div>
                      <p className="dataset-more-link">
                        <Link href={moreHref}>
                          {query ? `${result.dataset.shortName}에서 이 검색 결과 더 보기` : `${result.dataset.shortName} 목록 전체 보기`}
                        </Link>
                      </p>
                    </>
                  ) : (
                    <div className="api-status" role="status">
                      {result.searchScope === "stored" ? (
                        <>
                          <strong>{query ? "현재 영양고고 저장 자료에서 일치하는 식품을 찾지 못했습니다" : "아직 저장된 자료가 없습니다"}</strong>
                          <p>제품명이 길다면 핵심 단어로 다시 검색해 주세요. 공식 원천 전체의 미등록을 의미하지는 않습니다.</p>
                          {hasApiKey && query ? (
                            <Link href={withOptionalComparisonState(buildDatasetSearchHref(slug, { query, source: "upstream" }), state)}>
                              공식 원천에서 추가 검색
                            </Link>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <strong>공식 원천 응답에서 일치하는 식품이 없었습니다</strong>
                          <p>이번 조회 범위의 결과입니다. 표기가 다를 수 있으니 핵심 단어로 다시 검색해 주세요.</p>
                        </>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="nutrition-source-grid" aria-label="데이터셋 목록">
        {NATIONAL_NUTRITION_DATASETS.map((dataset) => (
          <article key={dataset.slug}>
            <span>{dataset.shortName}</span>
            <h2>
              <Link href={withOptionalComparisonState(buildDatasetSearchHref(dataset.slug, { query }), state)}>
                {dataset.name}
              </Link>
            </h2>
            <p>{dataset.description}</p>
            <small>개별 항목에서 기준량과 원자료 기준일을 확인할 수 있습니다.</small>
          </article>
        ))}
      </div>

      <details className="data-license-panel">
        <summary>데이터 출처와 이용허락 정보</summary>
        <p>
          원천은 공공데이터포털의 전국통합식품영양성분정보 표준데이터입니다.
          수치의 기준량, 제공기관과 원자료 기준일을 상세 페이지에서 함께 확인하세요.
          이용허락범위에 따라 출처와 저작자표시, 제3자 권리 포함 가능성을 함께 표시합니다.
        </p>
        <dl>
          <div>
            <dt>데이터명</dt>
            <dd>전국통합식품영양성분정보표준데이터 및 세부 표준데이터</dd>
          </div>
          <div>
            <dt>제공 방식</dt>
            <dd>공공데이터포털 오픈 API</dd>
          </div>
          <div>
            <dt>라이센스표시</dt>
            <dd>저작자표시, 제3자 권리 포함 : 저작권 표시</dd>
          </div>
        </dl>
      </details>

      <section className="link-panel">
        <h2>함께 쓰는 기능</h2>
        <ul>
          <li>
            <Link href="/rankings">비교 기준 안내</Link>
            <span>
              100g·100ml·100kcal·1회 제공량 중 어떤 기준으로 볼지 확인합니다.
            </span>
          </li>
          <li>
            <Link href="/health-functional-food-nutrition">
              건강기능식품 영양정보만 보기
            </Link>
            <span>
              건기식 제품명, 제공 단위량, 품목제조신고번호를 별도 페이지에서
              확인합니다.
            </span>
          </li>
        </ul>
      </section>
    </section>
  );
}
