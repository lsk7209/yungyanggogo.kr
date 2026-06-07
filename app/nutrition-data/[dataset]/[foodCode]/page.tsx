import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchNationalNutritionItemDetail
} from "../../../../lib/national-nutrition-db";
import {
  getNationalNutritionDataset,
  NATIONAL_NUTRITION_DATASETS,
  NATIONAL_NUTRITION_SOURCE,
  type NationalNutritionDatasetSlug,
  type NationalNutritionItem
} from "../../../../lib/national-nutrition-api";
import { absoluteUrl, siteConfig } from "../../../../lib/site";

export const dynamic = "force-dynamic";
export const preferredRegion = "icn1";

type PageProps = {
  params: Promise<{
    dataset: string;
    foodCode: string;
  }>;
};

const datasetSlugs = new Set(NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dataset, foodCode } = await params;
  if (!isDatasetSlug(dataset)) {
    return {};
  }
  const datasetSlug = dataset;

  const { item } = await fetchNationalNutritionItemDetail({ dataset: datasetSlug, foodCode: decodeURIComponent(foodCode) });
  if (!item) {
    return {
      title: "식품영양성분 상세 정보",
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const datasetInfo = getNationalNutritionDataset(datasetSlug);
  const title = `${item.name} 영양성분표: 열량·단백질·당류·나트륨`;
  const description = `${item.name}의 기준량 ${item.servingUnit || "확인 필요"}, 열량 ${item.energy || "-"}kcal, 단백질 ${item.protein || "-"}g, 당류 ${item.sugars || "-"}g, 나트륨 ${item.sodium || "-"}mg 정보를 ${datasetInfo.shortName} 표준데이터 기준으로 확인합니다.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`)
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`)
    }
  };
}

export default async function NationalNutritionDetailPage({ params }: PageProps) {
  const { dataset, foodCode } = await params;
  if (!isDatasetSlug(dataset)) {
    notFound();
  }
  const datasetSlug = dataset;

  const decodedFoodCode = decodeURIComponent(foodCode);
  const datasetInfo = getNationalNutritionDataset(datasetSlug);
  const { item, cacheSource } = await fetchNationalNutritionItemDetail({ dataset: datasetSlug, foodCode: decodedFoodCode });

  if (!item) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`);
  const primaryMetrics = [
    ["기준량", item.servingUnit || "-"],
    ["열량", formatUnit(item.energy, "kcal")],
    ["단백질", formatUnit(item.protein, "g")],
    ["지방", formatUnit(item.fat, "g")],
    ["탄수화물", formatUnit(item.carbs, "g")],
    ["당류", formatUnit(item.sugars, "g")],
    ["나트륨", formatUnit(item.sodium, "mg")],
    ["식이섬유", formatUnit(item.fiber, "g")]
  ];
  const micronutrients = [
    ["칼슘", formatUnit(item.calcium, "mg")],
    ["철", formatUnit(item.iron, "mg")],
    ["칼륨", formatUnit(item.potassium, "mg")],
    ["비타민 A", formatUnit(item.vitaminA, "ug RAE")],
    ["비타민 C", formatUnit(item.vitaminC, "mg")],
    ["비타민 D", formatUnit(item.vitaminD, "ug")],
    ["포화지방산", formatUnit(item.saturatedFat, "g")],
    ["트랜스지방산", formatUnit(item.transFat, "g")]
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${item.name} 영양성분 상세 정보`,
    description: `${item.name}의 영양성분, 기준량, 출처, 갱신일을 ${datasetInfo.name} 기준으로 표시합니다.`,
    url: pageUrl,
    isBasedOn: NATIONAL_NUTRITION_SOURCE,
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/")
    },
    variableMeasured: primaryMetrics.map(([name, value]) => ({
      "@type": "PropertyValue",
      name,
      value
    }))
  };

  return (
    <article className="section nutrition-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link>
        <span>/</span>
        <Link href="/nutrition-data">통합영양</Link>
        <span>/</span>
        <span>{datasetInfo.shortName}</span>
      </nav>

      <header className="nutrition-detail-header">
        <p className="eyebrow">{datasetInfo.shortName} 영양성분 상세</p>
        <h1>{item.name} 영양성분표</h1>
        <p>
          {item.name}의 기준량, 열량, 단백질, 지방, 탄수화물, 당류, 나트륨을 공식 표준데이터 기준으로
          확인합니다. 수치는 제품 선택을 돕는 참고 정보이며, 실제 섭취 전에는 제품 라벨과 갱신일을 함께
          확인해야 합니다.
        </p>
        <div className="keyword-row">
          <span>{item.typeName || datasetInfo.shortName}</span>
          <span>{item.largeCategory || "대분류 미기재"}</span>
          <span>{item.representativeFood || "대표식품 미기재"}</span>
          <span>{cacheSource === "db" ? "Turso DB 저장 데이터" : "API 확인 데이터"}</span>
        </div>
      </header>

      <section className="nutrition-detail-summary">
        {primaryMetrics.slice(0, 4).map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{item.servingUnit || "기준량 확인 필요"}</em>
          </article>
        ))}
      </section>

      <section className="nutrition-detail-section">
        <h2>{item.name} 주요 영양성분</h2>
        <div className="nutrition-table">
          {primaryMetrics.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </div>
      </section>

      <section className="nutrition-detail-section">
        <h2>미량영양소와 지방산</h2>
        <div className="nutrition-table">
          {micronutrients.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </div>
      </section>

      <section className="nutrition-detail-section">
        <h2>출처와 제품 식별 정보</h2>
        <dl className="source-detail-list">
          <div>
            <dt>식품코드</dt>
            <dd>{item.foodCode}</dd>
          </div>
          <div>
            <dt>데이터셋</dt>
            <dd>{datasetInfo.name}</dd>
          </div>
          <div>
            <dt>분류</dt>
            <dd>{[item.originName, item.largeCategory, item.representativeFood, item.middleCategory].filter(Boolean).join(" · ") || "-"}</dd>
          </div>
          <div>
            <dt>제조사/제공처</dt>
            <dd>{item.maker || item.restaurant || item.importer || item.distributor || "-"}</dd>
          </div>
          <div>
            <dt>원산지</dt>
            <dd>{item.originCountry || "-"}</dd>
          </div>
          <div>
            <dt>출처</dt>
            <dd>{item.sourceName || NATIONAL_NUTRITION_SOURCE}</dd>
          </div>
          <div>
            <dt>데이터 생성일</dt>
            <dd>{item.createdAt || "-"}</dd>
          </div>
          <div>
            <dt>데이터 갱신일</dt>
            <dd>{item.updatedAt || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="warning-panel">
        <h2>해석 전 확인할 점</h2>
        <p>
          같은 식품명이라도 브랜드, 조리법, 중량, 리뉴얼 여부에 따라 실제 영양성분이 달라질 수 있습니다.
          이 페이지는 {datasetInfo.name}의 공개 데이터를 보기 쉽게 정리한 것이며, 치료·예방·추천을 의미하지
          않습니다.
        </p>
      </section>

      <section className="link-panel">
        <h2>함께 확인할 데이터</h2>
        <ul>
          <li>
            <Link href="/nutrition-data">전국통합 식품영양성분정보 조회</Link>
            <span>다른 음식, 가공식품, 원재료성 식품과 비교합니다.</span>
          </li>
          <li>
            <Link href="/rankings">식품영양성분 랭킹</Link>
            <span>열량, 단백질, 당류, 나트륨 기준의 비교 흐름을 확인합니다.</span>
          </li>
          <li>
            <Link href="/editorial-policy">편집·출처 정책</Link>
            <span>영양고고의 데이터 출처와 표현 제한 원칙을 확인합니다.</span>
          </li>
        </ul>
      </section>
    </article>
  );
}

function isDatasetSlug(value: string): value is NationalNutritionDatasetSlug {
  return datasetSlugs.has(value as NationalNutritionDatasetSlug);
}

function formatUnit(value: string, unit: string) {
  return value ? `${value} ${unit}` : "-";
}
