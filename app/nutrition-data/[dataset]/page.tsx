import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNationalNutritionItemsWithDbCacheCached } from "../../../lib/national-nutrition-db";
import { isTursoConfigured } from "../../../lib/db";
import { normalizeNutritionSearchQuery, parseBoundedPositiveInteger } from "../../../lib/nutrition-query";
import {
  getNationalNutritionApiKey,
  getNationalNutritionDataset,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
  type NationalNutritionDatasetSlug,
} from "../../../lib/national-nutrition-api";
import { absoluteUrl, siteConfig } from "../../../lib/site";
import { NutritionDatasetBrowser } from "../../../components/NutritionDatasetBrowser";
import { NutritionCountSummary } from "../../../components/NutritionCountSummary";
import { getNutritionPagination } from "../../../lib/nutrition-count";
import { buildDatasetSearchHref, parseSearchSource } from "../../../lib/comparison-selection";
import { serializeJsonLd } from "../../../lib/json-ld";
import { isGroupDataset } from "../../../lib/nutrition-group";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

type PageProps = {
  params: Promise<{
    dataset: string;
  }>;
  searchParams?: Promise<{
    page?: string;
    q?: string;
    item?: string | string[];
    source?: string;
  }>;
};

const datasetSlugs = new Set(
  NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug),
);

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { dataset } = await params;
  if (!isDatasetSlug(dataset)) {
    return {};
  }

  const datasetInfo = getNationalNutritionDataset(dataset);
  const queryParams = await searchParams;
  const query = normalizeNutritionSearchQuery(queryParams?.q);
  const page = parseBoundedPositiveInteger(queryParams?.page, 1, 10_000);
  const canonicalPath = page > 1
    ? `/nutrition-data/${dataset}?page=${page}`
    : `/nutrition-data/${dataset}`;
  const title = `${datasetInfo.shortName} 영양성분표 데이터 목록${page > 1 ? ` ${page}페이지` : ""}`;
  const description = `${datasetInfo.name}의 열량, 단백질, 당류, 나트륨, 출처, 갱신일을 DB 저장 데이터 기준으로 확인합니다.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    robots: query || queryParams?.item || queryParams?.source ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(canonicalPath),
    },
  };
}

export default async function NutritionDatasetPage({
  params,
  searchParams,
}: PageProps) {
  const { dataset } = await params;
  if (!isDatasetSlug(dataset)) {
    notFound();
  }

  const queryParams = await searchParams;
  const query = normalizeNutritionSearchQuery(queryParams?.q);
  const page = parseBoundedPositiveInteger(queryParams?.page, 1, 10_000);
  const canonicalPath = page > 1
    ? `/nutrition-data/${dataset}?page=${page}`
    : `/nutrition-data/${dataset}`;
  const datasetInfo = getNationalNutritionDataset(dataset);
  const hasApiKey = Boolean(getNationalNutritionApiKey());
  // Explicit, allow-listed scope. Without a source key the stored scope stays.
  const source = hasApiKey ? parseSearchSource(queryParams?.source) : "stored";
  const result = hasApiKey || isTursoConfigured
    ? await fetchNationalNutritionItemsWithDbCacheCached({
        dataset,
        query,
        pageNo: page,
        numOfRows: 50,
        source,
      })
    : null;
  if (result && !result.ok) {
    // A provider/DB failure is not an empty list; answer with a server error.
    throw new Error("nutrition_lookup_unavailable");
  }
  // Once a search is answered from the source scope, keep paging there.
  const effectiveSource = result?.searchScope === "upstream" && result.scopeReason !== "no_db" ? "upstream" : source;
  const hasPrevious = page > 1;
  const { hasNext, outOfRange } = getNutritionPagination(result, page, 50);
  if (outOfRange) {
    notFound();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${datasetInfo.shortName} 영양성분표 데이터 목록`,
    description: datasetInfo.description,
    url: absoluteUrl(canonicalPath),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
    about: NATIONAL_NUTRITION_SOURCE,
  };

  return (
    <section className="section blog-index">
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

      <div className="section__head">
        <p className="eyebrow">Nutrition Dataset</p>
        <h1>{datasetInfo.shortName} 영양성분표 데이터 목록</h1>
        <p>
          {datasetInfo.description} 기준량, 열량, 단백질, 당류, 나트륨, 출처와
          갱신일을 함께 확인합니다.
        </p>
      </div>

      {isGroupDataset(dataset) ? (
        <p><Link href={`/nutrition-data/${dataset}/group`}>{datasetInfo.shortName} 식품군별 영양성분 비교 보기</Link></p>
      ) : null}
      <NutritionDatasetBrowser datasetInfo={datasetInfo} foods={result?.foods ?? []} query={query} source={effectiveSource} page={page} hasPrevious={hasPrevious} hasNext={hasNext}>
      {result?.ok && result.searchScope === "upstream" && result.scopeReason !== "no_db" ? (
        <div className="api-status" role="status">
          <strong>{result.scopeReason === "stored_no_match" ? "영양고고 저장 자료에 일치 항목이 없어 공식 원천 검색 결과를 표시합니다" : source === "upstream" ? "공식 원천 추가 검색 결과" : "공식 원천 응답 표시"}</strong>
          <p>
            영양고고 저장 자료와 별도인 조회 범위입니다. 건수와 페이지는 이 범위 안에서만 이어집니다.{" "}
            {source === "upstream" && result.scopeReason !== "stored_no_match" ? <Link href={buildDatasetSearchHref(dataset, { query })}>저장 자료 검색으로 돌아가기</Link> : null}
          </p>
        </div>
      ) : null}
      <div
        className={
          result?.ok
            ? "api-status api-status--ok"
            : "api-status api-status--warn"
        }
      >
        <strong>
          {result?.ok
            ? result.count > 0
              ? `현재 ${result.count.toLocaleString("ko-KR")}개 항목 표시`
              : query
                ? result.searchScope === "stored"
                  ? "현재 영양고고 저장 자료에서 일치하는 식품을 찾지 못했습니다"
                  : "공식 원천 응답에서 일치하는 식품이 없었습니다"
                : "아직 표시할 저장 자료가 없습니다"
            : "현재 표시할 데이터를 불러오지 못했습니다"}
        </strong>
        {result?.ok ? (
          <p>
            <NutritionCountSummary result={result} filtered={Boolean(query)} />
            <br />
            {result.count > 0
              ? "각 식품을 누르면 영양성분표, 출처, 원자료 기준일을 개별 페이지에서 확인할 수 있습니다."
              : "제품명이 길다면 핵심 단어로 다시 검색해 주세요. 공식 원천 전체의 미등록을 의미하지는 않습니다."}
            {query && hasApiKey && result.searchScope === "stored" ? (
              <>
                {" "}
                <Link href={buildDatasetSearchHref(dataset, { query, source: "upstream" })}>{result.count > 0 ? "저장 자료 외에 공식 원천에서도 검색" : "공식 원천에서 추가 검색"}</Link>
              </>
            ) : null}
          </p>
        ) : (
          <p>원천 전체 건수는 응답이 복구된 뒤 표시합니다. 실패를 0건으로 해석하지 않습니다.</p>
        )}
      </div>

      </NutritionDatasetBrowser>
    </section>
  );
}

function isDatasetSlug(value: string): value is NationalNutritionDatasetSlug {
  return datasetSlugs.has(value as NationalNutritionDatasetSlug);
}
