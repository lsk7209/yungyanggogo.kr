import { absoluteUrl, siteConfig } from "./site";

export const staticInfoPages = [
  {
    href: "/about",
    title: "영양고고 소개",
    description: "영양고고의 운영 목적, 데이터 기준, 건강 정보 표현 원칙을 안내합니다."
  },
  {
    href: "/contact",
    title: "문의",
    description: "영양고고 데이터 오류, 제휴가 아닌 일반 문의, 개인정보 문의 접수 방법을 안내합니다."
  },
  {
    href: "/privacy",
    title: "개인정보처리방침",
    description: "영양고고의 개인정보 처리, 광고와 분석 도구, 문의 처리 기준을 안내합니다."
  },
  {
    href: "/terms",
    title: "이용약관",
    description: "영양고고 서비스 이용 조건, 데이터 참고 범위, 책임 제한을 안내합니다."
  },
  {
    href: "/editorial-policy",
    title: "편집·출처 정책",
    description: "공공데이터 출처 표시, 글 작성 원칙, 건강기능식품 표현 제한 기준을 안내합니다."
  }
];

export const adsenseTrustLinks = staticInfoPages.map((page) => ({
  ...page,
  url: absoluteUrl(page.href)
}));

export const organizationContactSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: absoluteUrl("/"),
  email: siteConfig.contactEmail,
  foundingDate: siteConfig.launchedAt,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: siteConfig.contactEmail,
    availableLanguage: ["ko"]
  }
};
