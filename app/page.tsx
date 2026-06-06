import Link from "next/link";
import { getAllPosts } from "../lib/blog";

export default function HomePage() {
  const latestPost = getAllPosts()[0];

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">식품영양성분 pSEO</p>
          <h1>영양고고</h1>
          <p>
            식품영양성분을 100g, 100kcal, 기준량, 출처로 정리해 목적형 식품 비교와 랭킹 허브를 만들기 위한
            데이터 중심 사이트입니다.
          </p>
          <div className="hero__actions">
            <Link className="button" href="/blog">
              글 목록 보기
            </Link>
            <a className="button button--secondary" href="/ads.txt">
              ads.txt 확인
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <p className="eyebrow">운영 원칙</p>
          <h2>단일 점수보다 기준과 맥락을 먼저 봅니다</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h3>정규화 비교</h3>
            <p>100g, 100ml, 100kcal 기준을 분리해 1회제공량 착시를 줄입니다.</p>
          </article>
          <article>
            <h3>다축 지표</h3>
            <p>단백질만 보지 않고 당류, 나트륨, 포화지방을 함께 확인합니다.</p>
          </article>
          <article>
            <h3>표현 가드레일</h3>
            <p>저당·저열량 같은 표현은 기준과 측정값, 충족 여부를 같이 보여줍니다.</p>
          </article>
        </div>
      </section>

      {latestPost ? (
        <section className="section section--muted">
          <div className="section__head">
            <p className="eyebrow">최근 글</p>
            <h2>{latestPost.title}</h2>
            <p>{latestPost.description}</p>
          </div>
          <Link className="text-link" href={`/blog/${latestPost.slug}`}>
            글 읽기
          </Link>
        </section>
      ) : null}
    </>
  );
}
