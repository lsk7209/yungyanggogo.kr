import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "../lib/blog";
import { absoluteUrl } from "../lib/site";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/")
  }
};

const purposeChips = ["단백질", "저칼로리", "저당", "저나트륨", "100kcal 기준", "편의점"];

const rankingCards = [
  {
    icon: "단",
    title: "단백질 높은 간편식",
    metric: "100kcal당 단백질",
    tone: "green",
    href: "/rankings"
  },
  {
    icon: "열",
    title: "칼로리 낮은 간식",
    metric: "1회 제공량 열량",
    tone: "slate",
    href: "/rankings"
  },
  {
    icon: "당",
    title: "당류 낮은 음료",
    metric: "100ml당 당류",
    tone: "amber",
    href: "/rankings"
  },
  {
    icon: "나",
    title: "나트륨 낮은 라면",
    metric: "1회 제공량 나트륨",
    tone: "terra",
    href: "/rankings"
  }
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
            영양고고는 공식 식품영양 자료와 100g·100kcal 비교 기준을 안내합니다.
            실제 자료는 영양성분 데이터 메뉴에서 확인하고, 화면 설명용 예시 데이터와 구분해 이용하세요.
          </p>
          <Link className="button" href="/nutrition-data">공식 영양성분 데이터 둘러보기</Link>
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
            <span>자료별 출처와 기준일은 각 데이터 페이지에서 확인하세요</span>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="section__head">
          <p className="eyebrow">Popular Rankings</p>
          <h2>목적별 비교 기준</h2>
          <p>실제 제품 순위가 아닌 비교 기준 안내입니다. 정렬된 랭킹과 상품 수는 아직 제공하지 않습니다.</p>
        </div>
        <div className="ranking-grid">
          {rankingCards.map((card) => (
            <Link key={card.title} className={`ranking-card ranking-card--${card.tone}`} href={card.href}>
              <span className="ranking-card__icon">{card.icon}</span>
              <span>
                <strong>{card.title}</strong>
                <small>
                  {card.metric} · 비교 기준
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
          <h2>공식 데이터에서 직접 찾기</h2>
          <p>아직 실제 분류 필터를 제공하지 않으므로 카테고리별 결과를 가장하지 않습니다.</p>
        </div>
        <Link className="button" href="/nutrition-data">식품명으로 공식 데이터 검색</Link>
      </section>

      <section className="section data-preview">
        <div className="section__head">
          <p className="eyebrow">Data Guide</p>
          <h2>영양성분 수치를 확인하는 순서</h2>
          <p>제품마다 기준량과 단위가 다르므로 숫자만 비교하지 말고 원천 정보와 함께 확인하세요.</p>
        </div>
        <div className="metric-grid">
          <article className="metric-card"><span>1</span><strong>기준량</strong><em>100g, 100ml, 1회 제공량을 먼저 구분합니다.</em></article>
          <article className="metric-card"><span>2</span><strong>단위</strong><em>g, mg, μg와 질량·부피 단위를 섞어 비교하지 않습니다.</em></article>
          <article className="metric-card"><span>3</span><strong>출처</strong><em>원천 기관과 데이터 기준일을 확인합니다.</em></article>
          <article className="metric-card"><span>4</span><strong>결측</strong><em>빈값을 영양성분 0으로 해석하지 않습니다.</em></article>
        </div>
      </section>

      <section className="section trust-section">
        <div className="trust-card">
          <p className="eyebrow">신뢰 정책</p>
          <h2>건강 정보이기에, 근거를 먼저 보여드립니다</h2>
          <p>
            &ldquo;좋다/나쁘다&rdquo;로 단정하지 않습니다. 측정값, 기준량, 공식 출처, 검토일을 함께 남겨 사용자가 직접
            판단할 수 있게 합니다.
          </p>
          {latestPost ? (
            <Link className="button button--light" href={`/blog/${latestPost.slug}`}>
              최근 기준 글 읽기
            </Link>
          ) : null}
        </div>
      </section>

      <section className="section section--surface">
        <div className="section__head">
          <p className="eyebrow">How to Use</p>
          <h2>영양고고를 활용하는 방법</h2>
          <p>영양성분 수치를 단순히 나열하는 것이 아니라, 목적에 맞는 기준으로 제품을 비교하는 방법을 안내합니다.</p>
        </div>
        <div className="category-grid">
          <article className="guide-card">
            <h3>다이어트 식품 고르기</h3>
            <p>
              저칼로리·저지방·저당을 함께 볼 때는 먼저 같은 식품군과 같은 기준량으로
              맞출 수 있는지 확인하세요. 100g, 100ml, 1회 제공량은 목적에 따라 쓰임이
              다릅니다. 비교 기준 안내와 실제 데이터 목록을 구분해 확인하세요.
              정렬된 제품 랭킹은 아직 제공하지 않습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>단백질 식품 선택 기준</h3>
            <p>
              단백질 함량은 100g당 수치와 100kcal당 수치가 서로 다른 질문에 답합니다.
              같은 식품군 안에서 기준량, 열량, 나트륨 등 보조 지표를 함께 확인하세요.
              법정 강조표시 충족 여부는 최신 적용 조건과 제품 유형을 확인하기 전에는 판정하지 않습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>나트륨 제한 식단</h3>
            <p>
              나트륨은 1회 제공량 기준으로 표기되는 경우가 많아 제품 간 비교가
              어렵습니다. 공식 데이터 목록에서 기준량과 단위를 확인하세요.
              개인별 섭취 판단이 필요하면 제품 라벨을 확인하고 의료·영양 전문가와 상의하세요.
            </p>
          </article>
          <article className="guide-card">
            <h3>편의점 식품 영양 체크</h3>
            <p>
              제품 포장지의 영양성분표와 공식 데이터의 기준량을 확인하세요.
              편의점 제품만 따로 정렬하는 필터는 아직 제공하지 않습니다.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">FAQ</p>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className="faq-list">
          <article className="faq-item">
            <h3>영양성분 데이터는 어디서 가져오나요?</h3>
            <p>
              식품의약품안전처 식품영양성분 데이터베이스(식품안전나라)의 공공데이터를
              기반으로 합니다. 데이터 갱신 주기와 수집일은 각 제품 페이지에 명시합니다.
              제조사 자체 표기와 차이가 있을 수 있으므로 구매 전 실제 제품 라벨을
              반드시 확인하세요.
            </p>
          </article>
          <article className="faq-item">
            <h3>강조표시 기준이란 무엇인가요?</h3>
            <p>
              영양강조표시는 적용되는 식품 유형, 기준량, 시행 중인 고시와 추가 조건을 함께 확인해야 합니다.
              영양고고는 확인되지 않은 법정 기준 충족 배지를 표시하지 않습니다.
            </p>
          </article>
          <article className="faq-item">
            <h3>영양고고 정보를 건강 진단 목적으로 써도 되나요?</h3>
            <p>
              아닙니다. 영양고고는 식품 선택에 참고하는 정보 서비스이며 의료·영양 상담을
              대체하지 않습니다. 특정 질환이나 식이 제한이 있다면 의사나 영양사에게
              확인하세요.
            </p>
          </article>
          <article className="faq-item">
            <h3>제품 비교는 어떻게 하나요?</h3>
            <p>
              공식 데이터 목록에서 기준량과 단위를 확인한 뒤 2~3개 식품을 비교 목록에 담으세요.
              비교 화면에서는 보고값·100g·100ml·100kcal 기준을 구분하며, 안전하게 환산할 수 없는 값은 계산하지 않습니다.
            </p>
          </article>
          <article className="faq-item">
            <h3>영양고고 데이터는 얼마나 자주 갱신되나요?</h3>
            <p>
              식품의약품안전처 식품영양성분 데이터베이스 갱신 주기에 맞춰 업데이트합니다.
              각 제품 페이지에 데이터 수집일을 표시하므로 갱신 시점을 직접 확인할 수
              있습니다. 제품이 단종되거나 성분이 변경된 경우 실제 라벨과 차이가 있을 수
              있으므로 구매 전 라벨을 반드시 확인하세요.
            </p>
          </article>
          <article className="faq-item">
            <h3>특정 제품이 목록에 없으면 어떻게 하나요?</h3>
            <p>
              현재 검색 범위에서 결과가 없더라도 공공데이터에 미등록됐다고 단정할 수 없습니다.
              검색어와 데이터 제공 상태를 확인하고, 해당 제품의 영양성분표를 직접
              확인해 100g당 수치로 환산하면 영양고고의 랭킹 기준과 같은 방식으로
              비교할 수 있습니다.
            </p>
          </article>
        </div>
      </section>

      <section className="section section--surface">
        <div className="section__head">
          <p className="eyebrow">Nutrition Guide</p>
          <h2>영양 성분 바르게 읽는 법</h2>
          <p>식품 라벨의 숫자를 실생활에서 활용하기 위한 기준점을 정리했습니다.</p>
        </div>
        <div className="category-grid">
          <article className="guide-card">
            <h3>100g 기준 비교가 중요한 이유</h3>
            <p>
              제품마다 1회 제공량이 다르면 같은 숫자라도 실제 섭취량이 달라집니다.
              예를 들어 라면 한 봉지와 시리얼 한 컵의 1회 제공량은 각각 100g 이상,
              30g 내외로 차이가 큽니다. 100g 기준은 같은 질량으로 환산 가능한 식품을
              비교할 때 유용하지만, 식품군과 섭취 맥락이 다른 제품을 곧바로 같은 순위로 만들지는 않습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>단백질 일일 권장량과 식품 선택</h3>
            <p>
              단백질 필요량은 연령, 건강 상태, 활동량과 식사 구성에 따라 달라집니다.
              제품을 비교할 때는 같은 기준량의 단백질 수치와 열량·나트륨 등 보조 지표를 함께 보고,
              개인 섭취 목표는 의료·영양 전문가의 안내를 따르세요.
            </p>
          </article>
          <article className="guide-card">
            <h3>당류와 첨가당 구분하기</h3>
            <p>
              영양성분표의 총당류만으로 유리당이나 첨가당의 양을 계산할 수는 없습니다.
              원재료명은 구성 확인에 도움을 주지만 정확한 첨가당 양을 뜻하지 않으므로,
              총당류·첨가당·유리당을 서로 같은 값으로 취급하지 않습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>나트륨 섭취량 관리 방법</h3>
            <p>
              가공식품의 나트륨 함량과 1회 섭취량을 함께 확인하면 전체 섭취량을 점검하는 데 도움이 됩니다.
              국물 요리와 조미료 사용을 줄이고 나트륨이 낮은 가공식품을 선택하는
              것이 실질적인 감소 방법입니다.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
