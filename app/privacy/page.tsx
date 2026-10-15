import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "영양고고의 개인정보 처리, 광고 쿠키와 맞춤 광고 해제 방법, Google Analytics·AdSense 사용 기준을 안내합니다.",
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
        본 방침은 2026년 6월 7일부터 적용되며, 2026년 10월 16일에 광고 쿠키와 맞춤 광고 해제 안내를 보완했습니다.
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
        <h2>분석 도구와 광고 도구</h2>
        <p>
          영양고고는 방문 통계 확인을 위해 Google Analytics를 사용할 수 있고, 광고 제공을 위해 Google AdSense를
          사용할 수 있습니다. 두 도구는 서비스 설정에 따라 켜지거나 꺼질 수 있으며, 광고 코드는 식품 상세
          페이지 등 일부 데이터 페이지에서만 불러옵니다. 현재 설정에서 도구가 꺼져 있으면 해당 도구는 정보를
          수집하지 않습니다. 이 방침에 적지 않은 새 광고·분석 도구를 도입하면 도입 전에 이 방침을 먼저
          개정합니다.
        </p>
      </section>

      <section>
        <h2>광고 쿠키와 맞춤 광고</h2>
        <p>
          Google을 포함한 제3자 광고 제공업체는 쿠키를 사용해 사용자가 이 사이트나 다른 웹사이트를 이전에
          방문한 기록을 바탕으로 광고를 제공합니다. Google의 광고 쿠키를 통해 Google과 파트너는 사용자의 이
          사이트 및 인터넷상 다른 사이트 방문 기록에 따라 광고를 보여줄 수 있습니다.
        </p>
        <ul>
          <li>
            사용자는 <a href="https://www.google.com/settings/ads" rel="noopener noreferrer" target="_blank">Google 광고 설정</a>
            에서 개인 맞춤 광고를 해제할 수 있습니다.
          </li>
          <li>
            또는 <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer" target="_blank">aboutads.info</a>
            에서 제3자 광고 제공업체의 맞춤 광고용 쿠키 사용을 해제할 수 있습니다.
          </li>
          <li>
            Google이 파트너 사이트의 정보를 사용하는 방식은{" "}
            <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">
              Google의 데이터 사용 안내
            </a>
            에서 확인할 수 있습니다.
          </li>
          <li>브라우저 설정에서 쿠키 저장을 제한하거나 삭제할 수도 있습니다. 이 경우 일부 기능이 제한될 수 있습니다.</li>
        </ul>
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
