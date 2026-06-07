import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "영양고고의 개인정보 처리, 문의 이메일, Google Analytics와 Google AdSense 사용 기준을 안내합니다.",
  alternates: {
    canonical: absoluteUrl("/privacy")
  },
  openGraph: {
    title: `개인정보처리방침 | ${siteConfig.name}`,
    description: "영양고고 개인정보 처리와 광고·분석 도구 사용 기준입니다.",
    url: absoluteUrl("/privacy")
  }
};

export default function PrivacyPage() {
  return (
    <article className="section legal-page">
      <p className="eyebrow">Privacy Policy</p>
      <h1>개인정보처리방침</h1>
      <p className="legal-lead">
        영양고고는 서비스 운영, 문의 응대, 통계 분석, 광고 제공을 위해 필요한 범위에서만 정보를 처리합니다.
        본 방침은 2026년 6월 7일부터 적용됩니다.
      </p>

      <section>
        <h2>수집하는 정보</h2>
        <p>
          사이트는 회원가입을 운영하지 않으며 이름, 주민등록번호, 결제정보를 직접 수집하지 않습니다. 사용자가
          이메일 문의를 보내는 경우 이메일 주소, 문의 내용, 회신에 필요한 정보가 처리될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>자동으로 처리될 수 있는 정보</h2>
        <p>
          접속 로그, 브라우저 정보, 기기 정보, 대략적인 지역, 방문 페이지, 쿠키 식별자 등이 보안, 통계,
          광고 품질 관리를 위해 처리될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>Google Analytics와 Google AdSense</h2>
        <p>
          영양고고는 방문 통계 확인을 위해 Google Analytics를, 광고 제공을 위해 Google AdSense를 사용할 수
          있습니다. Google은 쿠키 또는 유사 기술을 사용해 광고 성과 측정과 맞춤 광고 제공을 수행할 수
          있습니다. 사용자는 브라우저 설정에서 쿠키 저장을 제한할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>보유 기간</h2>
        <p>
          문의 이메일은 처리 목적 달성 후 불필요해진 경우 삭제합니다. 법령상 보관이 필요한 정보는 해당 기간
          동안 보관될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>문의</h2>
        <p>
          개인정보 관련 문의는 <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>로
          연락해 주세요.
        </p>
      </section>
    </article>
  );
}
