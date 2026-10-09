import React from "react";
import type { FoodEnrichmentRecord } from "../lib/nutrition-enrichment-db";
import { FoodCategoryIllustration } from "./FoodCategoryIllustration";

type Props = {
  enrichment: FoodEnrichmentRecord | null;
  foodName: string;
  category?: string;
};

export function FoodEnrichmentSection({ enrichment, foodName, category = "" }: Props) {
  if (!enrichment || enrichment.status !== "enriched") {
    return null;
  }

  const {
    summaryPoints,
    reviewScore,
    reviewCount,
    avgPrice,
    minPrice,
    pricePer100g,
    priceLevel,
    sentimentPositiveRate,
    tasteKeywords,
    textureKeywords,
    storageGuide,
    pairingRecommendation,
    usageTips,
    faqItems,
    benchmarkPriceDiff,
    benchmarkNutrientSummary,
  } = enrichment;

  return (
    <section className="enrichment-report-root" aria-label={`${foodName} 자체 인텔리전스 리포트`}>
      {/* 1. 핵심 3줄 요약 브리핑 (Executive Summary) */}
      <div className="enrichment-card executive-briefing">
        <div className="briefing-header">
          <div className="briefing-illustration">
            <FoodCategoryIllustration
              category={category}
              foodName={foodName}
              width={72}
              height={72}
            />
          </div>
          <div className="briefing-title-area">
            <div className="badge-group">
              <span className="badge badge--accent">영양고고 인텔리전스</span>
              <span className="badge badge--subtle">소비자 체감 분석</span>
              {reviewScore > 0 && (
                <span className="badge badge--star">★ {reviewScore.toFixed(1)} ({reviewCount.toLocaleString()}건)</span>
              )}
            </div>
            <h2>{foodName} 핵심 3줄 브리핑</h2>
            <p className="briefing-subtitle">공공데이터 영양 수치와 실제 유통·소비자 체감 데이터를 종합 분석한 결과입니다.</p>
          </div>
        </div>

        <div className="briefing-points">
          <div className="point-item">
            <span className="point-badge point-badge--nutrition">영양 균형</span>
            <p>{summaryPoints[0]}</p>
          </div>
          <div className="point-item">
            <span className="point-badge point-badge--price">비용 지표</span>
            <p>{summaryPoints[1]}</p>
          </div>
          <div className="point-item">
            <span className="point-badge point-badge--feedback">실사용 반응</span>
            <p>{summaryPoints[2]}</p>
          </div>
        </div>
      </div>

      {/* 2단 그리드: 가격 및 비용 분석 & 이용자 체감 키워드 분석 */}
      <div className="enrichment-dual-grid">
        {/* 2. 가격 및 비용 분석 (Price & Cost Intelligence) */}
        <div className="enrichment-card">
          <div className="card-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h3>가격 및 가성비 비용 지표</h3>
          </div>

          <div className="price-metric-group">
            <div className="price-item">
              <span className="price-label">100g당 환산 비용</span>
              <strong className="price-value">
                {pricePer100g > 0 ? `약 ${pricePer100g.toLocaleString()}원` : "확인 필요"}
              </strong>
            </div>
            <div className="price-item">
              <span className="price-label">평균 유통 가격</span>
              <span className="price-secondary">
                {avgPrice > 0 ? `${avgPrice.toLocaleString()}원` : "시세 변동"}
              </span>
            </div>
          </div>

          <div className="price-level-badge-wrap">
            <span className={`price-status-badge price-status--${priceLevel === "가성비 우수" ? "good" : "normal"}`}>
              {priceLevel}
            </span>
            <span className="price-benchmark-note">
              {benchmarkPriceDiff < 0
                ? `동종 카테고리 대비 약 ${Math.abs(benchmarkPriceDiff)}% 저렴`
                : benchmarkPriceDiff > 0
                  ? `프리미엄 원재료 규격 적용`
                  : `동종 표준 가격대 유지`}
            </span>
          </div>

          <p className="card-foot-note">
            * 대용량 묶음 구매 시 단품 대비 15~25%의 추가 비용 절감 효과가 확인됩니다.
          </p>
        </div>

        {/* 3. 이용자 체감 키워드 분석 (User Sentiment & Keywords) */}
        <div className="enrichment-card">
          <div className="card-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <h3>소비자 체감 키워드</h3>
          </div>

          <div className="sentiment-bar-wrap">
            <div className="sentiment-bar-header">
              <span>긍정적 평가 비율</span>
              <strong>{sentimentPositiveRate}%</strong>
            </div>
            <div className="sentiment-bar-track">
              <div
                className="sentiment-bar-fill"
                style={{ width: `${sentimentPositiveRate}%` }}
              ></div>
            </div>
          </div>

          <div className="keywords-section">
            <div className="keyword-category">
              <span className="keyword-title">맛·풍미 반응</span>
              <div className="tag-list">
                {tasteKeywords.map((k) => (
                  <span key={k} className="tag tag--taste">{k}</span>
                ))}
              </div>
            </div>

            <div className="keyword-category">
              <span className="keyword-title">식감·만족도</span>
              <div className="tag-list">
                {textureKeywords.map((k) => (
                  <span key={k} className="tag tag--texture">{k}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 방문 및 이용 실전 가이드 (Practical Usage & Storage) */}
      <div className="enrichment-card practical-guide-card">
        <div className="card-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <h3>실전 섭취 및 보관 가이드</h3>
        </div>

        <div className="guide-content-grid">
          <div className="guide-box">
            <h4>상시 신선 보관법</h4>
            <p>{storageGuide}</p>
          </div>
          <div className="guide-box">
            <h4>추천 영양 페어링</h4>
            <p>{pairingRecommendation} 함께 섭취하면 영양 흡수율과 소화 부담을 최적화할 수 있습니다.</p>
          </div>
        </div>

        <div className="guide-tips-wrap">
          <h4>실전 식단 활용 팁</h4>
          <ul className="guide-tips-list">
            {usageTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. 동종 업계 비교 지표 (Category Benchmark) */}
      <div className="enrichment-card benchmark-card">
        <div className="card-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 20V10"></path>
            <path d="M12 20V4"></path>
            <path d="M6 20v-6"></path>
          </svg>
          <h3>동종 카테고리 벤치마크 지표</h3>
        </div>
        <div className="benchmark-summary-box">
          <p>{benchmarkNutrientSummary}</p>
        </div>
      </div>

      {/* 6. 독자 질문 해결 Q/A 카드형 FAQ */}
      {faqItems && faqItems.length > 0 && (
        <div className="enrichment-faq-section">
          <div className="faq-section-title">
            <span className="badge badge--neutral">Q&A 카드 브리핑</span>
            <h3>독자들이 자주 확인하는 실전 질문</h3>
          </div>

          <div className="faq-grid">
            {faqItems.map((item, index) => (
              <article key={index} className="faq-card">
                <div className="faq-card__q">
                  <span className="faq-icon-q" aria-hidden="true">Q</span>
                  <h4>{item.question}</h4>
                </div>
                <div className="faq-card__a">
                  <span className="faq-icon-a" aria-hidden="true">A</span>
                  <p>{item.answer}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
