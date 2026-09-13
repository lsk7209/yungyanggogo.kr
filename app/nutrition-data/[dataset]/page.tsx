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
import { buildComparisonItemValue, parseComparisonSelection } from "../../../lib/comparison-selection";

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
    robots: query || queryParams?.item ? { index: false, follow: true } : undefined,
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
  const carriedItems = Array.isArray(queryParams?.item)
    ? queryParams.item
    : queryParams?.item ? [queryParams.item] : [];
  const carriedSelection = parseComparisonSelection(carriedItems);
  const page = parseBoundedPositiveInteger(queryParams?.page, 1, 10_000);
  const canonicalPath = page > 1
    ? `/nutrition-data/${dataset}?page=${page}`
    : `/nutrition-data/${dataset}`;
  const datasetInfo = getNationalNutritionDataset(dataset);
  const hasApiKey = Boolean(getNationalNutritionApiKey());
  const result = hasApiKey || isTursoConfigured
    ? await fetchNationalNutritionItemsWithDbCacheCached({
        dataset,
        query,
        pageNo: page,
        numOfRows: 50,
      })
    : null;
  const hasPrevious = page > 1;
  const hasNext = Boolean(result?.ok && page * 50 < result.totalCount);
  if (result?.ok && page > 1 && (page - 1) * 50 >= result.totalCount) {
    notFound();
  }
  const pageQuery = query ? `&q=${encodeURIComponent(query)}` : "";

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link>
        <span>/</span>
        <Link href="/nutrition-data">통합영양</Link>
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

      <form className="data-search" action={`/nutrition-data/${dataset}`}>
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

      <div
        className={
          result?.foods.length
            ? "api-status api-status--ok"
            : "api-status api-status--warn"
        }
      >
        <strong>
          {result?.foods.length
            ? `현재 ${result.count.toLocaleString("ko-KR")}개 항목 표시`
            : "현재 표시할 데이터를 불러오지 못했습니다"}
        </strong>
        {result?.ok ? (
          <p>
            전체 기준 건수는 {result.totalCount.toLocaleString("ko-KR")}건입니다.
            이 목록은 상세 페이지로 연결되어 각 식품의 영양성분표, 출처, 갱신일을
            개별 URL에서 확인할 수 있습니다.
          </p>
        ) : (
          <p>원천 전체 건수는 응답이 복구된 뒤 표시합니다. 실패를 0건으로 해석하지 않습니다.</p>
        )}
      </div>

      {result?.foods.length ? (
        <form action="/compare" className="comparison-picker">
          {carriedSelection.selectedRefs.map((ref) => (
            <input key={ref.value} type="hidden" name="item" value={ref.value} />
          ))}
          <div className="comparison-picker__head">
            <div><strong>나란히 비교하기</strong><p>식품 2~3개를 선택하세요. 중복 선택은 한 번만 처리됩니다.</p></div>
            <button type="submit">선택한 식품 비교</button>
          </div>
          <div className="nutrition-dataset-grid">
          {result.foods.map((food) => (
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
                  defaultChecked={carriedSelection.selectedRefs.some((ref) => ref.value === buildComparisonItemValue(dataset, food.foodCode))}
                  disabled={carriedSelection.selectedRefs.some((ref) => ref.value === buildComparisonItemValue(dataset, food.foodCode))}
                />
                <span>비교 선택</span>
              </label>
              <span>{food.typeName || datasetInfo.shortName}</span>
              <strong>
                <Link
                  href={`/nutrition-data/${dataset}/${encodeURIComponent(food.foodCode)}`}
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
            href={`/nutrition-data/${dataset}?page=${page - 1}${pageQuery}`}
          >
            이전 50개
          </Link>
        ) : (
          <span>이전 50개</span>
        )}
        <strong>{page.toLocaleString("ko-KR")}페이지</strong>
        {hasNext ? (
          <Link
            href={`/nutrition-data/${dataset}?page=${page + 1}${pageQuery}`}
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
              <Link href={`/nutrition-data/${item.slug}`}>
                {item.shortName} 영양성분표 데이터
              </Link>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function isDatasetSlug(value: string): value is NationalNutritionDatasetSlug {
  return datasetSlugs.has(value as NationalNutritionDatasetSlug);
}
