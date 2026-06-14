import type { Metadata } from "next";
import Link from "next/link";
import { rankingGroups } from "../../lib/foods";
import {
  fetchPublicFoodItems,
  FOOD_NUTRITION_API_ENDPOINT,
  getPublicDataServiceKey,
} from "../../lib/public-food-api";
import { absoluteUrl, siteConfig } from "../../lib/site";

// 랭킹 페이지는 외부 공공데이터 API만 사용 — Turso DB 히트 없음, 1일 ISR로 전환
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "식품영양성분 랭킹",
  description:
    "단백질, 저칼로리, 저당, 저나트륨 등 목적별 식품영양성분 랭킹 허브입니다.",
  alternates: {
    canonical: absoluteUrl("/rankings"),
  },
  openGraph: {
    title: `식품영양성분 랭킹 | ${siteConfig.name}`,
    description: "목적별 식품영양성분 랭킹과 기준 수치를 확인합니다.",
    url: absoluteUrl("/rankings"),
  },
};

export default async function RankingsPage() {
  const hasPublicDataKey = Boolean(getPublicDataServiceKey());
  const apiSample = hasPublicDataKey
    ? await fetchPublicFoodItems({ query: "라면", numOfRows: "6" })
    : null;

  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">Rankings</p>
        <h1>식품영양성분 목적별 랭킹</h1>
        <p>
          각 랭킹은 기준량, 보조 지표, 출처와 갱신 시점을 함께 확인하도록
          설계했습니다.
        </p>
      </div>
      <div
        className={
          hasPublicDataKey
            ? "api-status api-status--ok"
            : "api-status api-status--warn"
        }
      >
        <strong>
          {hasPublicDataKey
            ? "공공데이터 API 연결 준비 완료"
            : "공공데이터 API 키 설정 필요"}
        </strong>
        <p>
          공식 데이터 원천은 식품의약품안전처_식품영양성분DB정보입니다. 서버
          환경변수에 `PUBLIC_DATA_SERVICE_KEY` 또는 `DATA_GO_KR_SERVICE_KEY`를
          설정하면 `/api/foods?q=라면`에서 실제 식품명, 제조사, 기준량, 열량,
          단백질, 당류, 나트륨 데이터를 가져옵니다.
        </p>
        <a href={FOOD_NUTRITION_API_ENDPOINT} target="_blank" rel="noreferrer">
          API 엔드포인트 확인
        </a>
      </div>
      {apiSample?.ok && apiSample.foods.length > 0 ? (
        <div className="api-sample" aria-label="공공데이터 API 샘플">
          <div className="api-sample__head">
            <strong>실시간 API 샘플: 라면 영양성분</strong>
            <span>출처: 식품의약품안전처_식품영양성분DB정보</span>
          </div>
          <div className="api-sample__grid">
            {apiSample.foods.map((food) => (
              <article
                key={food.foodCode || `${food.name}-${food.maker}`}
                className="api-food-card"
              >
                <div>
                  <strong>{food.name}</strong>
                  <span>{food.maker}</span>
                </div>
                <dl>
                  <div>
                    <dt>기준량</dt>
                    <dd>{food.servingSize || "확인 필요"}</dd>
                  </div>
                  <div>
                    <dt>열량</dt>
                    <dd>{food.kcal || "-"} kcal</dd>
                  </div>
                  <div>
                    <dt>단백질</dt>
                    <dd>{food.protein || "-"} g</dd>
                  </div>
                  <div>
                    <dt>나트륨</dt>
                    <dd>{food.sodium || "-"} mg</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {apiSample && !apiSample.ok ? (
        <div className="api-status api-status--warn">
          <strong>공공데이터 API 응답 확인 필요</strong>
          <p>{apiSample.message}</p>
        </div>
      ) : null}
      <div className="ranking-list">
        {rankingGroups.map((ranking, index) => (
          <article key={ranking.slug} className="rank-row">
            <span className="rank-row__num">{index + 1}</span>
            <div>
              <h2>{ranking.title}</h2>
              <p>{ranking.description}</p>
              <small>{ranking.metric} 기준</small>
            </div>
            <Link href={`/foods/${ranking.productSlug}`}>대표 제품 보기</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
