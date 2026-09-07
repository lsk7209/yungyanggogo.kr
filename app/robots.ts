import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "../lib/site";

// 봇이 쿼리파라미터 조합(?q=, ?page= 등)과 API를 무한 크롤하면
// Turso reads가 폭주하므로 차단 (정적 콘텐츠 경로는 그대로 허용)
const CRAWL_BLOCK = ["/*?", "/api/"];

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
