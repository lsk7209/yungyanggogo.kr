import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchHealthFunctionalFoodNutritionItems,
  getHealthFunctionalFoodNutritionApiKey,
  HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT,
  HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE
} from "../../lib/health-functional-food-nutrition-api";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "건강기능식품 영양DB 제품 영양성분 조회",
  description:
    "건강기능식품 영양DB에서 제품별 에너지, 단백질, 지방, 탄수화물, 당류, 나트륨, 비타민, 품목제조신고번호를 확인하는 영양고고 데이터 페이지입니다.",
  alternates: {
    canonical: absoluteUrl("/health-functional-food-nutrition")
  },
  openGraph: {
    title: `건강기능식품 영양DB 제품 영양성분 조회 | ${siteConfig.name}`,
    description:
      "공공데이터포털 전국건강기능식품영양성분정보표준데이터를 기준으로 건기식 제품의 영양성분과 신고번호를 확인합니다.",
    url: absoluteUrl("/health-functional-food-nutrition")
  }
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

const faqItems = [
  {
    question: "건강기능식품 영양DB는 원재료 신고 데이터와 무엇이 다른가요?",
    answer:
      "영양DB는 제품 단위의 에너지, 단백질, 지방, 탄수화물, 당류, 나트륨, 비타민 등 영양성분 표시 정보를 다룹니다. 원재료 신고 데이터는 신고번호, 기능성 내용, 섭취 시 주의사항 확인에 더 가깝습니다."
  },
  {
    question: "영양성분 값이 0이면 성분이 전혀 없다는 뜻인가요?",
    answer:
      "반드시 그렇지는 않습니다. 제품 표시 기준, 제공 단위량, 데이터 수집 방식에 따라 0 또는 공란으로 표시될 수 있으므로 제품 라벨과 함께 확인해야 합니다."
  },
  {
    question: "이 페이지 데이터로 제품을 추천하나요?",
    answer:
      "아닙니다. 이 페이지는 공식 데이터 확인용입니다. 개인의 질환, 복용약, 임신 여부, 알레르기 등은 전문가 상담과 제품 라벨 확인이 우선입니다."
  }
];

export default async function HealthFunctionalFoodNutritionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const hasApiKey = Boolean(getHealthFunctionalFoodNutritionApiKey());
  const apiResult = hasApiKey
    ? await fetchHealthFunctionalFoodNutritionItems({ query, pageNo: 1, numOfRows: 12 })
    : null;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "건강기능식품 영양DB 제품 영양성분 조회",
    description:
      "공공데이터포털 전국건강기능식품영양성분정보표준데이터를 바탕으로 건강기능식품 제품별 영양성분, 제공 단위량, 품목제조신고번호를 표시합니다.",
    url: absoluteUrl("/health-functional-food-nutrition"),
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    isBasedOn: HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE,
    keywords: ["건강기능식품 영양DB", "건기식 영양성분", "품목제조신고번호", "전국건강기능식품영양성분정보표준데이터"]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <section className="section blog-index">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([pageSchema, faqSchema]) }}
      />

      <div className="section__head">
        <p className="eyebrow">Health Functional Food Nutrition DB</p>
        <h1>건강기능식품 영양DB 제품 영양성분 조회</h1>
        <p>
          건강기능식품은 기능성 문구만 보면 실제 영양성분 구성이 잘 보이지 않습니다. 영양고고는 제품명,
          제공 단위량, 에너지, 단백질, 지방, 탄수화물, 당류, 나트륨, 비타민, 품목제조신고번호를 함께
          보여줘 제품 라벨을 검토하기 쉽게 정리합니다.
        </p>
      </div>

      <form className="data-search" action="/health-functional-food-nutrition">
        <label htmlFor="health-food-nutrition-search">건강기능식품 제품명 검색</label>
        <div>
          <input
            id="health-food-nutrition-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="예: 유산균, 칼슘, 비타민D, 단백질"
          />
          <button type="submit">검색</button>
        </div>
      </form>

      <div className={hasApiKey ? "api-status api-status--ok" : "api-status api-status--warn"}>
        <strong>{hasApiKey ? "건강기능식품 영양DB API 연동 준비됨" : "공공데이터포털 API 활용신청 필요"}</strong>
        <p>
          출처는 {HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE}이며 요청주소는{" "}
          <code>{HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT}</code> 입니다. 현재 키가 해당 표준데이터에 등록되어
          있어야 실제 제품 영양성분이 표시됩니다.
        </p>
      </div>

      <div className="content-guide-grid" aria-label="건강기능식품 영양DB 확인 기준">
        <article>
          <span>01</span>
          <h2>제공 단위량부터 확인</h2>
          <p>1캡슐, 1포, 1스쿱처럼 제공 단위가 다르면 같은 영양성분 값도 실제 섭취량 기준이 달라집니다.</p>
        </article>
        <article>
          <span>02</span>
          <h2>열량과 당류를 함께 확인</h2>
          <p>구미, 젤리, 음료형 건기식은 기능성보다 당류와 열량이 먼저 문제가 될 수 있습니다.</p>
        </article>
        <article>
          <span>03</span>
          <h2>신고번호로 원재료 정보 연결</h2>
          <p>품목제조신고번호가 있으면 원재료 신고 데이터와 대조해 기능성 내용과 주의사항까지 확인할 수 있습니다.</p>
        </article>
      </div>

      <section className="data-license-panel" aria-label="건강기능식품 영양DB 기본정보와 라이선스">
        <div>
          <p className="eyebrow">Data License</p>
          <h2>데이터명, 승인, 활용정보, 저작권 표시</h2>
          <p>
            이 페이지는 공공데이터포털의 건강기능식품 영양DB를 웹사이트 연동 및 운영 목적으로 활용하도록
            설계했습니다. 데이터 이용 시 출처와 저작권, 제3자 권리 포함 가능성을 함께 표시합니다.
          </p>
        </div>
        <dl>
          <div>
            <dt>기본정보</dt>
            <dd>건강기능식품 제품별 영양성분 정보와 품목제조신고번호를 제공하는 공공데이터입니다.</dd>
          </div>
          <div>
            <dt>데이터명</dt>
            <dd>식품의약품안전처_건강기능식품 영양DB</dd>
          </div>
          <div>
            <dt>표준데이터명</dt>
            <dd>{HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE}</dd>
          </div>
          <div>
            <dt>상세설명</dt>
            <dd>전국건강기능식품영양성분정보표준데이터 상세설명</dd>
          </div>
          <div>
            <dt>제공기관</dt>
            <dd>식품의약품안전처</dd>
          </div>
          <div>
            <dt>서비스유형</dt>
            <dd>REST</dd>
          </div>
          <div>
            <dt>심의여부</dt>
            <dd>자동승인</dd>
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
            <dt>서비스정보</dt>
            <dd>건강기능식품 제품별 영양성분 정보 REST API</dd>
          </div>
          <div>
            <dt>데이터포맷</dt>
            <dd>JSON+XML</dd>
          </div>
          <div>
            <dt>End Point</dt>
            <dd>{HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_ENDPOINT}</dd>
          </div>
          <div>
            <dt>활용정보</dt>
            <dd>사이트개발, 웹사이트 연동 및 운영, 제품별 영양성분 조회 화면 구성</dd>
          </div>
          <div>
            <dt>자동승인</dt>
            <dd>개발계정 활용신청은 자동승인 대상입니다.</dd>
          </div>
          <div>
            <dt>승인</dt>
            <dd>활용신청이 승인된 data.go.kr 서비스키를 서버 환경변수에 등록해야 실데이터가 표시됩니다.</dd>
          </div>
          <div>
            <dt>미리보기</dt>
            <dd>제품명, 제공 단위량, 에너지, 단백질, 지방, 탄수화물, 당류, 나트륨, 비타민, 품목제조신고번호</dd>
          </div>
          <div>
            <dt>확인</dt>
            <dd>미리보기 데이터와 실제 API 응답 필드를 대조해 화면 표시 항목을 구성합니다.</dd>
          </div>
          <div>
            <dt>라이센스표시</dt>
            <dd>공공데이터 이용 조건에 따라 출처를 표시하고, 원 데이터의 최신성·정확성은 제공기관 기준으로 확인합니다.</dd>
          </div>
          <div>
            <dt>저작자표시</dt>
            <dd>출처: 공공데이터포털, 식품의약품안전처, {HEALTH_FUNCTIONAL_FOOD_NUTRITION_SOURCE}</dd>
          </div>
          <div>
            <dt>제3자 권리 포함 : 저작권 표시</dt>
            <dd>제3자 권리가 포함될 수 있으므로 원자료의 저작권 표시와 이용 조건을 함께 확인합니다.</dd>
          </div>
        </dl>
      </section>

      {apiResult?.ok ? (
        <div className="api-sample" aria-label="건강기능식품 영양DB API 데이터">
          <div className="api-sample__head">
            <strong>{query ? `"${query}" 영양DB 검색 결과` : "건강기능식품 영양DB 샘플"}</strong>
            <span>
              전체 {apiResult.totalCount.toLocaleString("ko-KR")}건 중 {apiResult.foods.length}건 표시
            </span>
          </div>
          {apiResult.foods.length > 0 ? (
            <div className="health-nutrition-grid">
              {apiResult.foods.map((food) => (
                <article key={food.foodCode || `${food.name}-${food.reportNo}`} className="health-nutrition-card">
                  <div className="health-food-card__head">
                    <span>{food.representativeFood || food.middleCategory || "분류 확인 필요"}</span>
                    <strong>{food.name || "제품명 미기재"}</strong>
                    <small>{food.maker || food.importer || "업체명 미기재"}</small>
                  </div>
                  <dl>
                    <div>
                      <dt>제공 단위량</dt>
                      <dd>{food.servingUnit || food.oneServingWeight || "-"}</dd>
                    </div>
                    <div>
                      <dt>에너지</dt>
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
                      <dt>비타민 C</dt>
                      <dd>{food.vitaminC || "-"} mg</dd>
                    </div>
                    <div>
                      <dt>비타민 D</dt>
                      <dd>{food.vitaminD || "-"} ug</dd>
                    </div>
                  </dl>
                  <p className="health-food-card__caution">
                    <b>품목제조신고번호</b>
                    {food.reportNo || "미기재"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="api-status api-status--warn">
              <strong>표시할 검색 결과가 없습니다</strong>
              <p>제품명 일부나 대표 영양성분 키워드로 다시 검색해 보세요.</p>
            </div>
          )}
        </div>
      ) : null}

      {apiResult && !apiResult.ok ? (
        <div className="api-status api-status--warn">
          <strong>건강기능식품 영양DB API 응답 확인 필요</strong>
          <p>{apiResult.message}</p>
        </div>
      ) : null}

      <section className="link-panel">
        <h2>건기식 데이터를 함께 보는 순서</h2>
        <ul>
          <li>
            <Link href="/health-functional-foods">건강기능식품 신고번호·원재료 조회</Link>
            <span>같은 신고번호로 기능성 내용과 섭취 시 주의사항을 대조합니다.</span>
          </li>
          <li>
            <Link href="/rankings">일반 식품영양성분 랭킹</Link>
            <span>건기식이 아닌 일반 식품의 열량, 단백질, 나트륨 기준을 비교합니다.</span>
          </li>
        </ul>
      </section>

      <section className="faq-panel">
        <h2>건강기능식품 영양DB FAQ</h2>
        {faqItems.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
    </section>
  );
}
