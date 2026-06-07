import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "영양고고 소개",
  description:
    "영양고고는 식품영양성분 공공데이터를 기준량, 출처, 갱신일과 함께 정리하는 데이터 중심 식품영양 정보 사이트입니다.",
  alternates: {
    canonical: absoluteUrl("/about")
  },
  openGraph: {
    title: `영양고고 소개 | ${siteConfig.name}`,
    description: "영양고고의 운영 목적, 데이터 기준, 건강 정보 표현 원칙을 확인합니다.",
    url: absoluteUrl("/about")
  }
};

export default function AboutPage() {
  return (
    <article className="section legal-page">
      <p className="eyebrow">About</p>
      <h1>영양고고 소개</h1>
      <p className="legal-lead">
        영양고고는 식품영양성분을 광고 문구가 아니라 기준량, 수치, 출처, 갱신일로 비교하기 위한 데이터
        사이트입니다. 사용자가 제품을 고르기 전에 열량, 단백질, 당류, 나트륨, 제공 단위량을 같은 기준으로
        확인할 수 있도록 정리합니다.
      </p>

      <section>
        <h2>운영 목적</h2>
        <p>
          식품과 건강기능식품 정보는 제품명이나 홍보 표현만으로 판단하기 어렵습니다. 영양고고는 공공데이터와
          제품 단위 영양성분을 활용해 사용자가 직접 비교할 수 있는 근거를 제공합니다.
        </p>
      </section>

      <section>
        <h2>다루는 정보</h2>
        <ul>
          <li>전국통합식품영양성분정보 표준데이터</li>
          <li>음식, 가공식품, 원재료성 식품 영양성분</li>
          <li>건강기능식품 제품별 영양성분과 품목제조신고번호</li>
          <li>기준량, 열량, 단백질, 지방, 탄수화물, 당류, 나트륨 등 주요 지표</li>
        </ul>
      </section>

      <section>
        <h2>건강 정보 원칙</h2>
        <p>
          영양고고는 특정 제품의 치료 효과, 질병 예방, 의학적 효능을 보증하지 않습니다. 수치는 선택을 돕는
          참고 정보이며, 질환·복용약·임신·알레르기 등 개인 조건이 있는 경우 전문가 상담과 제품 라벨 확인이
          우선입니다.
        </p>
      </section>

      <section>
        <h2>관련 페이지</h2>
        <p>
          데이터 출처와 글 작성 기준은 <Link href="/editorial-policy">편집·출처 정책</Link>에서 확인할 수
          있습니다. 문의는 <Link href="/contact">문의 페이지</Link>를 이용해 주세요.
        </p>
      </section>
    </article>
  );
}
