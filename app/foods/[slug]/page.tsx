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
    title: `${food.name} 영양성분`,
    description: food.description,
    alternates: {
      canonical: getFoodUrl(food)
    },
    openGraph: {
      type: "article",
      title: `${food.name} 영양성분 | ${siteConfig.name}`,
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

  const productSchema = {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <header className="article-header">
        <p className="eyebrow">{food.category}</p>
        <h1>{food.name} 영양성분</h1>
        <p>{food.description}</p>
        <div className="source-bar">
          <span>출처 식품의약품안전처 식품영양성분DB</span>
          <span>최종 갱신 {food.updatedAt}</span>
          <span>{food.reviewer} 검토</span>
        </div>
      </header>

      <section>
        <h2>핵심 지표</h2>
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
        <h2>강조표시 판정</h2>
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
        <h2>카테고리 내 위치</h2>
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
