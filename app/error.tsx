"use client";

import Link from "next/link";

// Temporary provider/DB failures land here with a 5xx status instead of an
// empty 200 page or a false 404.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">일시적인 오류</p>
        <h1>지금은 자료를 불러오지 못했습니다</h1>
        <p>
          데이터 제공 상태가 일시적으로 불안정할 수 있습니다. 이 화면은 검색 결과가 0건이라는 뜻이 아니며,
          자료가 삭제되었다는 뜻도 아닙니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <p>
        <button type="button" className="button" onClick={() => reset()}>다시 시도</button>{" "}
        <Link href="/">홈으로 이동</Link>
      </p>
    </section>
  );
}
