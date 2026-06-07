import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "문의",
  description: "영양고고 데이터 오류, 출처, 개인정보, 일반 문의 접수 방법을 안내합니다.",
  alternates: {
    canonical: absoluteUrl("/contact")
  },
  openGraph: {
    title: `문의 | ${siteConfig.name}`,
    description: "영양고고 운영자에게 데이터 오류와 일반 문의를 전달하는 방법입니다.",
    url: absoluteUrl("/contact")
  }
};

export default function ContactPage() {
  return (
    <article className="section legal-page">
      <p className="eyebrow">Contact</p>
      <h1>문의</h1>
      <p className="legal-lead">
        영양고고의 데이터 오류, 출처 표시, 개인정보, 일반 문의는 아래 연락처로 접수합니다. 제품 추천, 진단,
        치료 상담은 제공하지 않습니다.
      </p>

      <section>
        <h2>연락처</h2>
        <p>
          이메일: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        </p>
      </section>

      <section>
        <h2>문의 시 포함하면 좋은 정보</h2>
        <ul>
          <li>문제가 발생한 페이지 주소</li>
          <li>식품명 또는 제품명</li>
          <li>오류로 보이는 항목과 확인한 근거</li>
          <li>회신을 받을 이메일 주소</li>
        </ul>
      </section>

      <section>
        <h2>처리 기준</h2>
        <p>
          접수된 내용은 공식 데이터 원천, 페이지 표시 로직, 최근 갱신일을 기준으로 검토합니다. 공공데이터의
          원천 값 자체가 다른 경우에는 제공기관 갱신 이후 반영될 수 있습니다.
        </p>
      </section>
    </article>
  );
}
