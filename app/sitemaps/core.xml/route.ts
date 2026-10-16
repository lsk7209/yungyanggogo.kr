import { getMeaningfulModifiedAt, toIsoDateTime } from "../../../lib/blog-dates";
import { getAllPosts, getPostUrl } from "../../../lib/blog";
import { foods, getFoodUrl } from "../../../lib/foods";
import { NATIONAL_NUTRITION_DATASETS } from "../../../lib/national-nutrition-api";
import { renderUrlSet, sitemapXmlResponse, type SitemapUrl } from "../../../lib/sitemap-xml";
import { absoluteUrl } from "../../../lib/site";
import { staticInfoPages } from "../../../lib/static-pages";

// Hourly so scheduled posts appear in the sitemap soon after they publish.
export const revalidate = 3600;

// 정적 페이지와 데이터셋 목록은 검증된 수정일 기록이 없어 lastmod를 생략한다(고정 과거 날짜를 변경일처럼 쓰지 않음).
// 글은 의미 있는 수정일, 식품 안내는 자료에 기록된 updatedAt만 사용한다.
export async function GET() {
  const urls: SitemapUrl[] = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/rankings"), changeFrequency: "weekly", priority: 0.85 },
    { url: absoluteUrl("/nutrition-data"), changeFrequency: "daily", priority: 0.84 },
    // /compare is intentionally absent: it is a noindex tool page.
    { url: absoluteUrl("/tools/label-converter"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/health-functional-foods"), changeFrequency: "daily", priority: 0.82 },
    { url: absoluteUrl("/health-functional-food-nutrition"), changeFrequency: "daily", priority: 0.82 },
    ...staticInfoPages.map((page) => ({
      url: absoluteUrl(page.href),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...NATIONAL_NUTRITION_DATASETS.map((dataset) => ({
      url: absoluteUrl(`/nutrition-data/${dataset.slug}`),
      changeFrequency: "daily" as const,
      priority: 0.76,
    })),
    ...getAllPosts().filter((post) => !post.noindex).map((post) => ({
      url: getPostUrl(post),
      lastModified: getMeaningfulModifiedAt(post) ?? toIsoDateTime(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...foods.filter((food) => !food.isExample).map((food) => ({
      url: getFoodUrl(food),
      lastModified: food.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.72,
    })),
  ];

  return sitemapXmlResponse(renderUrlSet(urls));
}
