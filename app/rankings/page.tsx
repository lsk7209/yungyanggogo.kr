import type { Metadata } from "next";
import Link from "next/link";
import { rankingGroups } from "../../lib/foods";
import {
  fetchPublicFoodItems,
  getPublicDataServiceKey,
} from "../../lib/public-food-api";
import { absoluteUrl, siteConfig } from "../../lib/site";

// 랭킹 페이지는 외부 공공데이터 API만 사용 — Turso DB 히트 없음, 1일 ISR로 전환
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "식품영양성분 목적별 비교 기준",
  description:
    "단백질 밀도, 저칼로리, 저당, 저나트륨 비교 기준 안내입니다. 특정 상업적 제품 순위가 아닙니다.",
  alternates: {
    canonical: absoluteUrl("/rankings"),
  },
  openGraph: {
    title: `식품영양성분 목적별 비교 기준 | ${siteConfig.name}`,
    description: "목적별 비교 기준 안내이며 제품 순위가 아닙니다.",
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
        <h1>식품영양성분 목적별 비교 기준</h1>
        <p>
          식품을 선택할 때 단일 숫자에 현혹되지 않고, 목적(단백질 밀도, 저칼로리, 저당, 저나트륨)에 맞춰 올바르게 영양성분을 대조하는 4대 해석 기준입니다. 법정 허위·과장 광고를 방지하기 위해 상업적 제품 순위가 아닙니다.
        </p>
      </div>
      <div className="api-status api-status--ok">
        <strong>공식 데이터 출처</strong>
        <p>비교 자료의 원천은 식품의약품안전처 식품영양성분DB입니다. 개별 수치의 기준량과 갱신일은 데이터 상세에서 확인하세요.</p>
      </div>
      {apiSample?.ok && apiSample.foods.length > 0 ? (
        <div className="api-sample" aria-label="공공데이터 API 샘플">
          <div className="api-sample__head">
            <strong>공식 API 조회 자료: 라면 영양성분 (순위 아님)</strong>
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
          <strong>현재 공식 데이터 예시를 불러오지 못했습니다</strong>
          <p>비교 기준 안내는 이용할 수 있습니다. 실제 수치는 영양성분 데이터 메뉴에서 다시 확인해 주세요.</p>
        </div>
      ) : null}
      <div className="ranking-list">
        {rankingGroups.map((ranking, index) => (
          <article key={ranking.slug} id={ranking.slug} className="rank-row">
            <span className="rank-row__num">{index + 1}</span>
            <div>
              <h2>{ranking.title}</h2>
              <p>{ranking.description}</p>
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--muted, #64748b)" }}>
                <p style={{ margin: "0.25rem 0" }}><strong>산출 공식:</strong> <code>{ranking.formula}</code></p>
                <p style={{ margin: "0.25rem 0" }}>{ranking.keyInsight}</p>
                <p style={{ margin: "0.4rem 0" }}>
                  <Link href={ranking.guideLink} style={{ color: "var(--primary, #0ea5e9)", fontWeight: 500 }}>
                    → {ranking.guideLabel}
                  </Link>
                </p>
              </div>
              <small>{ranking.metric} 기준</small>
            </div>
            <span>비교 기준 안내 · 제품 순위가 아닙니다</span>
          </article>
        ))}
      </div>
    </section>
  );
}
