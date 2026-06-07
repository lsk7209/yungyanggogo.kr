import type { Metadata } from "next";
import Link from "next/link";
import { fetchNationalNutritionItemsWithDbCache } from "../../lib/national-nutrition-db";
import {
  getNationalNutritionApiKey,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE
} from "../../lib/national-nutrition-api";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

export const metadata: Metadata = {
  title: "전국통합 식품영양성분정보 표준데이터 조회",
  description:
    "전국통합식품영양성분정보, 음식, 가공식품, 원재료성 식품, 건강기능식품 영양성분 표준데이터를 한 화면에서 확인합니다.",
  alternates: {
    canonical: absoluteUrl("/nutrition-data")
  },
  openGraph: {
    title: `전국통합 식품영양성분정보 표준데이터 조회 | ${siteConfig.name}`,
    description:
      "공공데이터포털 전국통합식품영양성분정보 표준데이터의 열량, 단백질, 당류, 나트륨, 미량영양소, 출처 정보를 확인합니다.",
    url: absoluteUrl("/nutrition-data")
  }
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function NutritionDataPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const hasApiKey = Boolean(getNationalNutritionApiKey());
  const results = hasApiKey
    ? await Promise.all(
        NATIONAL_NUTRITION_DATASETS.map((dataset) =>
          fetchNationalNutritionItemsWithDbCache({ dataset: dataset.slug, query, numOfRows: 4 })
        )
      )
    : [];
  const totalVisible = results.reduce((sum, result) => sum + result.count, 0);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "전국통합 식품영양성분정보 표준데이터 조회",
    description:
      "공공데이터포털 전국통합식품영양성분정보 표준데이터를 음식, 가공식품, 원재료성 식품, 건강기능식품으로 나눠 표시합니다.",
    url: absoluteUrl("/nutrition-data"),
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    isBasedOn: NATIONAL_NUTRITION_SOURCE,
    keywords: [
      "전국통합식품영양성분정보",
      "식품영양성분표준데이터",
      "음식 영양성분",
      "가공식품 영양성분",
      "원재료성 식품 영양성분",
      "건강기능식품 영양성분"
    ]
  };

  return (
    <section className="section blog-index">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />

      <div className="section__head">
        <p className="eyebrow">National Nutrition Data</p>
        <h1>전국통합 식품영양성분정보 표준데이터 조회</h1>
        <p>
          음식, 가공식품, 원재료성 식품, 건강기능식품 데이터를 한 화면에서 비교합니다. 열량, 단백질, 당류,
          나트륨, 비타민, 출처, 제조사 정보를 함께 표시해 글 작성과 랭킹 근거로 바로 확인할 수 있게 했습니다.
        </p>
      </div>

      <form className="data-search" action="/nutrition-data">
        <label htmlFor="nutrition-data-search">식품명 검색</label>
        <div>
          <input
            id="nutrition-data-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="예: 닭튀김, 발효유, 피스타치오, 비타민D"
          />
          <button type="submit">검색</button>
        </div>
      </form>

      <div className={hasApiKey ? "api-status api-status--ok" : "api-status api-status--warn"}>
        <strong>{hasApiKey ? "전국통합 영양성분 API 연결 준비됨" : "공공데이터포털 API 키 설정 필요"}</strong>
        <p>
          승인된 활용신청의 일일 트래픽은 데이터셋별 1,000건입니다. 인증키는 서버 환경변수에서만 읽고,
          화면에는 노출하지 않습니다.
        </p>
      </div>

      <section className="data-license-panel" aria-label="전국통합 영양성분 API 활용 정보">
        <div>
          <p className="eyebrow">Data License</p>
          <h2>활용신청 기본정보와 표시 범위</h2>
          <p>
            활용목적은 웹 사이트 개발이며, 이용허락범위에 따라 출처와 저작자표시, 제3자 권리 포함 가능성을
            함께 표시합니다.
          </p>
        </div>
        <dl>
          <div>
            <dt>데이터명</dt>
            <dd>전국통합식품영양성분정보표준데이터 및 세부 표준데이터</dd>
          </div>
          <div>
            <dt>서비스유형</dt>
            <dd>REST</dd>
          </div>
          <div>
            <dt>신청유형</dt>
            <dd>개발계정 | 활용신청</dd>
          </div>
          <div>
            <dt>활용기간</dt>
            <dd>2026-06-07 ~ 2028-06-07</dd>
          </div>
          <div>
            <dt>데이터포맷</dt>
            <dd>JSON+XML</dd>
          </div>
          <div>
            <dt>활용목적</dt>
            <dd>웹 사이트 개발</dd>
          </div>
          <div>
            <dt>라이센스표시</dt>
            <dd>저작자표시, 제3자 권리 포함 : 저작권 표시</dd>
          </div>
        </dl>
      </section>

      <div className="nutrition-source-grid" aria-label="연동 데이터셋 목록">
        {NATIONAL_NUTRITION_DATASETS.map((dataset) => (
          <article key={dataset.slug}>
            <span>{dataset.shortName}</span>
            <h2>
              <Link href={`/nutrition-data/${dataset.slug}`}>{dataset.name}</Link>
            </h2>
            <p>{dataset.description}</p>
            <small>일일 트래픽 {dataset.dailyTraffic.toLocaleString("ko-KR")}건</small>
            <code>{dataset.endpoint}</code>
          </article>
        ))}
      </div>

      {results.length > 0 ? (
        <div className="api-sample" aria-label="전국통합 영양성분 API 표시 데이터">
          <div className="api-sample__head">
            <strong>{query ? `"${query}" 통합 검색 결과` : "전국통합 영양성분 샘플"}</strong>
            <span>{totalVisible.toLocaleString("ko-KR")}개 항목 표시</span>
          </div>

          <div className="nutrition-dataset-grid">
            {results.map((result) => (
              <section key={result.dataset.slug} className="nutrition-dataset">
                <div className="nutrition-dataset__head">
                  <div>
                    <span>{result.dataset.shortName}</span>
                    <h2>{result.dataset.name}</h2>
                  </div>
                  <small>
                    {result.cacheSource === "db"
                      ? `DB 저장 데이터 · 전체 ${result.totalCount.toLocaleString("ko-KR")}건`
                      : result.fallback
                        ? "검증 샘플 표시"
                        : `API 수집 데이터 · 전체 ${result.totalCount.toLocaleString("ko-KR")}건`}
                  </small>
                </div>
                {result.foods.length > 0 ? (
                  <div className="health-nutrition-grid">
                    {result.foods.map((food) => (
                      <article key={`${result.dataset.slug}-${food.foodCode || food.name}`} className="health-nutrition-card">
                        <div className="health-food-card__head">
                          <span>{food.typeName || result.dataset.shortName}</span>
                          <strong>
                            {food.foodCode ? (
                              <Link href={`/nutrition-data/${result.dataset.slug}/${encodeURIComponent(food.foodCode)}`}>
                                {food.name || "식품명 미기재"}
                              </Link>
                            ) : (
                              food.name || "식품명 미기재"
                            )}
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
                            <dt>지방</dt>
                            <dd>{food.fat || "-"} g</dd>
                          </div>
                          <div>
                            <dt>탄수화물</dt>
                            <dd>{food.carbs || "-"} g</dd>
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
                            <dt>출처</dt>
                            <dd>{food.sourceName || "-"}</dd>
                          </div>
                          <div>
                            <dt>갱신일</dt>
                            <dd>{food.updatedAt || "-"}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="api-status api-status--warn">
                    <strong>{result.dataset.shortName} 데이터 응답 확인 필요</strong>
                    <p>{result.message || "현재 표시할 항목이 없습니다."}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : null}

      <section className="link-panel">
        <h2>데이터 활용 흐름</h2>
        <ul>
          <li>
            <Link href="/rankings">식품영양성분 랭킹으로 이동</Link>
            <span>열량, 단백질, 당류, 나트륨 기준으로 콘텐츠 주제를 확장합니다.</span>
          </li>
          <li>
            <Link href="/health-functional-food-nutrition">건강기능식품 영양DB만 보기</Link>
            <span>건기식 제품명, 제공 단위량, 품목제조신고번호를 별도 페이지에서 확인합니다.</span>
          </li>
        </ul>
      </section>
    </section>
  );
}
