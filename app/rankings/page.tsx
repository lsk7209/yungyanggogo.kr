import type { Metadata } from "next";
import Link from "next/link";
import { rankingGroups } from "../../lib/foods";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "식품영양성분 랭킹",
  description: "단백질, 저칼로리, 저당, 저나트륨 등 목적별 식품영양성분 랭킹 허브입니다.",
  alternates: {
    canonical: absoluteUrl("/rankings")
  },
  openGraph: {
    title: `식품영양성분 랭킹 | ${siteConfig.name}`,
    description: "목적별 식품영양성분 랭킹과 기준 수치를 확인합니다.",
    url: absoluteUrl("/rankings")
  }
};

export default function RankingsPage() {
  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">Rankings</p>
        <h1>식품영양성분 목적별 랭킹</h1>
        <p>각 랭킹은 기준량, 보조 지표, 출처와 갱신 시점을 함께 확인하도록 설계했습니다.</p>
      </div>
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
