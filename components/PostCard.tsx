import Link from "next/link";
import type { BlogPost } from "../lib/blog";

type PostCardProps = {
  post: BlogPost;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post-card">
      <Link className="post-card__media" href={`/blog/${post.slug}`} aria-label={`${post.title} 읽기`}>
        <span>{post.category}</span>
      </Link>
      <div className="post-card__body">
        <p className="eyebrow">{post.category}</p>
        <h2>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.description}</p>
        <div className="post-card__meta">
          <time dateTime={post.publishedAt}>{post.publishedAt}</time>
          <span>{post.readingMinutes}분</span>
        </div>
      </div>
    </article>
  );
}
