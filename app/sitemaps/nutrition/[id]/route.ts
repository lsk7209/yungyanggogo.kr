import { notFound } from "next/navigation";
import { readNationalNutritionSitemapItems } from "../../../../lib/national-nutrition-db";
import { NATIONAL_NUTRITION_DATASETS, type NationalNutritionDatasetSlug } from "../../../../lib/national-nutrition-api";
import { NUTRITION_SITEMAP_PAGE_SIZE } from "../../../../lib/sitemap-config";
import { renderUrlSet, sitemapXmlResponse } from "../../../../lib/sitemap-xml";
import { absoluteUrl } from "../../../../lib/site";

export const revalidate = 86400;
export const dynamic = "force-dynamic";

const datasetSlugs = new Set(NATIONAL_NUTRITION_DATASETS.map((dataset) => dataset.slug));

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = /^(all|food|process|material|health)-(0|[1-9]\d*)\.xml$/.exec(id);
  if (!match || !datasetSlugs.has(match[1] as NationalNutritionDatasetSlug)) {
    notFound();
  }

  const dataset = match[1] as NationalNutritionDatasetSlug;
  const page = Number(match[2]);
  const items = await readNationalNutritionSitemapItems({
    dataset,
    page,
    pageSize: NUTRITION_SITEMAP_PAGE_SIZE,
  });
  if (items.length === 0) {
    notFound();
  }

  return sitemapXmlResponse(renderUrlSet(items.map((item) => ({
    url: absoluteUrl(`/nutrition-data/${dataset}/${encodeURIComponent(item.foodCode)}`),
    lastModified: item.updatedAt,
    changeFrequency: "monthly",
    priority: 0.62,
  }))));
}
