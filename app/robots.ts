import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "../lib/site";

// 검색/필터 URL은 각 페이지의 metadata에서 noindex로 제어한다.
// robots.txt에서 모든 query를 막으면 page=2의 canonical/noindex를 크롤러가 확인할 수 없다.
const CRAWL_BLOCK = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: CRAWL_BLOCK,
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "CCBot"],
        allow: "/",
        disallow: CRAWL_BLOCK,
      },
      {
        userAgent: [
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "OAI-SearchBot",
          "Yeti",
          "Daumoa",
        ],
        allow: "/",
        disallow: CRAWL_BLOCK,
      },
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
