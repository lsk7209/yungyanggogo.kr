import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNationalNutritionDataset } from "../../../../lib/national-nutrition-api";
import { groupSlug, isGroupDataset, MIN_GROUP_SIZE } from "../../../../lib/nutrition-group";
import { loadPublishableGroups } from "../../../../lib/nutrition-group-data";
import { absoluteUrl, siteConfig } from "../../../../lib/site";

export const revalidate = 86400;

type PageProps = { params: Promise<{ dataset: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dataset } = await params;
  if (!isGroupDataset(dataset)) return {};
  const info = getNationalNutritionDataset(dataset);
  const title = `${info.shortName} 식품군별 영양성분 비교`;
  const description = `${info.shortName} 자료를 대표식품별로 묶어 100g(100ml)당 열량·단백질·당류·나트륨을 비교합니다.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/nutrition-data/${dataset}/group`) },
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url: absoluteUrl(`/nutrition-data/${dataset}/group`) },
  };
}

export default async function NutritionGroupIndexPage({ params }: PageProps) {
  const { dataset } = await params;
  if (!isGroupDataset(dataset)) notFound();
  const info = getNationalNutritionDataset(dataset);
  const groups = await loadPublishableGroups(dataset);

  return (
    <section className="section blog-index">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link><span>/</span>
        <Link href={`/nutrition-data/${dataset}`}>{info.shortName}</Link><span>/</span>
        <span>식품군별 비교</span>
      </nav>
      <div className="section__head">
        <p className="eyebrow">Food Groups</p>
        <h1>{info.shortName} 식품군별 영양성분 비교</h1>
        <p>
          공공데이터의 대표식품 분류가 같은 자료를 {MIN_GROUP_SIZE}개 이상 모은 식품군만 표시합니다.
          각 식품군 페이지에서 100g(100ml)당 최저·중앙값·최고와 자료별 값을 볼 수 있습니다. 제품 순위가 아닙니다.
        </p>
      </div>
      {groups.length ? (
        <ul className="group-index">
          {groups.map((group) => (
            <li key={group.name}>
              <Link href={`/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(group.name))}`}>{group.name}</Link>
              <span>{group.count}종</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="api-status" role="status">아직 비교할 만큼 자료가 모인 식품군이 없습니다.</p>
      )}
    </section>
  );
}
