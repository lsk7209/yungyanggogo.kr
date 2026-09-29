import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNationalNutritionDataset } from "../../../../../lib/national-nutrition-api";
import {
  groupSlug,
  analyzeGroup,
  formatGroupNumber,
  GROUP_NUTRIENTS,
  isGroupDataset,
  MIN_GROUP_SIZE,
} from "../../../../../lib/nutrition-group";
import { loadGroupItems, loadPublishableGroups, resolveGroup } from "../../../../../lib/nutrition-group-data";
import { buildComparisonItemValue } from "../../../../../lib/comparison-selection";
import { serializeJsonLd } from "../../../../../lib/json-ld";
import { absoluteUrl, siteConfig } from "../../../../../lib/site";

export const revalidate = 86400;

// An empty list makes every path ISR: rendered on first visit, then cached.
// Without generateStaticParams Next 16 renders these routes on every request.
export function generateStaticParams() {
  return [];
}

type PageProps = { params: Promise<{ dataset: string; slug: string }> };

async function load(params: PageProps["params"]) {
  const { dataset, slug } = await params;
  if (!isGroupDataset(dataset)) return null;
  const group = await resolveGroup(dataset, decodeURIComponent(slug));
  if (!group) return null;
  const items = await loadGroupItems(dataset, group.name);
  return { dataset, slug: decodeURIComponent(slug), group, items, analysis: analyzeGroup(items), datasetInfo: getNationalNutritionDataset(dataset) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "식품군 영양성분 비교", robots: { index: false, follow: true } };
  const { group, analysis, datasetInfo, dataset, slug } = data;
  const energy = analysis.stats.find((stat) => stat.key === "energy");
  const path = `/nutrition-data/${dataset}/group/${encodeURIComponent(slug)}`;
  const title = `${group.name} 영양성분 비교: ${datasetInfo.shortName} ${group.count}종 ${analysis.basisLabel}`;
  const description = `${group.name} ${group.count}종의 ${analysis.basisLabel} 열량·단백질·당류·나트륨을 공공데이터 기준으로 비교합니다.${energy?.median != null ? ` ${analysis.basisLabel} 열량 중앙값 ${formatGroupNumber(energy.median, "kcal")}.` : ""}`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    // Publish for search only when enough records share one comparable basis.
    robots: analysis.comparable.length < MIN_GROUP_SIZE ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} | ${siteConfig.name}`, description, url: absoluteUrl(path) },
  };
}

export default async function NutritionGroupPage({ params }: PageProps) {
  const data = await load(params);
  if (!data) notFound();
  const { dataset, slug, group, analysis, datasetInfo } = data;
  const path = `/nutrition-data/${dataset}/group/${encodeURIComponent(slug)}`;
  const energy = analysis.stats.find((stat) => stat.key === "energy");
  const sodium = analysis.stats.find((stat) => stat.key === "sodium");
  const updatedDates = data.items.map((item) => item.updatedAt).filter(Boolean).sort();
  // Related groups: same large category (source classification), largest first.
  let related: Awaited<ReturnType<typeof loadPublishableGroups>> = [];
  try {
    const publishable = (await loadPublishableGroups(dataset)).filter((other) => other.name !== group.name);
    related = group.largeCategory ? publishable.filter((other) => other.largeCategory === group.largeCategory).slice(0, 8) : [];
    if (related.length < 3) related = [...related, ...publishable.filter((other) => !related.includes(other))].slice(0, 8);
  } catch {
    related = [];
  }

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${group.name} 영양성분 비교`,
      url: absoluteUrl(path),
      isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absoluteUrl("/") },
      about: datasetInfo.name,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: datasetInfo.shortName, item: absoluteUrl(`/nutrition-data/${dataset}`) },
        { "@type": "ListItem", position: 3, name: "식품군별 비교", item: absoluteUrl(`/nutrition-data/${dataset}/group`) },
        { "@type": "ListItem", position: 4, name: group.name, item: absoluteUrl(path) },
      ],
    },
  ];

  return (
    <article className="section nutrition-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link><span>/</span>
        <Link href={`/nutrition-data/${dataset}`}>{datasetInfo.shortName}</Link><span>/</span>
        <Link href={`/nutrition-data/${dataset}/group`}>식품군별 비교</Link><span>/</span>
        <span>{group.name}</span>
      </nav>

      <header className="nutrition-detail-header">
        <p className="eyebrow">{datasetInfo.shortName} 식품군 비교</p>
        <h1>{group.name} 영양성분 비교 ({group.count}종)</h1>
        <p>
          공공데이터에서 대표식품이 &lsquo;{group.name}&rsquo;로 분류된 {group.count}개 자료를 {analysis.basisLabel} 같은 기준으로 맞춰 봤습니다.
          {energy?.median != null ? ` ${analysis.basisLabel} 열량은 중앙값 ${formatGroupNumber(energy.median, "kcal")}, 범위 ${formatGroupNumber(energy.min, "kcal")}~${formatGroupNumber(energy.max, "kcal")}(${energy.n}개 기준)입니다.` : ""}
          {sodium?.median != null ? ` 나트륨은 중앙값 ${formatGroupNumber(sodium.median, "mg")}, 범위 ${formatGroupNumber(sodium.min, "mg")}~${formatGroupNumber(sodium.max, "mg")}(${sodium.n}개 기준)입니다.` : ""}
        </p>
        <p>
          제품 순위가 아닙니다. 같은 이름이라도 조리법·제조사·기준량이 달라 값이 크게 다를 수 있으니, 관심 있는 식품은 상세 페이지에서 원자료를 확인하세요.
        </p>
      </header>

      <section className="nutrition-detail-section">
        <h2>{analysis.basisLabel} 요약</h2>
        <div className="comparison-table-scroll" role="region" aria-label={`${group.name} ${analysis.basisLabel} 요약`} tabIndex={0}>
          <table className="basis-calculator__table">
            <thead>
              <tr><th scope="col">영양성분</th><th scope="col">최저</th><th scope="col">중앙값</th><th scope="col">최고</th><th scope="col">계산된 자료 수</th></tr>
            </thead>
            <tbody>
              {analysis.stats.map((stat) => (
                <tr key={stat.key}>
                  <th scope="row">{stat.label}</th>
                  <td>{formatGroupNumber(stat.min, stat.unit)}</td>
                  <td>{formatGroupNumber(stat.median, stat.unit)}</td>
                  <td>{formatGroupNumber(stat.max, stat.unit)}</td>
                  <td>{stat.n} / {analysis.comparable.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {analysis.basis === "per100ml" ? (
          <p className="basis-calculator__note">
            이 식품군은 원자료 기준량이 ml(부피)로 표기된 자료가 많아 100ml당으로 비교했습니다. 음료가 아닌 음식인데 ml로 표기된 경우도 원자료 표기를 그대로 옮긴 것이며, g 기준 식품군과는 직접 비교하지 않습니다.
          </p>
        ) : null}
        <p className="basis-calculator__note">
          값이 비어 있거나 미검출·미량으로 표기된 자료는 0으로 넣지 않고 계산에서 뺐습니다. &lsquo;계산된 자료 수&rsquo;가 성분마다 다른 이유입니다.
        </p>
      </section>

      <section className="nutrition-detail-section">
        <h2>{group.name} 자료별 {analysis.basisLabel} 영양성분</h2>
        <p>이름순으로 정렬했습니다. 식품명을 누르면 원자료 기준량·출처·원자료 기준일을 볼 수 있습니다.</p>
        <div className="comparison-table-scroll" role="region" aria-label={`${group.name} 자료별 영양성분`} tabIndex={0}>
          <table className="basis-calculator__table">
            <thead>
              <tr>
                <th scope="col">식품명</th>
                <th scope="col">원자료 기준량</th>
                {GROUP_NUTRIENTS.map((nutrient) => <th key={nutrient.key} scope="col">{nutrient.label}</th>)}
                <th scope="col"><span className="visually-hidden">비교</span></th>
              </tr>
            </thead>
            <tbody>
              {analysis.comparable.map(({ item, values }) => (
                <tr key={item.foodCode}>
                  <th scope="row">
                    <Link href={`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`}>{item.name}</Link>
                    <small>{[item.maker || item.restaurant || item.importer, item.typeName].filter(Boolean).join(" · ")}</small>
                  </th>
                  <td>{item.servingUnit}</td>
                  {GROUP_NUTRIENTS.map((nutrient) => (
                    <td key={nutrient.key}>{formatGroupNumber(values[nutrient.key].value, nutrient.unit)}</td>
                  ))}
                  <td>
                    <Link href={`/compare?item=${encodeURIComponent(buildComparisonItemValue(dataset, item.foodCode))}`}>비교 담기</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {analysis.otherDimension.length + analysis.unsupportedBasis.length + analysis.duplicates.length > 0 ? (
        <section className="nutrition-detail-section">
          <h2>이 표에서 뺀 자료</h2>
          {analysis.otherDimension.length + analysis.unsupportedBasis.length > 0 ? (
            <p>
              기준량 단위가 달라(g↔ml) 밀도 정보 없이 같은 기준으로 바꿀 수 없거나 기준량이 숫자로 표기되지 않은 {analysis.otherDimension.length + analysis.unsupportedBasis.length}개 자료는 표에서 제외했습니다.
            </p>
          ) : null}
          {analysis.duplicates.length > 0 ? (
            <p>
              식품명·업체·기준량·영양성분 값이 표의 다른 자료와 똑같이 한 번 더 등록된 {analysis.duplicates.length}개 자료는 중앙값이 한쪽으로 쏠리지 않도록 한 번만 셌습니다.
            </p>
          ) : null}
          <ul>
            {[...analysis.otherDimension, ...analysis.unsupportedBasis].slice(0, 30).map((item) => (
              <li key={item.foodCode}>
                <Link href={`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`}>{item.name}</Link> ({item.servingUnit || "기준량 자료 없음"})
              </li>
            ))}
            {analysis.duplicates.slice(0, 30).map((item) => (
              <li key={item.foodCode}>
                <Link href={`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`}>{item.name}</Link> (중복 등록 자료)
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section className="nutrition-detail-section">
          <h2>{group.largeCategory && related.every((other) => other.largeCategory === group.largeCategory) ? `${group.largeCategory} 분류의 다른 식품군` : "함께 볼 식품군"}</h2>
          <ul className="group-index">
            {related.map((other) => (
              <li key={other.name}>
                <Link href={`/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(other.name))}`}>{other.name}</Link>
                <span>{other.count}종</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="warning-panel">
        <h2>자료 범위와 한계</h2>
        <p>
          이 비교는 영양고고에 저장된 {datasetInfo.name} 자료 중 대표식품이 &lsquo;{group.name}&rsquo;인 항목만 포함하며, 시판 제품 전체를 뜻하지 않습니다.
          {updatedDates.length ? ` 포함된 자료의 원자료 기준일은 ${updatedDates[0]}~${updatedDates[updatedDates.length - 1]}입니다.` : ""}
          {" "}의학적·영양학적 권고가 아니며, 실제 섭취 전에는 제품 라벨을 확인하세요.
        </p>
      </section>

      <section className="link-panel">
        <h2>함께 쓰는 기능</h2>
        <ul>
          <li><Link href={`/nutrition-data/${dataset}/group`}>{datasetInfo.shortName} 식품군 목록</Link><span>다른 식품군의 비교표를 봅니다.</span></li>
          <li><Link href={`/nutrition-data/${dataset}?q=${encodeURIComponent(group.name)}`}>&lsquo;{group.name}&rsquo; 이름으로 검색</Link><span>이름에 &lsquo;{group.name}&rsquo;이 들어간 다른 자료까지 찾습니다.</span></li>
          <li><Link href="/tools/label-converter">영양성분표 100g 환산 계산기</Link><span>가지고 있는 제품 라벨을 같은 기준으로 바꿔 비교합니다.</span></li>
        </ul>
      </section>
    </article>
  );
}
