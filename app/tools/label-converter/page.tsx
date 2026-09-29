import type { Metadata } from "next";
import Link from "next/link";
import { NutritionBasisCalculator } from "../../../components/NutritionBasisCalculator";
import { defaultLabelNutrients } from "../../../lib/label-nutrients";
import { serializeJsonLd } from "../../../lib/json-ld";
import { absoluteUrl, siteConfig } from "../../../lib/site";

const path = "/tools/label-converter";
const title = "영양성분표 100g 환산 계산기";
const description = "제품 영양성분표의 기준량과 수치를 넣으면 100g(100ml)당, 100kcal당, 내가 먹는 양 기준으로 바로 환산합니다. 빈칸은 0으로 계산하지 않습니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl(path) },
  openGraph: { title: `${title} | ${siteConfig.name}`, description, url: absoluteUrl(path) },
};

export default function LabelConverterPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description,
    url: absoluteUrl(path),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: siteConfig.name, url: absoluteUrl("/") },
  };

  return (
    <section className="section blog-index">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">홈</Link><span>/</span><span>도구</span><span>/</span><span>100g 환산 계산기</span>
      </nav>
      <div className="section__head">
        <p className="eyebrow">Label Converter</p>
        <h1>{title}</h1>
        <p>
          포장지 영양성분표는 제품마다 기준량(1회 제공량, 총내용량, 100g)이 달라 숫자를 그대로 비교하기 어렵습니다.
          기준량과 표시된 수치를 입력하면 같은 기준으로 바꿔 보여 줍니다. 입력값은 브라우저 안에서만 계산하며 저장하거나 전송하지 않습니다.
        </p>
      </div>

      <NutritionBasisCalculator editable nutrients={defaultLabelNutrients()} servingUnit="" />

      <section className="nutrition-detail-section">
        <h2>사용 방법</h2>
        <ol>
          <li>영양성분표 상단의 기준량(예: &lsquo;1회 제공량 45g&rsquo; 또는 &lsquo;총 내용량 200ml&rsquo;)을 입력합니다.</li>
          <li>표에 적힌 열량, 당류, 나트륨 등의 수치를 같은 기준량 그대로 옮겨 적습니다. 모르는 칸은 비워 둡니다.</li>
          <li>100g(또는 100ml)당 값으로 제품 간 밀도를 비교하고, 100kcal당 값으로 열량 대비 구성을 봅니다.</li>
          <li>&lsquo;내가 먹는 양&rsquo;에 실제로 먹을 양을 넣으면 그 양에 들어 있는 수치를 계산합니다.</li>
        </ol>
      </section>

      <section className="nutrition-detail-section">
        <h2>계산 기준과 한계</h2>
        <ul>
          <li>환산식: 환산값 = 표시값 × 목표량 ÷ 기준량. 100kcal당 값 = 표시값 × 100 ÷ 표시 열량.</li>
          <li>&lsquo;0&rsquo;을 입력하면 0으로, 빈칸은 &lsquo;자료 없음&rsquo;으로 둡니다. 미검출·미량 같은 표기는 수치로 바꾸지 않습니다.</li>
          <li>g 기준량을 ml 섭취량으로(또는 반대로) 바꾸려면 밀도가 필요하므로 계산하지 않습니다.</li>
          <li>표시값의 반올림 때문에 환산 결과는 실제 함량과 약간 다를 수 있습니다. 강조표시(저당·고단백 등) 충족 여부는 판정하지 않습니다.</li>
        </ul>
      </section>

      <section className="link-panel">
        <h2>함께 쓰는 기능</h2>
        <ul>
          <li><Link href="/nutrition-data">식품 영양성분 검색</Link><span>공공데이터에 등록된 식품의 영양성분을 찾아 비교 목록에 담습니다.</span></li>
          <li><Link href="/rankings">비교 기준 안내</Link><span>100g·100kcal·1회 제공량 중 어떤 기준이 목적에 맞는지 확인합니다.</span></li>
        </ul>
      </section>
    </section>
  );
}
