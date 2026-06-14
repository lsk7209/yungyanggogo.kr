import type { MetadataRoute } from "next";
import { getAllPosts, getPostUrl } from "../lib/blog";
import { foods, getFoodUrl } from "../lib/foods";
import { isTursoConfigured } from "../lib/db";
import { readNationalNutritionItemsFromDb } from "../lib/national-nutrition-db";
import { NATIONAL_NUTRITION_DATASETS } from "../lib/national-nutrition-api";
import { absoluteUrl } from "../lib/site";
import { staticInfoPages } from "../lib/static-pages";

// 사이트맵은 하루 1회 재생성으로 충분 — force-dynamic 제거로 봇 재방문 시 DB 재조회 방지
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/rankings"),
      lastModified: new Date("2026-06-06"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/nutrition-data"),
      lastModified: new Date("2026-06-07"),
      changeFrequency: "daily",
      priority: 0.84,
    },
    {
      url: absoluteUrl("/health-functional-foods"),
      lastModified: new Date("2026-06-07"),
      changeFrequency: "daily",
      priority: 0.82,
    },
    {
      url: absoluteUrl("/health-functional-food-nutrition"),
      lastModified: new Date("2026-06-07"),
      changeFrequency: "daily",
      priority: 0.82,
    },
  ];

  const postRoutes = getAllPosts().map((post) => ({
    url: getPostUrl(post),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const foodRoutes = foods.map((food) => ({
    url: getFoodUrl(food),
    lastModified: new Date("2026-06-06"),
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));

  const trustRoutes = staticInfoPages.map((page) => ({
    url: absoluteUrl(page.href),
    lastModified: new Date("2026-06-07"),
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  const nutritionDetailRoutes = await getNutritionDetailRoutes();
  const nutritionDatasetRoutes = NATIONAL_NUTRITION_DATASETS.map((dataset) => ({
    url: absoluteUrl(`/nutrition-data/${dataset.slug}`),
    lastModified: new Date("2026-06-07"),
    changeFrequency: "daily" as const,
    priority: 0.76,
  }));

  return [
    ...staticRoutes,
    ...trustRoutes,
    ...nutritionDatasetRoutes,
    ...nutritionDetailRoutes,
    ...postRoutes,
    ...foodRoutes,
  ];
}

async function getNutritionDetailRoutes(): Promise<MetadataRoute.Sitemap> {
  if (!isTursoConfigured) {
    return [];
  }

  try {
    const results = await Promise.all(
      NATIONAL_NUTRITION_DATASETS.map(async (dataset) => {
        const { foods: nutritionItems } =
          await readNationalNutritionItemsFromDb({
            dataset: dataset.slug,
            numOfRows: 500,
          });

        return nutritionItems.map((item) => ({
          url: absoluteUrl(
            `/nutrition-data/${dataset.slug}/${encodeURIComponent(item.foodCode)}`,
          ),
          lastModified: new Date(item.updatedAt || "2026-06-07"),
          changeFrequency: "monthly" as const,
          priority: 0.62,
        }));
      }),
    );

    return results.flat();
  } catch {
    return [];
  }
}
