import type { Metadata } from "next";
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
      </div>
    </article>
  );
}
