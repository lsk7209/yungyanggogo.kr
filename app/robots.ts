import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "Google-Extended", "CCBot"],
        allow: "/",
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
