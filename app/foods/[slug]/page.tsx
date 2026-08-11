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
    title: `${food.name} ?곸뼇?깅텇`,
    description: food.description,
    alternates: {
      canonical: getFoodUrl(food)
    },
    robots: slug === "protein-ready-meal-sample" ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: `${food.name} ?곸뼇?깅텇 | ${siteConfig.name}`,
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
        <h1>{food.name} ?곸뼇?깅텇</h1>
        <p>{food.description}</p>
        <div className="source-bar">
          <span>異쒖쿂 ?앺뭹?섏빟?덉븞?꾩쿂 ?앺뭹?곸뼇?깅텇DB</span>
          <span>理쒖쥌 媛깆떊 {food.updatedAt}</span>
          <span>{food.reviewer} ???</span>
        </div>
      </header>

      <section>
        <h2>영양성분</h2>
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
        <h2>媛뺤“?쒖떆 ?먯젙</h2>
        <div className="claim-table">
          {food.claims.map((claim) => (
            <div key={claim.label} className="claim-row">
              <span className={claim.met ? "badge badge--met" : "badge badge--neutral"}>
                {claim.met ? "통과: " : "미충족: "} {claim.label}
              </span>
              <p>{claim.basis}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>移댄뀒怨좊━ ???꾩튂</h2>
        <div className="claim-panel">
          <div className="percentile">
            <span>{food.percentile.label}</span>
            <b style={{ width: `${food.percentile.value}%` }} />
          </div>
        </div>
      </section>

      <section className="link-panel">
        <h2>二쇱쓽?ы빆</h2>
        <p>
          ???섏씠吏???곗씠???붾㈃ 援ы쁽???꾪븳 ?덉떆?낅땲?? ?ㅼ젣 援ш깊???앸떒 ?먮떒 ?꾩뿉???쒗뭹 ?ъ옣吏??理쒖떊
          ?곸뼇?깅텇?쒖? 怨듭떇 異쒖쿂痢쒖 ??? ?⑸땲??
        </p>
        <a href={absoluteUrl("/rankings")}>
          Link to rankings
        </a>
      </section>
    </article>
  );
}
