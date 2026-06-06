import type { Metadata } from "next";
import { PostCard } from "../../components/PostCard";
import { getAllPosts } from "../../lib/blog";
import { absoluteUrl, siteConfig } from "../../lib/site";

export const metadata: Metadata = {
  title: "블로그",
  description: "식품영양성분 비교 기준, 데이터 출처, SEO 운영 원칙을 정리한 글 목록입니다.",
  alternates: {
    canonical: absoluteUrl("/blog")
  },
  openGraph: {
    title: `블로그 | ${siteConfig.name}`,
    description: "식품영양성분 비교 기준과 데이터 운영 원칙을 확인합니다.",
    url: absoluteUrl("/blog")
  }
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section className="section blog-index">
      <div className="section__head">
        <p className="eyebrow">Blog</p>
        <h1>글 목록</h1>
        <p>식품영양성분을 비교할 때 필요한 기준량, 출처, 표현 가드레일을 정리합니다.</p>
      </div>
      <div className="card-grid">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
