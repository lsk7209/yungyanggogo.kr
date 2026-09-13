import { getAllPosts, getPostUrl } from "../../../lib/blog";
import { foods, getFoodUrl } from "../../../lib/foods";
import { NATIONAL_NUTRITION_DATASETS } from "../../../lib/national-nutrition-api";
import { renderUrlSet, sitemapXmlResponse, type SitemapUrl } from "../../../lib/sitemap-xml";
import { absoluteUrl } from "../../../lib/site";
import { staticInfoPages } from "../../../lib/static-pages";

export const revalidate = 86400;

export async function GET() {
  const urls: SitemapUrl[] = [
    { url: absoluteUrl("/"), lastModified: "2026-09-12", changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: "2026-09-12", changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/rankings"), lastModified: "2026-09-12", changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/nutrition-data"), lastModified: "2026-09-12", changeFrequency: "daily", priority: 0.84 },
    { url: absoluteUrl("/compare"), lastModified: "2026-09-12", changeFrequency: "weekly", priority: 0.75 },
    { url: absoluteUrl("/health-functional-foods"), lastModified: "2026-09-12", changeFrequency: "daily", priority: 0.82 },
    { url: absoluteUrl("/health-functional-food-nutrition"), lastModified: "2026-09-12", changeFrequency: "daily", priority: 0.82 },
    ...staticInfoPages.map((page) => ({
      url: absoluteUrl(page.href),
      lastModified: "2026-09-12",
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...NATIONAL_NUTRITION_DATASETS.map((dataset) => ({
      url: absoluteUrl(`/nutrition-data/${dataset.slug}`),
      lastModified: "2026-09-12",
      changeFrequency: "daily" as const,
      priority: 0.76,
    })),
    ...getAllPosts().filter((post) => !post.noindex).map((post) => ({
      url: getPostUrl(post),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...foods.filter((food) => !food.isExample).map((food) => ({
      url: getFoodUrl(food),
      lastModified: "2026-09-12",
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
  ];

  return sitemapXmlResponse(renderUrlSet(urls));
}
