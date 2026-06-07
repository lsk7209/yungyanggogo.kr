import { getPostBySlug } from "../../../../lib/blog";
import { getPostThumbnailSvg } from "../../../../lib/post-thumbnail";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(getPostThumbnailSvg(post), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400"
    }
  });
}
