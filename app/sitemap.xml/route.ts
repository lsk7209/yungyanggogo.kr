import { isTursoConfigured } from "../../lib/db";
import { countNationalNutritionSitemapItems } from "../../lib/national-nutrition-db";
import { NATIONAL_NUTRITION_DATASETS } from "../../lib/national-nutrition-api";
import { NUTRITION_SITEMAP_PAGE_SIZE } from "../../lib/sitemap-config";
import { renderSitemapIndex, sitemapXmlResponse } from "../../lib/sitemap-xml";
import { absoluteUrl } from "../../lib/site";

export const revalidate = 86400;
export const dynamic = "force-dynamic";

export async function GET() {
  const sitemapUrls = [absoluteUrl("/sitemaps/core.xml")];

  if (isTursoConfigured) {
    try {
      const counts = await Promise.all(
        NATIONAL_NUTRITION_DATASETS.map(async (dataset) => ({
          dataset: dataset.slug,
          totalCount: await countNationalNutritionSitemapItems(dataset.slug),
        })),
      );
      for (const { dataset, totalCount } of counts) {
        const shardCount = Math.ceil(totalCount / NUTRITION_SITEMAP_PAGE_SIZE);
        for (let page = 0; page < shardCount; page += 1) {
          sitemapUrls.push(absoluteUrl(`/sitemaps/nutrition/${dataset}-${page}.xml`));
        }
      }
    } catch {
      return sitemapXmlResponse(renderSitemapIndex(sitemapUrls), {
        status: 503,
        cacheControl: "no-store",
      });
    }
  }

  return sitemapXmlResponse(renderSitemapIndex(sitemapUrls));
}
