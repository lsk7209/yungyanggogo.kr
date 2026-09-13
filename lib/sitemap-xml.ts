export type SitemapUrl = {
  url: string;
  lastModified?: string | Date | null;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export function renderSitemapIndex(urls: string[]) {
  const entries = urls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join("");
  return xmlDocument(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`);
}

export function renderUrlSet(urls: SitemapUrl[]) {
  const entries = urls.map((entry) => {
    const lastModified = entry.lastModified
      ? `<lastmod>${escapeXml(formatDate(entry.lastModified))}</lastmod>`
      : "";
    const changeFrequency = entry.changeFrequency
      ? `<changefreq>${entry.changeFrequency}</changefreq>`
      : "";
    const priority = entry.priority === undefined ? "" : `<priority>${entry.priority}</priority>`;
    return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}</url>`;
  }).join("");
  return xmlDocument(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`);
}

export function sitemapXmlResponse(
  xml: string,
  options: { status?: number; cacheControl?: string } = {},
) {
  return new Response(xml, {
    status: options.status,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": options.cacheControl || "public, max-age=0, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}

function xmlDocument(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>${body}`;
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
