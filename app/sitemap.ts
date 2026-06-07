import type { MetadataRoute } from "next";
import { getAllPosts, getPostUrl } from "../lib/blog";
import { foods, getFoodUrl } from "../lib/foods";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-dynamic";

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
    },
    {
      url: absoluteUrl("/rankings"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 0.85
    },
    {
      url: absoluteUrl("/health-functional-foods"),
      lastModified: new Date("2026-06-07"),
      changeFrequency: "daily",
      priority: 0.82
    },
    {
      url: absoluteUrl("/health-functional-food-nutrition"),
      lastModified: new Date("2026-06-07"),
      changeFrequency: "daily",
      priority: 0.82
    }
  ];

  const postRoutes = getAllPosts().map((post) => ({
    url: getPostUrl(post),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7
  }));

  const foodRoutes = foods.map((food) => ({
    url: getFoodUrl(food),
    lastModified: new Date("2026-06-06"),
    changeFrequency: "monthly" as const,
    priority: 0.72
  }));

  return [...staticRoutes, ...postRoutes, ...foodRoutes];
}
