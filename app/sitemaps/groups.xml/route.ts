import { isTursoConfigured } from "../../../lib/db";
import { GROUP_DATASETS, groupSlug } from "../../../lib/nutrition-group";
import { loadGroups } from "../../../lib/nutrition-group-data";
import { renderUrlSet, sitemapXmlResponse, type SitemapUrl } from "../../../lib/sitemap-xml";
import { absoluteUrl } from "../../../lib/site";

export const revalidate = 86400;
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isTursoConfigured) return sitemapXmlResponse(renderUrlSet([]));
  try {
    const urls: SitemapUrl[] = [];
    for (const dataset of GROUP_DATASETS) {
      const groups = await loadGroups(dataset);
      if (!groups.length) continue;
      urls.push({ url: absoluteUrl(`/nutrition-data/${dataset}/group`), changeFrequency: "weekly", priority: 0.7 });
      for (const group of groups) {
        urls.push({
          url: absoluteUrl(`/nutrition-data/${dataset}/group/${encodeURIComponent(groupSlug(group.name))}`),
          // Latest source record date among the group's records, not today's date.
          lastModified: group.latestUpdatedAt,
          changeFrequency: "monthly",
          priority: 0.68,
        });
      }
    }
    return sitemapXmlResponse(renderUrlSet(urls));
  } catch {
    return sitemapXmlResponse(renderUrlSet([]), { status: 503, cacheControl: "no-store" });
  }
}
