import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "이용약관",
  description: "영양고고 서비스 이용 조건, 데이터 참고 범위, 책임 제한, 광고 표시 기준을 안내합니다.",
  alternates: {
    canonical: absoluteUrl("/terms")
  },
  openGraph: {
    title: `이용약관 | ${siteConfig.name}`,
    description: "영양고고 이용약관과 데이터 참고 범위입니다.",
    url: absoluteUrl("/terms")
  }
};

export default function TermsPage() {
  return (
    <article className="section legal-page">
      <p className="eyebrow">Terms</p>
      <h1>이용약관</h1>
      <p className="legal-lead">
        본 약관은 영양고고 사이트 이용 조건과 정보 제공 범위를 설명합니다. 사이트를 이용하면 본 약관에 동의한
        것으로 봅니다.
      </p>

      <section>
        <h2>서비스 성격</h2>
        <p>
          영양고고는 식품영양성분 데이터와 해석 기준을 제공하는 정보 서비스입니다. 의료 행위, 진단, 치료,
          처방, 개인별 식단 상담을 제공하지 않습니다.
        </p>
      </section>

      <section>
        <h2>데이터 참고 범위</h2>
        <p>
          표시되는 영양성분은 공공데이터와 제공기관의 갱신 상태에 따라 실제 제품 라벨과 차이가 있을 수
          있습니다. 최종 구매와 섭취 전에는 제품 포장지의 최신 표시사항을 확인해야 합니다.
        </p>
      </section>

      <section>
        <h2>금지 행위</h2>
        <ul>
          <li>사이트 내용을 무단으로 대량 수집해 원출처 표시 없이 재배포하는 행위</li>
          <li>서비스 안정성을 해치는 자동화 요청 또는 비정상 접근</li>
          <li>타인의 권리나 개인정보를 침해하는 문의 또는 게시 요청</li>
        </ul>
      </section>

      <section>
        <h2>광고와 외부 링크</h2>
        <p>
          사이트에는 Google AdSense 광고와 공공데이터·제공기관으로 이동하는 외부 링크가 표시될 수 있습니다.
          외부 사이트의 내용과 개인정보 처리 방식은 해당 사이트의 정책을 따릅니다.
        </p>
      </section>
    </article>
  );
}
