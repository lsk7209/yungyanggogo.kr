import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false, follow: true },
};

// Real absence keeps HTTP 404; nothing here redirects to the home page.
export default function NotFound() {
  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">404</p>
        <h1>요청한 페이지를 찾을 수 없습니다</h1>
        <p>
          주소가 바뀌었거나 더 이상 제공하지 않는 페이지입니다. 식품 자료라면 영양고고에서
          현재 확인할 수 있는 범위에 없다는 뜻이며, 공식 원천 전체의 미등록을 의미하지는 않습니다.
        </p>
      </div>
      <form className="data-search" action="/nutrition-data" role="search">
        <label htmlFor="not-found-search">식품명 검색</label>
        <div>
          <input id="not-found-search" name="q" type="search" placeholder="식품명의 핵심 단어를 입력하세요" />
          <button type="submit">검색</button>
        </div>
      </form>
      <section className="link-panel">
        <h2>다른 곳에서 찾기</h2>
        <ul>
          <li><Link href="/">홈</Link><span>영양고고 첫 화면으로 이동합니다.</span></li>
          <li><Link href="/blog">성분표 읽는 법</Link><span>공개된 기준 글 목록을 확인합니다.</span></li>
        </ul>
      </section>
    </section>
  );
}
