import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchNationalNutritionItemsWithDbCache } from "../../../lib/national-nutrition-db";
import {
  getNationalNutritionApiKey,
  getNationalNutritionDataset,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
  type NationalNutritionDatasetSlug
} from "../../../lib/national-nutrition-api";
import { absoluteUrl, siteConfig } from "../../../lib/site";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

type PageProps = {
  params: Promise<{
    dataset: string;
  }>;
  searchParams?: Promise<{
    page?: string;
    q?: string;
  }>;
};

const datasetSlugs = new Set(NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dataset } = await params;
  if (!isDatasetSlug(dataset)) {
    return {};
  }

  const datasetInfo = getNationalNutritionDataset(dataset);
  const title = `${datasetInfo.shortName} 영양성분표 데이터 목록`;
  const description = `${datasetInfo.name}의 열량, 단백질, 당류, 나트륨, 출처, 갱신일을 DB 저장 데이터 기준으로 확인합니다.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/nutrition-data/${dataset}`)
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(`/nutrition-data/${dataset}`)
    }
  };
}

export default async function NutritionDatasetPage({ params, searchParams }: PageProps) {
  const { dataset } = await params;
  if (!isDatasetSlug(dataset)) {
    notFound();
  }

  const queryParams = await searchParams;
  const query = queryParams?.q?.trim() || "";
  const page = Math.max(1, Number(queryParams?.page || "1") || 1);
  const datasetInfo = getNationalNutritionDataset(dataset);
  const hasApiKey = Boolean(getNationalNutritionApiKey());
  const result = hasApiKey
    ? await fetchNationalNutritionItemsWithDbCache({ dataset, query, pageNo: page, numOfRows: 50 })
    : null;
  const hasPrevious = page > 1;
  const hasNext = Boolean(result && result.count === 50);
  const pageQuery = query ? `&q=${encodeURIComponent(query)}` : "";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${datasetInfo.shortName} 영양성분표 데이터 목록`,
    description: datasetInfo.description,
    url: absoluteUrl(`/nutrition-data/${dataset}`),
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    about: NATIONAL_NUTRITION_SOURCE
  };

  return (
    <section className="section blog-index">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

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
        <p>{datasetInfo.description} 기준량, 열량, 단백질, 당류, 나트륨, 출처와 갱신일을 함께 확인합니다.</p>
      </div>

      <form className="data-search" action={`/nutrition-data/${dataset}`}>
        <label htmlFor="dataset-food-search">{datasetInfo.shortName} 식품명 검색</label>
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

      <div className={result?.cacheSource === "db" ? "api-status api-status--ok" : "api-status api-status--warn"}>
        <strong>
          {result?.cacheSource === "db"
            ? `Turso DB 저장 데이터 ${result.count.toLocaleString("ko-KR")}개 표시`
            : hasApiKey
              ? "API 수집 데이터 표시"
              : "공공데이터포털 API 키 설정 필요"}
        </strong>
        <p>
          전체 기준 건수는 {result?.totalCount.toLocaleString("ko-KR") || "-"}건입니다. 이 목록은 상세 페이지로
          연결되어 각 식품의 영양성분표, 출처, 갱신일을 개별 URL에서 확인할 수 있습니다.
        </p>
      </div>

      <div className="nutrition-dataset-grid">
        {result?.foods.map((food) => (
          <article key={food.foodCode || food.name} className="health-nutrition-card">
            <div className="health-food-card__head">
              <span>{food.typeName || datasetInfo.shortName}</span>
              <strong>
                <Link href={`/nutrition-data/${dataset}/${encodeURIComponent(food.foodCode)}`}>
                  {food.name || "식품명 미기재"}
                </Link>
              </strong>
              <small>{food.maker || food.restaurant || food.importer || food.sourceName || "제공처 미기재"}</small>
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

      <nav className="pagination-nav" aria-label={`${datasetInfo.shortName} 목록 페이지 이동`}>
        {hasPrevious ? (
          <Link href={`/nutrition-data/${dataset}?page=${page - 1}${pageQuery}`}>이전 50개</Link>
        ) : (
          <span>이전 50개</span>
        )}
        <strong>{page.toLocaleString("ko-KR")}페이지</strong>
        {hasNext ? (
          <Link href={`/nutrition-data/${dataset}?page=${page + 1}${pageQuery}`}>다음 50개</Link>
        ) : (
          <span>다음 50개</span>
        )}
      </nav>

      <section className="link-panel">
        <h2>다른 데이터셋 보기</h2>
        <ul>
          {NATIONAL_NUTRITION_DATASETS.filter((item) => item.slug !== dataset).map((item) => (
            <li key={item.slug}>
              <Link href={`/nutrition-data/${item.slug}`}>{item.shortName} 영양성분표 데이터</Link>
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
