import Link from "next/link";
import { getAllPosts } from "../lib/blog";

const purposeChips = ["단백질", "저칼로리", "저당", "저나트륨", "100kcal 기준", "편의점"];

const rankingCards = [
  {
    icon: "단",
    title: "단백질 높은 간편식",
    metric: "100kcal당 단백질",
    count: "128개",
    tone: "green",
    href: "/foods/protein-ready-meal-sample"
  },
  {
    icon: "열",
    title: "칼로리 낮은 간식",
    metric: "1회 제공량 열량",
    count: "94개",
    tone: "slate",
    href: "/rankings"
  },
  {
    icon: "당",
    title: "당류 낮은 음료",
    metric: "100ml당 당류",
    count: "76개",
    tone: "amber",
    href: "/rankings"
  },
  {
    icon: "나",
    title: "나트륨 낮은 라면",
    metric: "1회 제공량 나트륨",
    count: "41개",
    tone: "terra",
    href: "/rankings"
  }
];

const categories = [
  ["라면", "312개"],
  ["스낵", "468개"],
  ["음료", "539개"],
  ["단백질식품", "126개"],
  ["즉석식품", "284개"],
  ["유제품", "193개"],
  ["시리얼", "88개"],
  ["소스류", "147개"]
];

const metrics = [
  ["열량", "198", "kcal", "1회 제공량"],
  ["단백질", "18.4", "g", "100kcal당 9.3g"],
  ["당류", "3.2", "g", "동일군 하위 22%"],
  ["나트륨", "410", "mg", "동일군 중간"]
];

export default function HomePage() {
  const latestPost = getAllPosts()[0];

  return (
    <>
      <section className="hero">
        <div className="hero__content kk-container">
          <p className="eyebrow">식약처 공공데이터 기반 · 무료</p>
          <h1>
            무엇을 기준으로
            <br />
            찾을까요?
          </h1>
          <p>
            영양고고는 식품영양성분을 목적에 맞춰 랭킹하고, 100g·100kcal 기준과 출처, 갱신 시점,
            강조표시 충족 여부를 함께 보여주는 데이터 중심 사이트입니다.
          </p>
          <form className="hero-search" action="/blog">
            <label className="sr-only" htmlFor="food-search">
              제품명, 업체, 카테고리 검색
            </label>
            <span aria-hidden="true">⌕</span>
            <input id="food-search" name="q" placeholder="제품명·업체·카테고리 검색" />
            <button type="submit">검색</button>
          </form>
          <div className="chip-row" aria-label="목적별 기준">
            <span>목적별</span>
            {purposeChips.map((chip) => (
              <Link key={chip} className="chip" href="/rankings">
                {chip}
              </Link>
            ))}
          </div>
          <div className="source-bar">
            <span>출처 식품의약품안전처 식품영양성분DB</span>
            <span>최종 갱신 2026-06</span>
            <span>영양고고 편집팀 검토</span>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="section__head">
          <p className="eyebrow">Popular Rankings</p>
          <h2>인기 목적 랭킹</h2>
          <p>단일 점수로 제품을 단정하지 않고 목적별 기준과 보조 지표를 같이 봅니다.</p>
        </div>
        <div className="ranking-grid">
          {rankingCards.map((card) => (
            <Link key={card.title} className={`ranking-card ranking-card--${card.tone}`} href={card.href}>
              <span className="ranking-card__icon">{card.icon}</span>
              <span>
                <strong>{card.title}</strong>
                <small>
                  {card.metric} · {card.count}
                </small>
              </span>
              <b aria-hidden="true">›</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--surface">
        <div className="section__head">
          <p className="eyebrow">Categories</p>
          <h2>카테고리로 둘러보기</h2>
        </div>
        <div className="category-grid">
          {categories.map(([name, count]) => (
            <Link key={name} className="category-tile" href="/rankings">
              <strong>{name}</strong>
              <span>{count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section data-preview">
        <div className="section__head">
          <p className="eyebrow">Data Preview</p>
          <h2>제품 상세는 수치와 판정 근거를 먼저 보여줍니다</h2>
          <p>프로토타입의 metric card, percentile bar, 충족/미충족 배지를 영양고고 스타일로 적용했습니다.</p>
        </div>
        <div className="metric-grid">
          {metrics.map(([label, value, unit, note]) => (
            <article key={label} className="metric-card">
              <span>{label}</span>
              <strong>
                {value}
                <small>{unit}</small>
              </strong>
              <em>{note}</em>
            </article>
          ))}
        </div>
        <div className="claim-panel">
          <div>
            <span className="badge badge--met">✓ 고단백 기준 충족</span>
            <span className="badge badge--neutral">– 저나트륨 기준 미충족</span>
          </div>
          <div className="percentile">
            <span>동일 카테고리 단백질 백분위</span>
            <b style={{ width: "78%" }} />
          </div>
        </div>
      </section>

      <section className="section trust-section">
        <div className="trust-card">
          <p className="eyebrow">신뢰 정책</p>
          <h2>건강 정보이기에, 근거를 먼저 보여드립니다</h2>
          <p>
            “좋다/나쁘다”로 단정하지 않습니다. 측정값, 기준량, 공식 출처, 검토일을 함께 남겨 사용자가 직접
            판단할 수 있게 합니다.
          </p>
          {latestPost ? (
            <Link className="button button--light" href={`/blog/${latestPost.slug}`}>
              최근 기준 글 읽기
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
