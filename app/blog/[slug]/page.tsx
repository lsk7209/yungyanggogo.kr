import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "../../../components/TableOfContents";
import { getAllPosts, getPostBySlug, getPostUrl } from "../../../lib/blog";
import { absoluteUrl, siteConfig } from "../../../lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: getPostUrl(post)
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: getPostUrl(post),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt
    },
    robots: post.noindex ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${getPostUrl(post)}#article`,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: getPostUrl(post),
    publisher: {
      "@id": absoluteUrl("/#organization")
    },
    author: {
      "@type": "Organization",
      name: `${siteConfig.name} 데이터 편집팀`
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "블로그",
        item: absoluteUrl("/blog")
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: getPostUrl(post)
      }
    ]
  };

  return (
    <article className="article-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([articleSchema, breadcrumbSchema]) }}
      />
      <header className="article-header">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p>{post.description}</p>
        <div className="article-meta">
          <time dateTime={post.publishedAt}>발행 {post.publishedAt}</time>
          <time dateTime={post.updatedAt}>검토 {post.updatedAt}</time>
          <span>{post.readingMinutes}분</span>
        </div>
      </header>
      <TableOfContents sections={post.sections} />
      <div className="article-body">
        {post.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <section id="next-actions" className="article-links">
          <h2>식품영양성분 비교를 계속 확인하기</h2>
          <p>
            아래 링크에서 영양고고의 비교 원칙과 관련 글을 이어서 확인할 수 있습니다. 공식 데이터 출처도 함께
            남겨 수치의 기준을 직접 검토할 수 있게 했습니다.
          </p>
          <div className="link-panel">
            <h3>내부 링크</h3>
            <ul>
              {post.internalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                  <span>{link.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="link-panel">
            <h3>공식 출처</h3>
            <ul>
              {post.sourceLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                  <span>{link.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <Link className="button article-cta" href="/blog">
            식품영양성분 블로그 더 보기
          </Link>
        </section>
      </div>
    </article>
  );
}
