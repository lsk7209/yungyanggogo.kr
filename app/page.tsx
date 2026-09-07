import Link from "next/link";
import { getAllPosts } from "../lib/blog";

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

const categories = [
  "라면", "스낵", "음료", "단백질식품", "즉석식품", "유제품", "시리얼", "소스류"
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
          <h2>카테고리로 둘러보기</h2>
        </div>
        <div className="category-grid">
          {categories.map((name) => (
            <Link key={name} className="category-tile" href="/nutrition-data">
              <strong>{name}</strong>
              <span>공식 데이터 목록에서 찾기</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section data-preview">
        <div className="section__head">
          <p className="eyebrow">Data Preview</p>
          <h2>예시 데이터 — 실제 식품·판정·순위가 아닙니다</h2>
          <p>아래 수치와 배지는 화면 설명용 가상 값이며 식약처에서 조회한 제품 기록이 아닙니다. 구매나 식단 판단에 사용하지 마세요.</p>
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
              저칼로리·저지방·저당 기준을 동시에 만족하는 제품을 찾으려면 100g 기준
              비교가 가장 정확합니다. 1회 제공량은 제조사마다 달라 직접 비교가 어렵기
              때문입니다. 비교 기준 안내와 실제 데이터 목록을 구분해 확인하세요.
              정렬된 제품 랭킹은 아직 제공하지 않습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>단백질 식품 선택 기준</h3>
            <p>
              단백질 함량은 100kcal당 g 수로 비교하는 것이 더 정확합니다. 같은 단백질
              식품이라도 열량 대비 단백질 비율이 다르면 실제 섭취 효율이 달라집니다.
              고단백 기준은 100g당 20g 이상, 100kcal당 10g 이상을 충족해야 강조표시가
              허용됩니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>나트륨 제한 식단</h3>
            <p>
              나트륨은 1회 제공량 기준으로 표기되는 경우가 많아 제품 간 비교가
              어렵습니다. 공식 데이터 목록에서 기준량과 단위를 확인하세요.
              하루 나트륨 섭취 목표를 정해두고 제품별 1회 제공량을 역산하면
              실제 섭취 계획을 세울 수 있습니다.
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
              식약처가 정한 기능성 영양 강조표시 기준을 말합니다. 예를 들어 고단백은
              100g당 단백질 20g 이상이거나 100kcal당 10g 이상이어야 합니다. 영양고고는
              이 기준 충족 여부를 각 제품 페이지에서 배지로 표시합니다.
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
              공식 데이터 목록에서 기준량과 단위를 확인한 뒤 제품 라벨과 대조하세요.
              현재 목적별 페이지는 비교 기준 안내이며, 제품 간 자동 정렬·나란히 비교 기능은 제공하지 않습니다.
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
              공공데이터에 등록된 식품만 수록됩니다. 수입 식품이나 소규모 제조사의
              제품은 데이터베이스에 없을 수 있습니다. 해당 제품의 영양성분표를 직접
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
              30g 내외로 차이가 큽니다. 100g 기준으로 통일하면 카테고리가 달라도
              같은 조건에서 비교할 수 있습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>단백질 일일 권장량과 식품 선택</h3>
            <p>
              성인 기준 단백질 권장 섭취량은 체중 1kg당 약 0.8g입니다. 체중 60kg이면
              하루 약 48g이 필요합니다. 고단백 식품을 고를 때는 100g당 단백질 20g
              이상, 또는 100kcal당 10g 이상을 기준으로 삼으면 식약처 강조표시 기준과
              일치합니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>당류와 첨가당 구분하기</h3>
            <p>
              영양성분표의 당류에는 과일·우유의 천연당과 설탕 등 첨가당이 모두
              포함됩니다. 세계보건기구는 첨가당을 하루 열량의 10% 미만으로 제한할
              것을 권고합니다. 성분 목록에서 설탕·액상과당·포도당의 위치가 앞쪽일수록
              첨가당 비중이 높습니다.
            </p>
          </article>
          <article className="guide-card">
            <h3>나트륨 섭취량 관리 방법</h3>
            <p>
              한국인의 하루 평균 나트륨 섭취량은 권장량(2,000mg)을 크게 초과합니다.
              가공식품의 나트륨 함량을 파악하면 전체 섭취량을 조절하기 쉬워집니다.
              국물 요리와 조미료 사용을 줄이고 나트륨이 낮은 가공식품을 선택하는
              것이 실질적인 감소 방법입니다.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
