import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "../lib/blog";
import { getPostThumbnail } from "../lib/post-thumbnail";

type PostCardProps = {
  post: BlogPost;
};

export function PostCard({ post }: PostCardProps) {
  const thumbnail = getPostThumbnail(post);

  return (
    <article className="post-card">
      <Link className="post-card__media" href={`/blog/${post.slug}`} aria-label={`${post.title} 읽기`}>
        <Image
          src={thumbnail}
          alt={`${post.title} 썸네일`}
          width={960}
          height={420}
          sizes="(max-width: 860px) 100vw, 50vw"
          unoptimized
        />
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
