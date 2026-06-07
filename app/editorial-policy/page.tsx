import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "편집·출처 정책",
  description: "영양고고의 공공데이터 출처 표시, 콘텐츠 작성 기준, 건강기능식품 표현 제한 정책입니다.",
  alternates: {
    canonical: absoluteUrl("/editorial-policy")
  },
  openGraph: {
    title: `편집·출처 정책 | ${siteConfig.name}`,
    description: "영양고고 데이터 출처와 편집 원칙을 확인합니다.",
    url: absoluteUrl("/editorial-policy")
  }
};

export default function EditorialPolicyPage() {
  return (
    <article className="section legal-page">
      <p className="eyebrow">Editorial Policy</p>
      <h1>편집·출처 정책</h1>
      <p className="legal-lead">
        영양고고는 식품영양성분을 과장하지 않고, 공식 출처와 기준량을 함께 표시하는 것을 편집 원칙으로
        삼습니다.
      </p>

      <section>
        <h2>주요 데이터 출처</h2>
        <ul>
          <li>공공데이터포털 전국통합식품영양성분정보 표준데이터</li>
          <li>전국건강기능식품영양성분정보 표준데이터</li>
          <li>식품의약품안전처 제공 식품·건강기능식품 관련 공개 데이터</li>
        </ul>
      </section>

      <section>
        <h2>글 작성 기준</h2>
        <p>
          글은 검색어를 반복하는 방식이 아니라 사용자가 실제로 혼동하는 기준량, 제공 단위, 비교 지표, 출처
          차이를 설명하는 방식으로 작성합니다. 제목과 부제는 핵심 키워드를 포함하되, 질병 치료나 확정적 효능을
          암시하지 않습니다.
        </p>
      </section>

      <section>
        <h2>건강기능식품 표현 제한</h2>
        <p>
          건강기능식품은 질병 예방·치료 표현, 특정 제품 추천처럼 오해될 수 있는 표현을 피합니다. 데이터
          페이지는 제품별 영양성분, 제공 단위량, 신고번호, 출처 확인을 돕는 용도로 운영합니다.
        </p>
      </section>

      <section>
        <h2>오류 수정</h2>
        <p>
          데이터 오류나 출처 표시 문제가 의심되는 경우 <Link href="/contact">문의 페이지</Link>로 알려주시면
          원천 데이터와 표시 로직을 확인해 수정합니다.
        </p>
      </section>
    </article>
  );
}
