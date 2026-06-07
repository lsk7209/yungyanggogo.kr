import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchHealthFunctionalFoodItems,
  getFoodSafetyKoreaApiKey,
  HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT,
  HEALTH_FUNCTIONAL_FOOD_SERVICE_ID,
  HEALTH_FUNCTIONAL_FOOD_SOURCE
} from "../../lib/health-functional-food-api";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "건강기능식품 신고번호 조회 원재료 확인",
  description:
    "건강기능식품 신고번호 조회, 원재료 확인, 기능성 내용, 섭취 시 주의사항을 식품안전나라 공공 API 기준으로 확인하는 영양고고 건기식 데이터 페이지입니다.",
  alternates: {
    canonical: absoluteUrl("/health-functional-foods")
  },
  openGraph: {
    title: `건강기능식품 신고번호 조회 원재료 확인 | ${siteConfig.name}`,
    description:
      "건강기능식품 품목제조신고 원재료 데이터를 제품명, 업체명, 신고번호, 기능성 내용, 주의사항 중심으로 정리합니다.",
    url: absoluteUrl("/health-functional-foods")
  }
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

const faqItems = [
  {
    question: "건강기능식품 신고번호 조회는 왜 필요한가요?",
    answer:
      "제품명이나 광고 문구만 보면 일반식품, 기타가공품, 건강기능식품을 구분하기 어렵습니다. 신고번호와 업체명을 함께 보면 공식 신고 데이터에 등록된 제품인지 1차로 확인할 수 있습니다."
  },
  {
    question: "기능성 내용은 효능 보증과 같은 뜻인가요?",
    answer:
      "아닙니다. 기능성 내용은 신고 데이터에 포함된 정보이며 개인별 효과를 보장하지 않습니다. 질환 치료, 예방, 의약품 대체 판단에는 사용할 수 없습니다."
  },
  {
    question: "검색 결과가 없으면 미등록 제품인가요?",
    answer:
      "이 페이지는 API 호출 범위 안에서 서버 필터링을 합니다. 검색 결과가 없다는 사실만으로 미등록을 단정할 수 없으며, 제품명 표기 차이와 최신 반영 시점을 함께 확인해야 합니다."
  }
];

export default async function HealthFunctionalFoodsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const hasApiKey = Boolean(getFoodSafetyKoreaApiKey());
  const apiResult = hasApiKey
    ? await fetchHealthFunctionalFoodItems({ query, startIdx: 1, endIdx: query ? 80 : 12 })
    : null;

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "건강기능식품 품목제조신고 원재료 조회",
    description:
      "식품안전나라 건강기능식품 품목제조신고 원재료 공공 API를 바탕으로 제품명, 업체명, 신고번호, 기능성 내용, 섭취 시 주의사항을 표시합니다.",
    url: absoluteUrl("/health-functional-foods"),
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    isBasedOn: HEALTH_FUNCTIONAL_FOOD_SOURCE,
    keywords: ["건강기능식품 신고번호 조회", "건강기능식품 원재료", "건기식 기능성", "식품안전나라 API"]
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
        <p className="eyebrow">FoodSafetyKorea API</p>
        <h1>건강기능식품 신고번호 조회와 원재료 확인</h1>
        <p>
          건강기능식품을 고를 때는 제품명보다 신고번호, 업체명, 기능성 내용, 섭취 시 주의사항을 먼저
          확인해야 합니다. 영양고고는 식품안전나라 공공 API 데이터를 바탕으로 공식 신고 정보를 한 화면에
          모아 보여줍니다.
        </p>
      </div>

      <form className="data-search" action="/health-functional-foods">
        <label htmlFor="health-food-search">건강기능식품 제품명, 업체명, 기능성 키워드 검색</label>
        <div>
          <input
            id="health-food-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="예: 비타민, 칼슘, 유산균"
          />
          <button type="submit">검색</button>
        </div>
      </form>

      <div className={hasApiKey ? "api-status api-status--ok" : "api-status api-status--warn"}>
        <strong>{hasApiKey ? "공식 API 연동 활성화" : "공식 API 키 설정 필요"}</strong>
        <p>
          출처는 {HEALTH_FUNCTIONAL_FOOD_SOURCE}이며, 호출 경로는 FoodSafetyKorea{" "}
          <code>
            {HEALTH_FUNCTIONAL_FOOD_API_ENDPOINT}/&#123;key&#125;/{HEALTH_FUNCTIONAL_FOOD_SERVICE_ID}/json/1/12
          </code>
          입니다. 이 페이지는 구매 추천이나 효능 보증이 아니라 신고 데이터 확인을 돕는 정보 페이지입니다.
        </p>
      </div>

      <div className="content-guide-grid" aria-label="건강기능식품 확인 기준">
        <article>
          <span>01</span>
          <h2>신고번호와 업체명을 먼저 대조</h2>
          <p>
            동일하거나 비슷한 제품명이 많기 때문에 제품명만으로 판단하지 않습니다. 신고번호, 업체명, 제형을
            함께 보면 실제 신고 데이터와 제품 라벨을 더 정확히 맞춰볼 수 있습니다.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>기능성 내용은 표현 수위를 확인</h2>
          <p>
            기능성 문구는 건강 유지에 도움을 줄 수 있는 범위를 확인하는 자료입니다. 질병 치료, 예방,
            의약품 대체처럼 강한 표현으로 읽으면 안 됩니다.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>섭취 시 주의사항을 구매 전 확인</h2>
          <p>
            임산부, 어린이, 복용 중인 약, 알레르기 가능성처럼 개인 조건에 따라 주의가 필요한 항목이 있을
            수 있습니다. 주의사항은 기능성 문구보다 먼저 읽는 편이 안전합니다.
          </p>
        </article>
      </div>

      {apiResult?.ok ? (
        <div className="api-sample" aria-label="건강기능식품 품목제조신고 API 데이터">
          <div className="api-sample__head">
            <strong>{query ? `"${query}" 검색 결과` : "건강기능식품 신고 데이터 샘플"}</strong>
            <span>
              전체 {apiResult.totalCount.toLocaleString("ko-KR")}건 중 {apiResult.foods.length}건 표시
            </span>
          </div>
          {apiResult.foods.length > 0 ? (
            <div className="health-food-grid">
              {apiResult.foods.map((food) => (
                <article key={food.reportNo || `${food.name}-${food.maker}`} className="health-food-card">
                  <div className="health-food-card__head">
                    <span>{food.shape || "제형 확인 필요"}</span>
                    <strong>{food.name || "제품명 미기재"}</strong>
                    <small>{food.maker || "업체명 미기재"}</small>
                  </div>
                  <dl>
                    <div>
                      <dt>신고번호</dt>
                      <dd>{food.reportNo || "-"}</dd>
                    </div>
                    <div>
                      <dt>신고일</dt>
                      <dd>{food.approvedAt || "-"}</dd>
                    </div>
                    <div>
                      <dt>품목허가번호</dt>
                      <dd>{food.licenseNo || "-"}</dd>
                    </div>
                  </dl>
                  {food.functionality ? (
                    <p>
                      <b>기능성</b>
                      {food.functionality}
                    </p>
                  ) : null}
                  {food.intakeCaution ? (
                    <p className="health-food-card__caution">
                      <b>섭취 시 주의</b>
                      {food.intakeCaution}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="api-status api-status--warn">
              <strong>표시할 검색 결과가 없습니다</strong>
              <p>
                현재 API 호출 범위 안에서 일치 항목이 없었습니다. 제품명 일부, 업체명, 비타민·칼슘·유산균
                같은 기능성 키워드로 다시 검색해 보세요.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {apiResult && !apiResult.ok ? (
        <div className="api-status api-status--warn">
          <strong>FoodSafetyKorea API 응답 확인 필요</strong>
          <p>{apiResult.message}</p>
        </div>
      ) : null}

      <section className="step-panel">
        <h2>건강기능식품 원재료 데이터를 읽는 순서</h2>
        <ol>
          <li>
            <strong>제품 라벨의 신고번호를 확인합니다.</strong>
            <span>온라인 상세페이지와 실제 제품 라벨의 번호가 같은지 먼저 봅니다.</span>
          </li>
          <li>
            <strong>업체명과 제형을 함께 확인합니다.</strong>
            <span>정제, 캡슐, 분말 등 제형이 다르면 같은 원료명이라도 섭취 방식과 주의점이 달라질 수 있습니다.</span>
          </li>
          <li>
            <strong>기능성 내용과 주의사항을 분리해서 읽습니다.</strong>
            <span>기능성은 기대 범위, 주의사항은 피해야 할 조건을 알려주는 영역입니다.</span>
          </li>
        </ol>
      </section>

      <section className="link-panel">
        <h2>함께 확인하면 좋은 영양고고 자료</h2>
        <ul>
          <li>
            <Link href="/rankings">식품영양성분 랭킹 보기</Link>
            <span>일반 식품의 열량, 단백질, 당류, 나트륨 기준을 비교할 수 있습니다.</span>
          </li>
          <li>
            <Link href="/blog">영양고고 블로그 글 목록</Link>
            <span>영양성분표 읽는 법, 섭취 기준, 제품 비교 관점을 글로 확인할 수 있습니다.</span>
          </li>
        </ul>
      </section>

      <section className="faq-panel">
        <h2>건강기능식품 신고번호 조회 FAQ</h2>
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
