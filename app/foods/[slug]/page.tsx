import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { foods, getFoodBySlug, getFoodUrl } from "../../../lib/foods";
import { absoluteUrl, siteConfig } from "../../../lib/site";

type FoodPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return foods.map((food) => ({ slug: food.slug }));
}

export async function generateMetadata({ params }: FoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const food = getFoodBySlug(slug);

  if (!food) {
    return {};
  }

  return {
    title: food.isExample ? `${food.name} — 예시 데이터` : `${food.name} 영양성분`,
    description: food.description,
    alternates: {
      canonical: getFoodUrl(food)
    },
    robots: food.isExample ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: food.isExample ? `${food.name} — 예시 데이터 | ${siteConfig.name}` : `${food.name} 영양성분 | ${siteConfig.name}`,
      description: food.description,
      url: getFoodUrl(food)
    }
  };
}

export default async function FoodPage({ params }: FoodPageProps) {
  const { slug } = await params;
  const food = getFoodBySlug(slug);

  if (!food) {
    notFound();
  }

  const productSchema = food.isExample ? null : {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${getFoodUrl(food)}#product`,
    name: food.name,
    brand: food.maker,
    category: food.category,
    description: food.description,
    url: getFoodUrl(food)
  };

  return (
    <article className="article-shell food-detail">
      {productSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />}
      <header className="article-header">
        <p className="eyebrow">{food.isExample ? "실제 식품이 아닌 화면 예시" : food.category}</p>
        <h1>{food.name}{food.isExample ? " — 예시 데이터" : " 영양성분"}</h1>
        <p>{food.description}</p>
        {food.isExample ? <p>아래 수치·강조표시·백분위는 화면 설명용 가상 값입니다. 식약처에서 조회한 제품 기록이나 실제 상품의 판정·순위가 아닙니다.</p> : <div className="source-bar">
          <span>출처 식품의약품안전처 식품영양성분DB</span>
          <span>최종 갱신 {food.updatedAt}</span>
          <span>{food.reviewer} 검토</span>
        </div>}
      </header>

      <section>
        <h2>{food.isExample ? "지표 표시 예시" : "핵심 지표"}</h2>
        <div className="metric-grid">
          {food.metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <span>{metric.label}</span>
              <strong>
                {metric.value}
                <small>{metric.unit}</small>
              </strong>
              <em>{metric.note}</em>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>{food.isExample ? "강조표시 화면 예시 — 실제 판정 아님" : "강조표시 판정"}</h2>
        <div className="claim-table">
          {food.claims.map((claim) => (
            <div key={claim.label} className="claim-row">
              <span className={claim.met ? "badge badge--met" : "badge badge--neutral"}>
                {claim.met ? "✓" : "–"} {claim.label}
              </span>
              <p>{claim.basis}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>{food.isExample ? "백분위 화면 예시 — 실제 순위 아님" : "카테고리 내 위치"}</h2>
        <div className="claim-panel">
          <div className="percentile">
            <span>{food.percentile.label}</span>
            <b style={{ width: `${food.percentile.value}%` }} />
          </div>
        </div>
      </section>

      <section className="link-panel">
        <h2>주의사항</h2>
        <p>
          이 페이지는 데이터 화면 구현을 위한 예시입니다. 실제 구매나 식단 판단 전에는 제품 포장지의 최신
          영양성분표와 공식 출처를 함께 확인해야 합니다.
        </p>
        <a href={absoluteUrl("/rankings")}>목적별 랭킹으로 돌아가기</a>
      </section>
    </article>
  );
}
