import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TableOfContents } from "../../../components/TableOfContents";
import { getAllPosts, getPostBySlug, getPostUrl } from "../../../lib/blog";
import { absoluteUrl, siteConfig } from "../../../lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getAllPosts({ includeScheduled: true }).map((post) => ({ slug: post.slug }));
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
        <p className="article-subtitle">{post.subtitle}</p>
        <p>{post.description}</p>
        <div className="keyword-row" aria-label="글 핵심 키워드">
          <span>{post.mainKeyword}</span>
          {post.expandedKeywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
        <div className="article-meta">
          <time dateTime={post.publishedAt}>발행 {post.publishedAt}</time>
          <time dateTime={post.updatedAt}>검토 {post.updatedAt}</time>
          <span>{post.readingMinutes}분</span>
        </div>
      </header>
      <TableOfContents sections={post.sections} />
      <div className="article-insights" aria-label="핵심 요약">
        {post.summaryCards.map((card) => (
          <div key={card.label} className="insight-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
      <div className="comparison-table" aria-label="기준량 비교 표">
        <div className="comparison-table__head">
          <span>비교 기준</span>
          <span>잘 맞는 상황</span>
          <span>주의점</span>
        </div>
        {post.comparisonRows.map((row) => (
          <div key={row.basis} className="comparison-table__row">
            <strong>{row.basis}</strong>
            <span>{row.bestFor}</span>
            <span>{row.caution}</span>
          </div>
        ))}
      </div>
      <div className="article-body">
        {post.dataPoints && post.dataPoints.length > 0 ? (
          <section className="data-point-panel" aria-label="핵심 데이터 포인트">
            {post.dataPoints.map((point) => (
              <div key={point.label}>
                <span>{point.label}</span>
                <strong>{point.value}</strong>
                <p>{point.note}</p>
              </div>
            ))}
          </section>
        ) : null}
        {post.warningBox ? (
          <section className="warning-panel">
            <h2>{post.warningBox.title}</h2>
            <p>{post.warningBox.body}</p>
          </section>
        ) : null}
        {post.steps && post.steps.length > 0 ? (
          <section className="step-panel">
            <h2>{post.mainKeyword} 판단 순서</h2>
            <ol>
              {post.steps.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <span>{step.body}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {post.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
        <section id="checklist" className="check-panel">
          <h2>영양성분표 비교 전 체크리스트</h2>
          <ul>
            {post.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        {post.faq && post.faq.length > 0 ? (
          <section id="faq" className="faq-panel">
            <h2>{post.mainKeyword} FAQ</h2>
            {post.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>
        ) : null}
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
