import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "../../components/PostCard";
import { getAllPosts } from "../../lib/blog";
import { parseBoundedPositiveInteger } from "../../lib/nutrition-query";
import { absoluteUrl, siteConfig } from "../../lib/site";

const PAGE_SIZE = 24;

type PageProps = { searchParams?: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseBoundedPositiveInteger(params?.page, 1, 10_000);
  const canonicalPath = page > 1 ? `/blog?page=${page}` : "/blog";
  const title = page > 1 ? `식품영양성분 블로그 ${page}페이지` : "식품영양성분 블로그";
  const description = "식품영양성분 비교 기준, 데이터 출처, 영양성분표 해석 원칙을 정리한 블로그 글 목록입니다.";
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(canonicalPath),
    },
  };
}

// 블로그 목록은 파일시스템 읽기만 하므로 DB 히트 없음 — 1시간 ISR로 전환
export const revalidate = 3600;

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseBoundedPositiveInteger(params?.page, 1, 10_000);
  const posts = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  if (page > totalPages) notFound();
  const visiblePosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">Blog</p>
        <h1>식품영양성분 블로그 글 목록</h1>
        <p>
          식품영양성분을 비교할 때 필요한 기준량, 출처, 표현 가드레일을
          정리합니다.
        </p>
      </div>
      <div className="card-grid">
        {visiblePosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <nav className="pagination-nav" aria-label="블로그 페이지 이동">
        {page > 1 ? <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}>이전</Link> : <span>이전</span>}
        <strong>{page} / {totalPages}</strong>
        {page < totalPages ? <Link href={`/blog?page=${page + 1}`}>다음</Link> : <span>다음</span>}
      </nav>
    </section>
  );
}
