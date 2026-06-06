import type { MetadataRoute } from "next";
import { getAllPosts, getPostUrl } from "../lib/blog";
import { absoluteUrl } from "../lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];

  const postRoutes = getAllPosts().map((post) => ({
    url: getPostUrl(post),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  return [...staticRoutes, ...postRoutes];
}
